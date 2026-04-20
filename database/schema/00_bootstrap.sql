-- CRAVAB canonical schema bootstrap.
-- Run this file from repository root with:
-- psql -h <host> -U postgres -d postgres -f database/schema/00_bootstrap.sql

\i database/schema/01_extensions_and_types.sql
\i database/schema/02_tables_and_constraints.sql
\i database/schema/03_indexes_and_views.sql
\i database/schema/04_functions_triggers_and_rls.sql
-- Optional for local/demo only:
-- \i database/schema/05_seed_optional.sql
