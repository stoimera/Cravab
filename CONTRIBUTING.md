# Contributing to CRAVAB

## Development requirements

- Node.js 20+
- npm 10+
- Supabase project for local validation

## Local setup

1. Fork and clone the repository.
2. Install dependencies: `npm install`
3. Configure env file from `.env.example` into `.env.local`
4. Apply schema: `psql -h <host> -U postgres -d postgres -f database/schema/00_bootstrap.sql`
5. Run checks: `npm run type-check && npm run lint && npm run build`

## Pull request expectations

- Keep scope focused and atomic.
- Include rationale, not just implementation details.
- Add/update tests for behavior changes.
- Do not commit secrets, credentials, or `.env` files.

## Commit quality

- Use clear commit messages with intent.
- Resolve lint/type/build failures before opening PR.
