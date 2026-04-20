-- Database Backup Script
-- Description: Creates a backup of the database

-- This script provides commands for backing up the database

-- 1. Full database backup (run from command line)
-- pg_dump -h localhost -U postgres -d CRAVAB_os > backup_$(date +%Y%m%d_%H%M%S).sql

-- 2. Schema only backup
-- pg_dump -h localhost -U postgres -d CRAVAB_os --schema-only > schema_backup_$(date +%Y%m%d_%H%M%S).sql

-- 3. Data only backup
-- pg_dump -h localhost -U postgres -d CRAVAB_os --data-only > data_backup_$(date +%Y%m%d_%H%M%S).sql

-- 4. Specific tables backup
-- pg_dump -h localhost -U postgres -d CRAVAB_os -t users -t companies > tables_backup_$(date +%Y%m%d_%H%M%S).sql

-- 5. Compressed backup
-- pg_dump -h localhost -U postgres -d CRAVAB_os | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

-- 6. Restore from backup
-- psql -h localhost -U postgres -d CRAVAB_os < backup_file.sql

-- 7. Restore from compressed backup
-- gunzip -c backup_file.sql.gz | psql -h localhost -U postgres -d CRAVAB_os
