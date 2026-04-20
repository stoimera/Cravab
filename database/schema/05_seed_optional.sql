-- Module 5: optional local seed data.
-- Do not run in production.

INSERT INTO public.tenants (id, name, slug, status)
VALUES ('11111111-1111-1111-1111-111111111111', 'CRAVAB Demo Tenant', 'CRAVAB-demo', 'active')
ON CONFLICT (id) DO NOTHING;
