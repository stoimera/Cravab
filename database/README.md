# CRAVAB Database

This README documents database setup and verification for CRAVAB.  
For full app documentation (what the app does, business value, local run steps, and screenshots), see the root `README.md`.

## Canonical schema entrypoints

Use one of these paths depending on execution environment:

- Supabase SQL Editor (recommended hosted path): `database/schema/full_schema_supabase.sql`
- `psql` CLI (local/automation path): `database/schema/00_bootstrap.sql`

`00_bootstrap.sql` intentionally uses `\i` include directives.  
`full_schema_supabase.sql` is SQL Editor-safe and does not use `\i`.

Schema modules:

- `database/schema/01_extensions_and_types.sql`
- `database/schema/02_tables_and_constraints.sql`
- `database/schema/03_indexes_and_views.sql`
- `database/schema/04_functions_triggers_and_rls.sql`
- `database/schema/05_seed_optional.sql` (optional local/demo only)

## Verification queries

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

```sql
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

```sql
SELECT *
FROM public.get_tenant_dashboard_counts('<tenant_uuid>');
```

## Consolidation notes

- Legacy patch migrations were consolidated for open-source onboarding.
- Canonical module order is fixed by `00_bootstrap.sql`.
- Modules `03` and `04` carry explicit index/view and function/RLS ownership.
- Migration rationale is documented in `database/schema/MIGRATION_CONSOLIDATION.md`.