# Troubleshooting

## App fails to start

- Run `npm run validate:env` and fix missing variables.
- Delete `.next` and restart: `npm run dev:clean`.

## Auth errors

- Verify Supabase URL/keys are correct.
- Confirm auth redirect URLs include local/prod callback URLs.

## Webhook not processing

- Confirm `VAPI_WEBHOOK_SECRET` matches Vapi configuration.
- Inspect `/api/vapi/webhook` logs for signature or payload failures.

## Tenant data missing or forbidden

- Verify user is linked to a tenant in `users`.
- Verify RLS policies exist and match expected tenant isolation logic.

## Schema/bootstrap issues

- Re-run `database/schema/00_bootstrap.sql`.
- Confirm required functions and policies were created.
