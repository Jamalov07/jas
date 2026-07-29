#!/usr/bin/env bash
# Shared helpers for backup-db.sh and restore-db.sh
# shellcheck disable=SC2034

# ─── Colors ──────────────────────────────────────────────────────────────────
if [[ -t 1 ]] && [[ "${NO_COLOR:-}" != "1" ]]; then
  C_RESET=$'\033[0m'
  C_RED=$'\033[0;31m'
  C_GREEN=$'\033[0;32m'
  C_YELLOW=$'\033[0;33m'
  C_BLUE=$'\033[0;34m'
  C_CYAN=$'\033[0;36m'
  C_BOLD=$'\033[1m'
else
  C_RESET='' C_RED='' C_GREEN='' C_YELLOW='' C_BLUE='' C_CYAN='' C_BOLD=''
fi

# ─── Config loaders ──────────────────────────────────────────────────────────
load_env() {
  local project_dir="$1"
  if [[ -f "$project_dir/.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "$project_dir/.env"
    set +a
  fi
}

init_backup_config() {
  local project_dir="$1"

  # Project name = root folder basename (not from .env)
  PROJECT_NAME="$(basename "$project_dir")"

  # Retention is fixed (not configurable via .env)
  LOCAL_RETENTION_DAYS=7
  REMOTE_RETENTION_DAYS=30

  DB_USER="${DB_USER:-jas_user}"
  DB_NAME="${DB_NAME:-jas_db}"
  DB_SERVICE="${DB_SERVICE:-db}"
  APP_SERVICE="${APP_SERVICE:-app}"

  BACKUP_DIR="${BACKUP_DIR:-$project_dir/backups}"
  LOG_DIR="${LOG_DIR:-$project_dir/logs}"
  BACKUP_LOG="${BACKUP_LOG:-$LOG_DIR/backup.log}"
  RESTORE_LOG="${RESTORE_LOG:-$LOG_DIR/restore.log}"
  LOCK_FILE="${LOCK_FILE:-$LOG_DIR/backup.lock}"

  RCLONE_REMOTE="${RCLONE_REMOTE:-gdrive:${PROJECT_NAME}/backups}"
  RCLONE_ENABLED="${RCLONE_ENABLED:-true}"

  BOT_TOKEN="${BOT_TOKEN:-}"
  BACKUP_CHANNEL_ID="${BACKUP_CHANNEL_ID:-}"
  TELEGRAM_ENABLED="${TELEGRAM_ENABLED:-true}"

  MIN_FREE_MB="${MIN_FREE_MB:-500}"
  LOG_MAX_BYTES="${LOG_MAX_BYTES:-10485760}" # 10 MiB
  DRY_RUN="${DRY_RUN:-false}"
  VERBOSE="${VERBOSE:-false}"
}

ensure_dirs() {
  mkdir -p "$BACKUP_DIR" "$LOG_DIR"
}

# ─── Logging ─────────────────────────────────────────────────────────────────
rotate_log_if_needed() {
  local log_file="$1"
  [[ -f "$log_file" ]] || return 0
  local size
  size="$(wc -c <"$log_file" | tr -d ' ')"
  if (( size >= LOG_MAX_BYTES )); then
    local rotated="${log_file}.$(date +%Y%m%d_%H%M%S)"
    mv "$log_file" "$rotated"
    gzip -f "$rotated" 2>/dev/null || true
    # Keep last 5 rotated logs
    find "$(dirname "$log_file")" -name "$(basename "$log_file").*.gz" -type f \
      | sort -r | tail -n +6 | xargs -r rm -f
  fi
}

_log_to_file() {
  local log_file="$1"
  shift
  rotate_log_if_needed "$log_file"
  printf '%s\n' "$*" >>"$log_file"
}

log_info() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $*"
  echo "${C_CYAN}${msg}${C_RESET}"
  if [[ -n "${CURRENT_LOG:-}" ]]; then
    _log_to_file "$CURRENT_LOG" "$msg"
  fi
}

log_ok() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $*"
  echo "${C_GREEN}${msg}${C_RESET}"
  if [[ -n "${CURRENT_LOG:-}" ]]; then
    _log_to_file "$CURRENT_LOG" "$msg"
  fi
}

log_warn() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $*"
  echo "${C_YELLOW}${msg}${C_RESET}" >&2
  if [[ -n "${CURRENT_LOG:-}" ]]; then
    _log_to_file "$CURRENT_LOG" "$msg"
  fi
}

log_error() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*"
  echo "${C_RED}${msg}${C_RESET}" >&2
  if [[ -n "${CURRENT_LOG:-}" ]]; then
    _log_to_file "$CURRENT_LOG" "$msg"
  fi
}

log_verbose() {
  if [[ "$VERBOSE" == "true" ]]; then
    log_info "$*"
  fi
}

