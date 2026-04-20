# Supabase SQL Editor Run Order

Use this one-file path when applying schema directly in Supabase SQL Editor.

## Recommended (single run)

1. `database/schema/full_schema_supabase.sql`

Optional:

2. `database/schema/05_seed_optional.sql` (local/demo only)

## What this includes

- Baseline production schema from migration history.
- Migration parity additions from:
  - `database/schema/02_tables_and_constraints.sql`
  - `database/schema/03_indexes_and_views.sql`
  - `database/schema/04_functions_triggers_and_rls.sql`

## Notes

- `database/schema/00_bootstrap.sql` is for `psql` CLI usage and uses `\i` include directives.
- Supabase SQL Editor does not support `\i`; use `full_schema_supabase.sql`.
