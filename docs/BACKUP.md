# Database Backup va Restore

Loyiha **PostgreSQL 16** (`postgres:16-alpine`) ishlatadi. Backup scriptlari Docker Compose orqali ishlaydi.

Har kuni soat **02:00** da:
1. `pg_dump` → `gzip`
2. Google Drive'ga yuklash (`rclone`)
3. Serverda 7 kundan eski backuplarni o'chirish
4. Drive'da 30 kundan eski backuplarni o'chirish
5. Natijani `logs/backup.log` ga yozish
6. Telegram group/kanalga success/failure xabar yuborish

## Talablar

- Ishlayotgan `docker compose` stack (`db` va `app`)
- `.env` da `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- [rclone](https://rclone.org/) o'rnatilgan va Google Drive remote sozlangan
- Telegram: bot token + backup group/kanal

## Tez sozlash

### 1. rclone (Google Drive)

```bash
# O'rnatish (Debian/Ubuntu)
curl https://rclone.org/install.sh | sudo bash

# Sozlash
rclone config
# n) New remote
# name> gdrive
# Storage> drive
# keyingi qadamlarni ekrandagi ko'rsatma bo'yicha to'ldiring
```

Agar serverda boshqa loyiha uchun `gdrive` allaqachon sozlangan bo'lsa, qayta sozlash shart emas:

```bash
rclone mkdir gdrive:jas/backups
rclone lsd gdrive:jas/
```

### 2. `.env` sozlash

`.env.backup.example` dagi qiymatlarni asosiy `.env` ga qo'shing:

```env
RCLONE_REMOTE=gdrive:jas/backups
RCLONE_ENABLED=true
TELEGRAM_ENABLED=true
BACKUP_CHANNEL_ID=-100xxxxxxxxx
```

`PROJECT_NAME` root papka nomidan avtomatik (`jas`). Retention: lokal **7** kun, Drive **30** kun (static).

`DB_USER` / `DB_PASSWORD` / `DB_NAME` allaqachon `.env` da bo'lishi kerak (default: `jas_user` / `jas_db`).

### 3. Telegram backup group/kanal

1. Botni groupga qo'shing va admin qiling
2. Group ID ni oling (`getUpdates` yoki `@getidsbot`)
3. `.env` ga yozing:

```env
BACKUP_CHANNEL_ID=-100xxxxxxxxxx
```

Mavjud `BOT_TOKEN` ishlatiladi. Boshqa loyihalar bilan bir xil group ishlatilsa ham bo'ladi — xabarda `Project: jas` ko'rinadi.

### 4. Script huquqlari

```bash
chmod +x scripts/backup-db.sh scripts/restore-db.sh scripts/install-backup-cron.sh
```

### 5. Qo'lda backup (tekshiruv)

```bash
./scripts/backup-db.sh --dry-run --verbose
./scripts/backup-db.sh --verbose
```

Fayl formati: `backups/backup-2026-07-29_02-00-01.sql.gz`

### 6. Kunlik cron (02:00)

```bash
./scripts/install-backup-cron.sh
```

Boshqa vaqt:

```bash
CRON_SCHEDULE="0 2 * * *" ./scripts/install-backup-cron.sh
```

Tekshirish:

```bash
crontab -l
```

## Backup qanday ishlaydi

1. Lock file — bir vaqtda faqat bitta backup
2. Disk bo'sh joy tekshiruvi (`MIN_FREE_MB`)
3. `pg_dump` (Docker `db` servisi) + `gzip`
4. Fayl mavjudligi va hajm > 0 tekshiruvi (+ ixtiyoriy SHA256)
5. `rclone copy` → Google Drive (`gdrive:jas/backups`)
6. Lokal retention (7 kun)
7. Remote retention (30 kun)
8. `logs/backup.log` + Telegram xabar

## Restore

**Diqqat:** Restore paytida `app` servisi vaqtincha to'xtatiladi. Oldin yangi backup oling.

```bash
./scripts/restore-db.sh --list
./scripts/restore-db.sh backups/backup-2026-07-29_02-00-01.sql.gz

./scripts/restore-db.sh --list-remote
./scripts/restore-db.sh --from-remote backup-2026-07-29_02-00-01.sql.gz
```

## Loglar

```bash
tail -f logs/backup.log
tail -f logs/restore.log
tail -f logs/cron-backup.log
```

## CLI flaglar

| Flag | Tavsif |
|------|--------|
| `--dry-run` | Simulyatsiya |
| `--verbose` | Batafsil log |
| `--no-upload` | Faqat lokal |
| `--no-telegram` | Telegram xabarsiz |

## Muammolarni hal qilish

| Muammo | Yechim |
|--------|--------|
| `PostgreSQL service is not running` | `docker compose up -d db` |
| `rclone not found` | rclone o'rnating |
| `rclone remote is not configured` | `rclone config` → `gdrive` |
| Telegram kelmayapti | Bot groupda adminmi? `BACKUP_CHANNEL_ID` to'g'rimi? |
| `Another backup is already running` | `logs/backup.lock` ni tekshiring |
| Cron ishlamayapti | `crontab -l`, `logs/cron-backup.log` |

## Papka strukturasi

```text
jas/
├── backups/
├── logs/
├── scripts/
│   ├── backup-db.sh
│   ├── restore-db.sh
│   ├── install-backup-cron.sh
│   └── lib/backup-common.sh
├── .env
└── .env.backup.example
```
