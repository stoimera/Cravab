# User-Friendly Errors

## Principles

- Return actionable messages without exposing internal secrets.
- Preserve technical detail in logs, not user-facing text.
- Keep error responses consistent across API routes.

## Standard error categories

- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found (404)
- Conflict/state errors (409)
- Server failures (500)

## UX requirements

- Explain what failed.
- Explain what the user can do next.
- Avoid stack traces and raw SQL/provider errors in UI messages.
