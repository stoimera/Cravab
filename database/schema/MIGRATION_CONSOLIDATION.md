# CRAVAB Schema Consolidation

This repository previously contained schema history split across:

- `database/migrations/*.sql`
- `supabase/migrations/*.sql`

For open-source onboarding, the canonical SQL entrypoint is now:

- `database/schema/00_bootstrap.sql`

## Consolidation Rules

- Keep one baseline schema source of truth for full DDL in `02_tables_and_constraints.sql`.
- Keep optional seed data separate from core schema.
- Remove one-off patch migrations once their logic is included in baseline schema.
- Keep migration history notes in documentation, not as required runtime files.

## Canonical Module Sequence

1. `01_extensions_and_types.sql`
2. `02_tables_and_constraints.sql`
3. `03_indexes_and_views.sql`
4. `04_functions_triggers_and_rls.sql`
5. `05_seed_optional.sql`

## Notes

- Module ownership is explicit:
  - `01` extensions
  - `02` tables and constraints
  - `03` indexes and views
  - `04` functions, triggers, and RLS policy baseline
  - `05` optional seed
- `05_seed_optional.sql` is intentionally optional and should not be used in production.