# ─── Utilities ───────────────────────────────────────────────────────────────
human_size() {
  local bytes="$1"
  if command -v numfmt >/dev/null 2>&1; then
    numfmt --to=iec --suffix=B "$bytes"
  else
    awk -v b="$bytes" 'BEGIN {
      split("B KB MB GB TB", u, " ")
      i = 1
      while (b >= 1024 && i < 5) { b /= 1024; i++ }
      printf "%.1f %s", b, u[i]
    }'
  fi
}

seconds_since() {
  local start="$1"
  echo $(( $(date +%s) - start ))
}

check_disk_space() {
  local path="$1"
  local min_mb="${2:-$MIN_FREE_MB}"
  local avail_kb
  avail_kb="$(df -Pk "$path" | awk 'NR==2 {print $4}')"
  local avail_mb=$(( avail_kb / 1024 ))
  log_verbose "Free disk space on $path: ${avail_mb} MB (min required: ${min_mb} MB)"
  if (( avail_mb < min_mb )); then
    log_error "Insufficient disk space: ${avail_mb} MB free, need at least ${min_mb} MB"
    return 1
  fi
}

db_is_running() {
  docker compose ps --status running "$DB_SERVICE" 2>/dev/null | grep -q "$DB_SERVICE"
}

# ─── Lock ────────────────────────────────────────────────────────────────────
acquire_lock() {
  if [[ -f "$LOCK_FILE" ]]; then
    local old_pid
    old_pid="$(cat "$LOCK_FILE" 2>/dev/null || true)"
    if [[ -n "$old_pid" ]] && kill -0 "$old_pid" 2>/dev/null; then
      log_error "Another backup is already running (PID $old_pid). Lock: $LOCK_FILE"
      return 1
    fi
    log_warn "Stale lock file found (PID $old_pid). Removing."
    rm -f "$LOCK_FILE"
  fi
  echo $$ >"$LOCK_FILE"
}

release_lock() {
  if [[ -f "$LOCK_FILE" ]]; then
    local lock_pid
    lock_pid="$(cat "$LOCK_FILE" 2>/dev/null || true)"
    if [[ "$lock_pid" == "$$" ]]; then
      rm -f "$LOCK_FILE"
    fi
  fi
}

# ─── Telegram ────────────────────────────────────────────────────────────────
send_telegram() {
  local status="$1"
  local size_human="$2"
  local reason="${3:-}"

  if [[ "$TELEGRAM_ENABLED" != "true" ]]; then
    log_verbose "Telegram notifications disabled."
    return 0
  fi

  if [[ -z "$BOT_TOKEN" || -z "$BACKUP_CHANNEL_ID" ]]; then
    log_warn "Telegram skipped: BOT_TOKEN or BACKUP_CHANNEL_ID not set."
    return 0
  fi

  local emoji
  if [[ "$status" == "SUCCESS" ]]; then
    emoji="✅"
  else
    emoji="❌"
  fi

  local text
  text="$(cat <<EOF
${emoji} *PostgreSQL Backup*

*Project:* \`${PROJECT_NAME}\`
*Database:* \`${DB_NAME}\`
*Status:* *${status}*
*Size:* ${size_human}
*Host:* \`$(hostname)\`
*Time:* $(date '+%Y-%m-%d %H:%M:%S')
EOF
)"

  if [[ -n "$reason" ]]; then
    text+=$'\n'"*Reason:* \`${reason}\`"
  fi

  if [[ "$DRY_RUN" == "true" ]]; then
    log_info "[dry-run] Would send Telegram notification: $status / $size_human"
    return 0
  fi

  local response http_code
  response="$(curl -sS -w '\n%{http_code}' -X POST \
    "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${BACKUP_CHANNEL_ID}" \
    --data-urlencode "text=${text}" \
    --data-urlencode "parse_mode=Markdown" \
    --data-urlencode "disable_web_page_preview=true" \
    2>&1)" || true

  http_code="$(echo "$response" | tail -n1)"
  if [[ "$http_code" != "200" ]]; then
    log_warn "Telegram send failed (HTTP $http_code). Check BOT_TOKEN / BACKUP_CHANNEL_ID / bot membership."
    return 0
  fi
  log_verbose "Telegram notification sent."
}

# ─── rclone helpers ──────────────────────────────────────────────────────────
rclone_remote_name() {
  echo "${RCLONE_REMOTE%%:*}"
}

rclone_is_ready() {
  if ! command -v rclone >/dev/null 2>&1; then
    log_error "rclone not found. Install: https://rclone.org/install/"
    return 1
  fi
  local remote
  remote="$(rclone_remote_name)"
  if ! rclone config show "$remote" >/dev/null 2>&1; then
    log_error "rclone remote '$remote' is not configured. Run: rclone config"
    return 1
  fi
}
