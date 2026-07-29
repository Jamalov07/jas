#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/lib/backup-common.sh"

cd "$PROJECT_DIR"

# ─── CLI ──────────────────────────────────────────────────────────────────────
usage() {
  cat <<EOF
Usage: $0 [options]

Options:
  --dry-run     Simulate backup without writing/uploading/deleting
  --verbose     Verbose logging
  --no-upload   Skip Google Drive upload (local only)
  --no-telegram Skip Telegram notification
  -h, --help    Show this help
EOF
}

CLI_DRY_RUN=""
CLI_VERBOSE=""
CLI_NO_UPLOAD=""
CLI_NO_TELEGRAM=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) CLI_DRY_RUN=true; shift ;;
    --verbose|-v) CLI_VERBOSE=true; shift ;;
    --no-upload) CLI_NO_UPLOAD=true; shift ;;
    --no-telegram) CLI_NO_TELEGRAM=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
  esac
done

load_env "$PROJECT_DIR"
init_backup_config "$PROJECT_DIR"

[[ -n "$CLI_DRY_RUN" ]] && DRY_RUN=true
[[ -n "$CLI_VERBOSE" ]] && VERBOSE=true
[[ -n "$CLI_NO_UPLOAD" ]] && RCLONE_ENABLED=false
[[ -n "$CLI_NO_TELEGRAM" ]] && TELEGRAM_ENABLED=false

CURRENT_LOG="$BACKUP_LOG"

START_TS="$(date +%s)"
START_HUMAN="$(date '+%Y-%m-%d %H:%M:%S')"
TIMESTAMP="$(date +%Y-%m-%d_%H-%M-%S)"
BACKUP_BASENAME="backup-${TIMESTAMP}.sql.gz"
BACKUP_FILE="$BACKUP_DIR/$BACKUP_BASENAME"
UPLOAD_STATUS="Skipped"
FINAL_STATUS="FAILED"
FAIL_REASON=""
BACKUP_SIZE_BYTES=0
BACKUP_SIZE_HUMAN="0 B"

cleanup() {
  local exit_code=$?
  release_lock || true

  if [[ $exit_code -ne 0 && -z "$FAIL_REASON" ]]; then
    FAIL_REASON="Script exited with code $exit_code"
  fi

  if [[ $exit_code -ne 0 ]]; then
    FINAL_STATUS="FAILED"
    write_summary_log
    send_telegram "FAILED" "${BACKUP_SIZE_HUMAN:-n/a}" "$FAIL_REASON" || true
  fi
}
trap cleanup EXIT
trap 'FAIL_REASON="Interrupted by signal"; exit 130' INT TERM

write_summary_log() {
  local duration
  duration="$(seconds_since "$START_TS")"
  {
    echo ""
    echo "[$START_HUMAN]"
    echo "Database : $DB_NAME"
    echo "Backup   : $BACKUP_BASENAME"
    echo "Size     : $BACKUP_SIZE_HUMAN"
    echo "Upload   : $UPLOAD_STATUS"
    echo "Duration : ${duration} sec"
    echo "Status   : $FINAL_STATUS"
    if [[ "$FINAL_STATUS" == "FAILED" && -n "$FAIL_REASON" ]]; then
      echo "Reason   : $FAIL_REASON"
    fi
    echo ""
  } | tee -a "$BACKUP_LOG" >/dev/null
  # Also print summary to stdout
  echo ""
  echo "${C_BOLD}── Backup Summary ──${C_RESET}"
  echo "Database : $DB_NAME"
  echo "Backup   : $BACKUP_BASENAME"
  echo "Size     : $BACKUP_SIZE_HUMAN"
  echo "Upload   : $UPLOAD_STATUS"
  echo "Duration : ${duration} sec"
  if [[ "$FINAL_STATUS" == "SUCCESS" ]]; then
    echo "Status   : ${C_GREEN}${FINAL_STATUS}${C_RESET}"
  else
    echo "Status   : ${C_RED}${FINAL_STATUS}${C_RESET}"
    [[ -n "$FAIL_REASON" ]] && echo "Reason   : $FAIL_REASON"
  fi
}

fail() {
  FAIL_REASON="$*"
  log_error "$*"
  exit 1
}

