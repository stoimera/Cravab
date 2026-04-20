# Testing Guide

## Baseline commands

```bash
npm run test -- --runInBand
npm run lint
npm run type-check
npm run build
npm run test:pwa
```

## Focus areas

- Tenant access controls and role boundaries
- Schema contract validation
- Auth and registration contract validation
- Vapi webhook payload handling

## Test locations

- Unit and integration tests: `src/lib/__tests__/`

## CI expectations

PRs should not merge unless lint, type-check, tests, and build pass.

## Minimum pre-PR check

Run this sequence before opening a PR:

1. `npm run lint`
2. `npm run type-check`
3. `npm run test`
4. `npm run build`
