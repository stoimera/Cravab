# Security Policy

## Supported versions

Security fixes are applied to the latest `main` branch.

## Reporting a vulnerability

Report vulnerabilities to `contact@stoimera.com` with:

- Affected component and attack path
- Reproduction steps
- Impact assessment
- Suggested mitigation (if known)

Do not open public GitHub issues for active vulnerabilities.

## Response SLA

- Initial acknowledgement: within 72 hours
- Triage decision: within 7 days
- Patch target for high/critical findings: within 14 days when feasible

## Secrets handling requirements

- Never commit `.env` files or production credentials.
- Use least-privilege service accounts and scoped API keys.
- Rotate leaked credentials immediately and revoke old tokens.
