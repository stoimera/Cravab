# Vapi Setup for CRAVAB

This guide configures a Vapi assistant to use CRAVAB webhook tools.

## 1) Environment

Copy `.env.example` to `.env.local` and set:

- `VAPI_API_KEY`
- `VAPI_PUBLIC_API_KEY`
- `VAPI_ASSISTANT_ID`
- `VAPI_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`

## 2) Assistant prompt

Use `vapi/system-prompt.md` as the assistant system prompt.

## 3) Tools

Create tools in Vapi using `vapi/tools/functions.json`.

Reference: `vapi/docs/TOOLS_REFERENCE.md` for per-tool payload examples and expected response shapes.

For each tool:

- Provider: webhook/function tool
- Endpoint: `https://<your-domain>/api/vapi/webhook`
- Method: `POST`
- Auth header: webhook secret if configured in your Vapi account

## 4) Webhook security

Ensure secret verification is enabled in CRAVAB webhook route and Vapi dashboard:

- CRAVAB: `VAPI_WEBHOOK_SECRET` in `.env.local`
- Vapi: same secret value in webhook/tool settings

## 5) Validation checklist

- `getCurrentDate` executes successfully.
- `lookupClient` and `createClient` return expected payloads.
- `getAvailability` returns slots.
- `bookAppointment` creates records in tenant scope.
- `endCall` stores final call summary.

## 6) Troubleshooting

- 401/403: secret mismatch.
- 400 validation error: tool payload does not match schema.
- Wrong tenant data: verify tenant resolution logic in `src/app/api/vapi/webhook/route.ts`.
