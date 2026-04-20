# CRAVAB Setup Guide

CRAVAB is built for service businesses that lose customers when they cannot answer calls during active jobs. The platform handles call intake, client capture, booking operations, transcripts, and follow-up tracking automatically.

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase project
- Vapi account

## 1) Clone and install

```bash
git clone <repository-url>
cd CRAVAB
npm install
```

## 2) Configure environment

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

macOS/Linux:

```bash
cp .env.example .env.local
```

Update `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

VAPI_PUBLIC_API_KEY=your_vapi_key
VAPI_WEBHOOK_SECRET=your_webhook_secret

NEXT_PUBLIC_APP_URL=http://localhost:3000
MASTER_ENCRYPTION_KEY=replace_with_32_plus_char_secret
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

Security requirements:

- Do not commit `.env.local` or any secrets.
- Use separate keys for local, staging, and production.
- Rotate keys immediately if exposed.
- Never commit `.env`, `.env.local`, or production secret values.

## 3) Apply schema

Supabase SQL Editor run order:

1. `database/schema/full_schema_supabase.sql`

Optional:

2. `database/schema/05_seed_optional.sql`

See `database/schema/SUPABASE_SQL_EDITOR_RUN_ORDER.md` for details.

CLI (`psql`) option:

```bash
psql -h your-supabase-host -U postgres -d postgres -f database/schema/00_bootstrap.sql
```

Optional local demo data:

```bash
psql -h your-supabase-host -U postgres -d postgres -f database/schema/05_seed_optional.sql
```

## 4) Start development

```bash
npm run dev
```

Open: `http://localhost:3000`

## 5) Validate local setup

Run these once after first setup:

```bash
npm run validate:env
npm run lint
npm run type-check
npm run build
```

## 6) Recommended developer workflow

For regular development:

1. `npm run dev`
2. Make changes
3. `npm run lint`
4. `npm run type-check`
5. `npm run test`
6. `npm run build`

## 5) Configure Vapi webhook

- Webhook URL: `https://your-domain.com/api/vapi/webhook`
- Events: call lifecycle events used by your assistant
- Secret: set to `VAPI_WEBHOOK_SECRET`

## Troubleshooting

1. Calls missing: validate webhook payload and tenant resolution.
2. Database errors: rerun `00_bootstrap.sql` and check RLS policy setup.
3. App startup issues: run `npm run validate:env` and fix missing values.
