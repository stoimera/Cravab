# Production Deployment Guide

## 1. Prerequisites

- Node.js 20+
- Supabase production project
- Vapi production assistant/webhook setup
- Production domain for app

## 2. Environment configuration

Use production-scoped values for:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `MASTER_ENCRYPTION_KEY`
- `VAPI_WEBHOOK_SECRET`

## 3. Database bootstrap

Supabase SQL Editor (recommended):

1. `database/schema/full_schema_supabase.sql`
2. Do not run `database/schema/05_seed_optional.sql` in production.

CLI option:

```bash
psql -h <host> -U postgres -d postgres -f database/schema/00_bootstrap.sql
```

Do not run `05_seed_optional.sql` in production.

## 4. Build and run checks

```bash
npm ci
npm run lint
npm run type-check
npm run build
```

## 5. Deployment checklist

- HTTPS enabled
- CORS/CSP configured for production domains
- Supabase auth redirect URLs configured
- Vapi webhook URL points to production app
- Monitoring and alerts configured
- `npm run validate:env`, `npm run lint`, `npm run type-check`, and `npm run build` pass in CI
