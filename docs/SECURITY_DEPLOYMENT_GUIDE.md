# Security Deployment Guide

## Baseline security controls

- Row-level security enabled on tenant tables
- Strict tenant scoping in API routes
- Secret values managed in environment variables
- CSP/CORS configured for trusted origins only

## Deployment security checklist

- Rotate production keys before first public release
- Verify no `.env*` secrets are committed
- Validate webhook signature verification in production
- Verify HTTPS and HSTS are enabled
- Review privileged API endpoints for auth checks

## Incident response readiness

- Follow `SECURITY.md` disclosure policy
- Log and triage auth/webhook failures
- Keep dependency updates flowing through Dependabot