# ─── Main steps ───────────────────────────────────────────────────────────────
main() {
  ensure_dirs
  acquire_lock || fail "Could not acquire lock"

  if [[ "$DRY_RUN" == "true" ]]; then
    log_warn "DRY-RUN mode enabled — no dump/upload/delete will be performed"
  fi

  log_info "Starting backup for database '$DB_NAME' (project: $PROJECT_NAME)"

  # 1. Disk space
  check_disk_space "$BACKUP_DIR" || fail "Disk space check failed"

  # 2. DB running
  if ! db_is_running; then
    if [[ "$DRY_RUN" == "true" ]]; then
      log_warn "PostgreSQL service '$DB_SERVICE' is not running (ok in dry-run)"
    else
      fail "PostgreSQL service '$DB_SERVICE' is not running"
    fi
  fi

  # 3. pg_dump + gzip
  if [[ "$DRY_RUN" == "true" ]]; then
    log_info "[dry-run] Would run: pg_dump → gzip → $BACKUP_FILE"
    BACKUP_SIZE_HUMAN="(dry-run)"
  else
    log_info "Creating backup: $BACKUP_FILE"
    local dump_status=0
    # PIPESTATUS catches pg_dump failures even when piped to gzip
    docker compose exec -T "$DB_SERVICE" \
      pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --no-acl --clean --if-exists \
      | gzip >"$BACKUP_FILE" || dump_status=$?

    # With set -o pipefail the whole pipeline fails if either fails
    if [[ $dump_status -ne 0 ]]; then
      rm -f "$BACKUP_FILE"
      fail "pg_dump/gzip failed (exit $dump_status)"
    fi

    # 4. Validate backup
    if [[ ! -f "$BACKUP_FILE" ]]; then
      fail "Backup file was not created: $BACKUP_FILE"
    fi
    BACKUP_SIZE_BYTES="$(wc -c <"$BACKUP_FILE" | tr -d ' ')"
    if [[ "$BACKUP_SIZE_BYTES" -le 0 ]]; then
      rm -f "$BACKUP_FILE"
      fail "Backup file is empty (0 bytes)"
    fi
    BACKUP_SIZE_HUMAN="$(human_size "$BACKUP_SIZE_BYTES")"
    log_ok "Backup created: $BACKUP_BASENAME ($BACKUP_SIZE_HUMAN)"

    if command -v sha256sum >/dev/null 2>&1; then
      local checksum
      checksum="$(sha256sum "$BACKUP_FILE" | awk '{print $1}')"
      log_verbose "SHA256: $checksum"
      echo "$checksum  $BACKUP_BASENAME" >"${BACKUP_FILE}.sha256"
    fi
  fi

  # 5. Upload to Google Drive
  if [[ "$RCLONE_ENABLED" == "true" ]]; then
    if [[ "$DRY_RUN" == "true" ]]; then
      log_info "[dry-run] Would upload to $RCLONE_REMOTE/"
      UPLOAD_STATUS="Dry-run"
    else
      rclone_is_ready || fail "rclone is not ready"
      log_info "Uploading to $RCLONE_REMOTE"
      if rclone copy "$BACKUP_FILE" "$RCLONE_REMOTE/" --log-level INFO; then
        UPLOAD_STATUS="Success"
        log_ok "Upload completed"
        if [[ -f "${BACKUP_FILE}.sha256" ]]; then
          rclone copy "${BACKUP_FILE}.sha256" "$RCLONE_REMOTE/" --log-level ERROR || true
        fi
      else
        UPLOAD_STATUS="Failed"
        fail "rclone upload failed"
      fi
    fi
  else
    UPLOAD_STATUS="Disabled"
    log_info "RCLONE_ENABLED=false — upload skipped"
  fi

  # 6. Local retention
  log_info "Cleaning local backups older than ${LOCAL_RETENTION_DAYS} days"
  if [[ "$DRY_RUN" == "true" ]]; then
    find "$BACKUP_DIR" \( -name '*.sql.gz' -o -name '*.sha256' \) -type f \
      -mtime +"$LOCAL_RETENTION_DAYS" -print 2>/dev/null | while read -r f; do
      log_info "[dry-run] Would delete local: $f"
    done
  else
    find "$BACKUP_DIR" \( -name '*.sql.gz' -o -name '*.sha256' \) -type f \
      -mtime +"$LOCAL_RETENTION_DAYS" -print -delete 2>/dev/null || true
  fi

  # 7. Remote retention
  if [[ "$RCLONE_ENABLED" == "true" ]]; then
    log_info "Cleaning remote backups older than ${REMOTE_RETENTION_DAYS} days"
    if [[ "$DRY_RUN" == "true" ]]; then
      log_info "[dry-run] Would run rclone delete --min-age ${REMOTE_RETENTION_DAYS}d"
    else
      if ! rclone delete "$RCLONE_REMOTE/" \
        --min-age "${REMOTE_RETENTION_DAYS}d" \
        --log-level INFO; then
        fail "Remote retention cleanup failed"
      fi
    fi
  fi

  FINAL_STATUS="SUCCESS"
  write_summary_log
  send_telegram "SUCCESS" "$BACKUP_SIZE_HUMAN"
  log_ok "Backup finished successfully in $(seconds_since "$START_TS")s"
}

main
