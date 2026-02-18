#!/bin/bash
# Ежедневный бэкап PostgreSQL
# Добавить в cron: 0 3 * * * /opt/ad-testing-saas/scripts/backup.sh

BACKUP_DIR="/opt/backups/adtesting"
DAYS_KEEP=14

mkdir -p "$BACKUP_DIR"

FILENAME="adtesting_$(date +%Y%m%d_%H%M%S).sql.gz"

docker compose -f /opt/ad-testing-saas/docker-compose.prod.yml exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-adtest}" "${POSTGRES_DB:-adtesting}" | gzip > "$BACKUP_DIR/$FILENAME"

if [ $? -eq 0 ]; then
  echo "Backup created: $FILENAME ($(du -h "$BACKUP_DIR/$FILENAME" | cut -f1))"
else
  echo "ERROR: Backup failed!" >&2
  exit 1
fi

# Удалить старые бэкапы
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$DAYS_KEEP -delete
echo "Cleaned up backups older than $DAYS_KEEP days"
