#!/bin/bash
# Script de backup automático do PostgreSQL
# Executa diariamente às 3 AM via cron

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/elevare-website/.backups"
DATABASE_URL="${DATABASE_URL:-postgresql://elevare:elevare123@localhost:5432/elevare}"

echo "[$(date)] Iniciando backup..."

# Criar backup
pg_dump "$DATABASE_URL" > "$BACKUP_DIR/db_$DATE.sql" 2>&1

if [ $? -eq 0 ]; then
  echo "[$(date)] ✅ Backup criado: db_$DATE.sql"
  
  # Remover backups com mais de 7 dias
  find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
  echo "[$(date)] ✅ Backups antigos removidos"
else
  echo "[$(date)] ❌ Erro ao criar backup"
  exit 1
fi
