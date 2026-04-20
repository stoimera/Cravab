# API Documentation

## Scope

This document lists the primary API groups and expected behavior contracts.

## Core route groups

- Auth: `/api/auth/*`
- Company and users: `/api/company/*`, `/api/users/*`
- Clients: `/api/clients/*`
- Appointments: `/api/appointments/*`
- Calls: `/api/calls/*`
- Services: `/api/services/*`
- Reports: `/api/reports/*`
- Vapi: `/api/vapi/*`

## Contract expectations

- Inputs validated server-side.
- Responses are JSON.
- Tenant context enforced on all tenant-owned resources.
- Unauthorized and forbidden paths return explicit error messages.

## Critical endpoints

- `POST /api/vapi/webhook`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/health`
