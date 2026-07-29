#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-db.sh"
CRON_SCHEDULE="${CRON_SCHEDULE:-0 2 * * *}"

# Prefer project logs dir if writable, else /var/log
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DEFAULT_CRON_LOG="$PROJECT_DIR/logs/cron-backup.log"
CRON_LOG="${CRON_LOG:-$DEFAULT_CRON_LOG}"

mkdir -p "$(dirname "$CRON_LOG")"

chmod +x "$BACKUP_SCRIPT" "$SCRIPT_DIR/restore-db.sh" "$SCRIPT_DIR/lib/backup-common.sh" 2>/dev/null || true

MARKER="jas backup-db.sh"
# Use absolute path; load env via script itself
CRON_LINE="$CRON_SCHEDULE $BACKUP_SCRIPT >> $CRON_LOG 2>&1 # $MARKER"

(
  crontab -l 2>/dev/null | grep -v "$MARKER" || true
  echo "$CRON_LINE"
) | crontab -

echo "Cron job installed:"
echo "  $CRON_LINE"
echo ""
echo "Verify with: crontab -l"
echo "Logs:        $CRON_LOG"
echo "             $PROJECT_DIR/logs/backup.log"
