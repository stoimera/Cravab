# Multi-Tenant Configuration

## Overview

CRAVAB is a multi-tenant platform where each tenant is isolated by `tenant_id` and database RLS policies.

## Platform-level configuration

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
MASTER_ENCRYPTION_KEY=...
NEXT_PUBLIC_APP_URL=...
```

Optional variables:

```env
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
```

## Tenant onboarding flow

1. Create tenant row in `tenants`.
2. Create initial user in `users` linked to the tenant.
3. Configure tenant business settings (`company_settings`).
4. Configure Vapi assistant and webhook metadata for tenant resolution.

## Data isolation guarantees

- All tenant-owned tables are keyed by `tenant_id`.
- RLS policies restrict access to rows matching the authenticated user's tenant.
- Cross-tenant access is denied by default.

## Validation checklist

- User belongs to exactly one tenant.
- API routes resolve tenant context before DB writes.
- RLS policies exist for tenant-owned tables.
