# ADR-0001: Modular schema ownership

## Status
Accepted

## Context

Historical migrations diverged across multiple folders and were difficult to audit for open-source onboarding.

## Decision

Adopt a canonical schema entrypoint (`database/schema/00_bootstrap.sql`) and fixed module ordering for extensions, tables, indexes/views, functions/RLS, and optional seed.

## Consequences

- New contributors can initialize with one deterministic command.
- Schema responsibility is explicit by module.
- Changes to security/index/function layers remain separable from table DDL.
