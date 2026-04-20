# ADR-0002: Tenant isolation enforcement

## Status
Accepted

## Context

Multi-tenant data requires strict isolation controls at both database and application levels.

## Decision

Enforce tenant isolation with:

- Postgres RLS policies on tenant-owned tables
- API-side tenant context validation
- In-code access guard helpers for role-based and same-tenant checks

## Consequences

- Cross-tenant data leakage risk is reduced by layered controls.
- Tests can validate role and tenant behavior independently of database state.
- Security review has explicit control points for audit.
