# Vapi Integration

## Integration model

CRAVAB uses direct Vapi webhook integration. No MCP service is required.

The integration objective is operational: convert missed or unanswered inbound calls into booked, trackable jobs with full call context.

## Required environment variables

```env
VAPI_WEBHOOK_SECRET=...
VAPI_PUBLIC_API_KEY=...
NEXT_PUBLIC_APP_URL=...
```

## Webhook endpoint

- Route: `POST /api/vapi/webhook`
- Responsibilities:
  - Verify webhook authenticity
  - Resolve tenant context
  - Persist call metadata/transcripts
  - Execute supported tool operations through internal API logic

## Tooling behavior

Tool actions are executed by CRAVAB server handlers and database operations; the app does not proxy via an external MCP layer.

Core operator outcomes from tool execution:

- Create/update client records from call data
- Book, reschedule, and cancel appointments
- Persist transcripts and summaries for review
- Trigger follow-up actions when calls need manual intervention

## Vapi package location

The reusable Vapi artifacts live in:

- `vapi/system-prompt.md`
- `vapi/tools/functions.json`
- `vapi/docs/SETUP.md`

## Operational checks

- Webhook signature verification enabled
- Idempotency handling for repeated call events
- Tenant-scoped writes for all call-derived records
