-- CRAVAB unified Supabase SQL Editor schema
-- SQL Editor-safe: no psql include directives.
-- Includes extensions, tables, indexes, views, functions, triggers, and RLS policies.

-- Module 1: extensions and base SQL prerequisites.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Generated from Supabase public schema documentation export
-- Tables

CREATE TABLE IF NOT EXISTS public.access_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid,
  email text NOT NULL,
  role text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  requested_by uuid,
  approved_by uuid,
  expires_at timestamptz DEFAULT (now() + '7 days'::interval),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.app_shortcuts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid,
  shortcut_id varchar(50) NOT NULL,
  title text NOT NULL,
  description text,
  url text NOT NULL,
  icon text,
  category varchar(50),
  order_index int4 DEFAULT 0,
  enabled bool DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  client_id uuid NOT NULL,
  service_id uuid,
  title text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  duration_minutes int4 NOT NULL,
  status text NOT NULL DEFAULT 'scheduled'::text,
  notes text,
  priority text NOT NULL DEFAULT 'normal'::text,
  address text,
  city text,
  state text,
  zip_code text,
  coordinates jsonb,
  eta_minutes int4,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid,
  action varchar(50) NOT NULL,
  resource_type varchar(50) NOT NULL,
  resource_id uuid,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid,
  user_id uuid,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  level varchar(20),
  category varchar(50),
  event varchar(255),
  description text,
  user_email varchar(255),
  session_id varchar(255),
  request_id varchar(255),
  outcome varchar(20),
  details jsonb,
  metadata jsonb,
  severity_score int4,
  tags _text,
  success bool NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.background_sync_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  sync_tag varchar(50) NOT NULL,
  operation_type varchar(50) NOT NULL,
  operation_data jsonb NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'pending'::character varying,
  retry_count int4 DEFAULT 0,
  max_retries int4 DEFAULT 3,
  error_message text,
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.calls (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  client_id uuid,
  vapi_call_id text,
  direction text NOT NULL,
  from_number text,
  to_number text,
  status text NOT NULL DEFAULT 'ringing'::text,
  duration_seconds int4,
  recording_url text,
  transcript text NOT NULL,
  ai_sentiment text,
  ai_intent text,
  ai_summary text,
  follow_up_required bool DEFAULT false,
  follow_up_notes text,
  priority text NOT NULL DEFAULT 'normal'::text,
  metadata jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  ended_at timestamptz NOT NULL,
  started_at timestamptz NOT NULL,
  follow_up_completed_at timestamptz,
  duration int4 DEFAULT 0,
  follow_up_callback_timeframe text DEFAULT 'within 4 hours'::text,
  follow_up_reason text,
  follow_up_urgency text DEFAULT 'standard'::text,
  summary text
);

CREATE TABLE IF NOT EXISTS public.clients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL,
  email text,
  address text,
  city text,
  state text,
  zip_code text,
  country text DEFAULT 'US'::text,
  status text NOT NULL DEFAULT 'active'::text,
  preferred_contact_method text,
  preferred_appointment_time text,
  notes text,
  tags _text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.company_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  business_hours jsonb DEFAULT '{""friday"": {""open"": ""09:00"", ""close"": ""17:00"", ""closed"": false}, ""monday"": {""open"": ""09:00"", ""close"": ""17:00"", ""closed"": false}, ""sunday"": {""open"": ""09:00"", ""close"": ""17:00"", ""closed"": true}, ""tuesday"": {""open"": ""09:00"", ""close"": ""17:00"", ""closed"": false}, ""saturday"": {""open"": ""09:00"", ""close"": ""17:00"", ""closed"": true}, ""thursday"": {""open"": ""09:00"", ""close"": ""17:00"", ""closed"": false}, ""wednesday"": {""open"": ""09:00"", ""close"": ""17:00"", ""closed"": false}}'::jsonb,
  service_area jsonb,
  ai_settings jsonb DEFAULT '{""consent_message"": ""This call may be recorded for quality purposes"", ""escalation_enabled"": true, ""escalation_timeout"": 10, ""after_hours_handling"": true}'::jsonb,
  notification_settings jsonb DEFAULT '{""sms_notifications"": false, ""call_notifications"": true, ""email_notifications"": true, ""appointment_reminders"": true}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  base_address text,
  base_latitude numeric,
  base_longitude numeric,
  service_radius_miles int4 DEFAULT 25,
  service_areas jsonb DEFAULT '[]'::jsonb,
  timezone varchar(50) DEFAULT 'America/Chicago'::character varying,
  industry text,
  service_categories jsonb DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS public.consent_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  consent_type text NOT NULL,
  granted bool NOT NULL,
  purpose text NOT NULL,
  data_categories _text DEFAULT '{}'::text[],
  retention_period text DEFAULT 'indefinite'::text,
  ip_address inet,
  user_agent text,
  consent_date timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.data_retention_policies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  table_name text NOT NULL,
  retention_days int4 NOT NULL,
  auto_purge bool DEFAULT true,
  purge_frequency text DEFAULT 'daily'::text,
  last_purge timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  client_id uuid,
  appointment_id uuid,
  call_id uuid,
  filename text NOT NULL,
  original_filename text NOT NULL,
  file_type text NOT NULL,
  file_size int4 NOT NULL,
  mime_type text NOT NULL,
  storage_path text NOT NULL,
  category text,
  description text,
  tags _text,
  is_public bool DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.eta_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  origin text NOT NULL,
  destination text NOT NULL,
  eta_minutes int4 NOT NULL,
  distance_miles numeric,
  cached_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + '00:15:00'::interval)
);

CREATE TABLE IF NOT EXISTS public.files (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  uploaded_by uuid NOT NULL,
  original_name text NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_url text NOT NULL,
  mime_type text NOT NULL,
  file_size int8 NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  tags _text DEFAULT '{}'::text[],
  is_public bool DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  client_id uuid NOT NULL,
  appointment_id uuid,
  invoice_number text NOT NULL,
  status text NOT NULL DEFAULT 'draft'::text,
  subtotal numeric NOT NULL,
  tax_amount numeric DEFAULT 0,
  total_amount numeric NOT NULL,
  due_date date,
  paid_date date,
  payment_method text,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.jarvis_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  system_prompt text,
  features jsonb DEFAULT '[]'::jsonb,
  knowledge_base jsonb DEFAULT '[]'::jsonb,
  is_active bool DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.jarvis_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  session_id text NOT NULL,
  message text NOT NULL,
  response text,
  message_type text NOT NULL,
  context jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL,
  channel text NOT NULL,
  status text NOT NULL,
  error_message text,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  type text NOT NULL,
  enabled bool DEFAULT true,
  conditions jsonb DEFAULT '[]'::jsonb,
  schedule jsonb,
  template jsonb NOT NULL,
  target_users _uuid,
  target_roles _text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb,
  is_read bool DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  priority text DEFAULT 'normal'::text,
  channels _text DEFAULT ARRAY['in_app'::text],
  scheduled_for timestamptz,
  sent_at timestamptz,
  requires_interaction bool DEFAULT false,
  silent bool DEFAULT false,
  actions jsonb DEFAULT '[]'::jsonb,
  icon text,
  color text
);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  invoice_id uuid NOT NULL,
  amount numeric NOT NULL,
  payment_method text NOT NULL,
  payment_reference text,
  status text NOT NULL DEFAULT 'pending'::text,
  processed_at timestamptz,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.protocol_handlers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid,
  protocol varchar(50) NOT NULL,
  data text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  processed bool DEFAULT false,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh_key text NOT NULL,
  auth_key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pwa_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rate_limit_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  endpoint varchar(255) NOT NULL,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  tenant_id uuid
);

CREATE TABLE IF NOT EXISTS public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  parameters jsonb,
  data jsonb,
  generated_by uuid NOT NULL,
  generated_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.runtime_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  month int4 NOT NULL,
  year int4 NOT NULL,
  call_minutes int4 DEFAULT 0,
  sms_count int4 DEFAULT 0,
  api_calls int4 DEFAULT 0,
  cost_usd numeric DEFAULT 0,
  limits jsonb,
  alerts_sent jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_area_coverage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name varchar(100) NOT NULL,
  description text,
  center_address text NOT NULL,
  center_latitude numeric NOT NULL,
  center_longitude numeric NOT NULL,
  radius_miles int4 NOT NULL DEFAULT 25,
  zip_codes _text DEFAULT '{}'::text[],
  cities _text DEFAULT '{}'::text[],
  states _text DEFAULT '{}'::text[],
  countries _text DEFAULT '{}'::text[],
  is_active bool DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.services (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  price numeric,
  duration_minutes int4 NOT NULL DEFAULT 60,
  category text,
  base_price numeric,
  hourly_rate numeric,
  minimum_charge numeric,
  estimated_duration_minutes int4,
  is_emergency_service bool DEFAULT false,
  requires_equipment bool DEFAULT false,
  equipment_list _text,
  required_permits _text,
  is_active bool DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  keywords _text DEFAULT '{}'::text[]
);

CREATE TABLE IF NOT EXISTS public.shared_content (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid,
  type varchar(20) NOT NULL,
  title text NOT NULL,
  content text,
  url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  processed bool DEFAULT false,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text,
  email text,
  phone text,
  address text,
  timezone text DEFAULT 'America/New_York'::text,
  status text NOT NULL DEFAULT 'active'::text,
  onboarding_completed bool DEFAULT false,
  vapi_api_key_encrypted text,
  vapi_assistant_id text,
  twilio_phone_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  base_address text,
  service_area text,
  service_radius int4 DEFAULT 25,
  business_hours jsonb DEFAULT '{""friday"": {""open"": ""08:00"", ""close"": ""17:00"", ""closed"": false}, ""monday"": {""open"": ""08:00"", ""close"": ""17:00"", ""closed"": false}, ""sunday"": {""open"": ""10:00"", ""close"": ""14:00"", ""closed"": true}, ""tuesday"": {""open"": ""08:00"", ""close"": ""17:00"", ""closed"": false}, ""saturday"": {""open"": ""09:00"", ""close"": ""15:00"", ""closed"": false}, ""thursday"": {""open"": ""08:00"", ""close"": ""17:00"", ""closed"": false}, ""wednesday"": {""open"": ""08:00"", ""close"": ""17:00"", ""closed"": false}}'::jsonb,
  subscription_active bool DEFAULT false,
  subscription_plan text DEFAULT 'basic'::text,
  vapi_public_api_key text,
  business_type text
);

CREATE TABLE IF NOT EXISTS public.usage_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  feature text NOT NULL,
  usage_amount int4 NOT NULL,
  unit text NOT NULL,
  cost_usd numeric DEFAULT 0,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  email_notifications bool DEFAULT true,
  sms_notifications bool DEFAULT false,
  call_notifications bool DEFAULT true,
  appointment_reminders bool DEFAULT true,
  theme text DEFAULT 'light'::text,
  language text DEFAULT 'en'::text,
  timezone text DEFAULT 'America/New_York'::text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  privacy_settings jsonb DEFAULT '{}'::jsonb,
  consent_preferences jsonb DEFAULT '{}'::jsonb,
  appointment_notifications bool DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'worker'::text,
  first_name text,
  last_name text,
  phone text,
  title text,
  permissions jsonb DEFAULT '{}'::jsonb,
  is_active bool DEFAULT true,
  status text NOT NULL DEFAULT 'active'::text,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  invitation_expires_at timestamptz
);

-- Generated from Supabase public schema documentation export
-- Indexes and views

CREATE INDEX idx_access_requests_email ON public.access_requests USING btree (email)
CREATE INDEX idx_access_requests_expires_at ON public.access_requests USING btree (expires_at)
CREATE INDEX idx_access_requests_status ON public.access_requests USING btree (status)
CREATE INDEX idx_access_requests_tenant_id ON public.access_requests USING btree (tenant_id)
CREATE INDEX idx_app_shortcuts_enabled ON public.app_shortcuts USING btree (enabled)
CREATE INDEX idx_app_shortcuts_order ON public.app_shortcuts USING btree (order_index)
CREATE INDEX idx_app_shortcuts_tenant ON public.app_shortcuts USING btree (tenant_id)
CREATE INDEX idx_app_shortcuts_user ON public.app_shortcuts USING btree (user_id)
CREATE INDEX idx_appointments_active ON public.appointments USING btree (tenant_id, starts_at) WHERE (status = ANY (ARRAY['scheduled'::text, 'confirmed'::text, 'in_progress'::text]))
CREATE INDEX idx_appointments_client_id ON public.appointments USING btree (client_id)
CREATE INDEX idx_appointments_created_by ON public.appointments USING btree (created_by)
CREATE INDEX idx_appointments_priority ON public.appointments USING btree (priority)
CREATE INDEX idx_appointments_service_id ON public.appointments USING btree (service_id)
CREATE INDEX idx_appointments_starts_at ON public.appointments USING btree (starts_at)
CREATE INDEX idx_appointments_status ON public.appointments USING btree (status)
CREATE INDEX idx_appointments_tenant_id ON public.appointments USING btree (tenant_id)
CREATE INDEX idx_appointments_tenant_starts_at ON public.appointments USING btree (tenant_id, starts_at)
CREATE INDEX idx_appointments_tenant_status ON public.appointments USING btree (tenant_id, status)
CREATE INDEX idx_appointments_updated_at ON public.appointments USING btree (updated_at)
CREATE INDEX idx_audit_events_action ON public.audit_events USING btree (action)
CREATE INDEX idx_audit_events_created_at ON public.audit_events USING btree (created_at)
CREATE INDEX idx_audit_events_resource_type ON public.audit_events USING btree (resource_type)
CREATE INDEX idx_audit_events_tenant_id ON public.audit_events USING btree (tenant_id)
CREATE INDEX idx_audit_events_user_id ON public.audit_events USING btree (user_id)
CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action)
CREATE INDEX idx_audit_logs_category ON public.audit_logs USING btree (category)
CREATE INDEX idx_audit_logs_category_created_at ON public.audit_logs USING btree (category, created_at)
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at)
CREATE INDEX idx_audit_logs_created_at_desc ON public.audit_logs USING btree (created_at DESC)
CREATE INDEX idx_audit_logs_details_gin ON public.audit_logs USING gin (details)
CREATE INDEX idx_audit_logs_event ON public.audit_logs USING btree (event)
CREATE INDEX idx_audit_logs_ip_address ON public.audit_logs USING btree (ip_address)
CREATE INDEX idx_audit_logs_level ON public.audit_logs USING btree (level)
CREATE INDEX idx_audit_logs_level_created_at ON public.audit_logs USING btree (level, created_at)
CREATE INDEX idx_audit_logs_metadata_gin ON public.audit_logs USING gin (metadata)
CREATE INDEX idx_audit_logs_outcome ON public.audit_logs USING btree (outcome)
CREATE INDEX idx_audit_logs_outcome_created_at ON public.audit_logs USING btree (outcome, created_at)
CREATE INDEX idx_audit_logs_resource ON public.audit_logs USING btree (resource_type, resource_id)
CREATE INDEX idx_audit_logs_resource_type ON public.audit_logs USING btree (resource_type)
CREATE INDEX idx_audit_logs_severity_score ON public.audit_logs USING btree (severity_score)
CREATE INDEX idx_audit_logs_success ON public.audit_logs USING btree (success)
CREATE INDEX idx_audit_logs_tenant_id ON public.audit_logs USING btree (tenant_id)
CREATE INDEX idx_audit_logs_user_created_at ON public.audit_logs USING btree (user_id, created_at)
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id)
CREATE INDEX idx_background_sync_scheduled ON public.background_sync_queue USING btree (scheduled_for)
CREATE INDEX idx_background_sync_status ON public.background_sync_queue USING btree (status)
CREATE INDEX idx_background_sync_tag ON public.background_sync_queue USING btree (sync_tag)
CREATE INDEX idx_background_sync_tenant ON public.background_sync_queue USING btree (tenant_id)
CREATE INDEX idx_background_sync_user ON public.background_sync_queue USING btree (user_id)
CREATE INDEX idx_calls_client_id ON public.calls USING btree (client_id)
CREATE INDEX idx_calls_created_at ON public.calls USING btree (created_at)
CREATE INDEX idx_calls_ended_at ON public.calls USING btree (ended_at)
CREATE INDEX idx_calls_follow_up_completed_at ON public.calls USING btree (follow_up_completed_at)
CREATE INDEX idx_calls_from_number ON public.calls USING btree (from_number)
CREATE INDEX idx_calls_metadata ON public.calls USING gin (metadata)
CREATE INDEX idx_calls_pending_follow_ups ON public.calls USING btree (follow_up_required, created_at) WHERE (follow_up_required = true)
CREATE INDEX idx_calls_started_at ON public.calls USING btree (started_at)
CREATE INDEX idx_calls_status ON public.calls USING btree (status)
CREATE INDEX idx_calls_tenant_created ON public.calls USING btree (tenant_id, created_at DESC)
CREATE INDEX idx_calls_tenant_created_at ON public.calls USING btree (tenant_id, created_at)
CREATE INDEX idx_calls_tenant_id ON public.calls USING btree (tenant_id)
CREATE INDEX idx_calls_tenant_status ON public.calls USING btree (tenant_id, status)
CREATE INDEX idx_calls_to_number ON public.calls USING btree (to_number)
CREATE INDEX idx_calls_vapi_call_id ON public.calls USING btree (vapi_call_id)
CREATE INDEX idx_clients_active ON public.clients USING btree (tenant_id, updated_at) WHERE (status = 'active'::text)
CREATE INDEX idx_clients_email ON public.clients USING btree (email)
CREATE INDEX idx_clients_phone ON public.clients USING btree (phone)
CREATE INDEX idx_clients_preferred_contact_method ON public.clients USING btree (preferred_contact_method)
CREATE INDEX idx_clients_status ON public.clients USING btree (status)
CREATE INDEX idx_clients_tags ON public.clients USING gin (tags)
CREATE INDEX idx_clients_tenant_id ON public.clients USING btree (tenant_id)
CREATE INDEX idx_clients_tenant_phone ON public.clients USING btree (tenant_id, phone)
CREATE INDEX idx_clients_tenant_status ON public.clients USING btree (tenant_id, status)
CREATE INDEX idx_clients_updated_at ON public.clients USING btree (updated_at)
CREATE INDEX idx_company_settings_tenant ON public.company_settings USING btree (tenant_id)
CREATE INDEX idx_company_settings_tenant_id ON public.company_settings USING btree (tenant_id)
CREATE INDEX idx_consent_records_type_date ON public.consent_records USING btree (consent_type, consent_date)
CREATE INDEX idx_consent_records_user_tenant ON public.consent_records USING btree (user_id, tenant_id)
CREATE INDEX idx_data_retention_policies_tenant ON public.data_retention_policies USING btree (tenant_id)
CREATE INDEX idx_documents_appointment_id ON public.documents USING btree (appointment_id)
CREATE INDEX idx_documents_call_id ON public.documents USING btree (call_id)
CREATE INDEX idx_documents_category ON public.documents USING btree (category)
CREATE INDEX idx_documents_client_id ON public.documents USING btree (client_id)
CREATE INDEX idx_documents_tags ON public.documents USING gin (tags)
CREATE INDEX idx_documents_tenant_id ON public.documents USING btree (tenant_id)
CREATE INDEX idx_eta_cache_expires_at ON public.eta_cache USING btree (expires_at)
CREATE INDEX idx_eta_cache_origin_destination ON public.eta_cache USING btree (origin, destination)
CREATE INDEX idx_eta_cache_tenant_id ON public.eta_cache USING btree (tenant_id)
CREATE INDEX idx_files_created ON public.files USING btree (created_at)
CREATE INDEX idx_files_mime_type ON public.files USING btree (mime_type)
CREATE INDEX idx_files_public ON public.files USING btree (is_public)
CREATE INDEX idx_files_tenant ON public.files USING btree (tenant_id)
CREATE INDEX idx_files_uploaded_by ON public.files USING btree (uploaded_by)
CREATE INDEX idx_invoices_appointment_id ON public.invoices USING btree (appointment_id)
CREATE INDEX idx_invoices_client_id ON public.invoices USING btree (client_id)
CREATE INDEX idx_invoices_due_date ON public.invoices USING btree (due_date)
CREATE INDEX idx_invoices_status ON public.invoices USING btree (status)
CREATE INDEX idx_invoices_tenant_id ON public.invoices USING btree (tenant_id)
CREATE INDEX idx_jarvis_configs_is_active ON public.jarvis_configs USING btree (is_active)
CREATE INDEX idx_jarvis_configs_tenant_id ON public.jarvis_configs USING btree (tenant_id)
CREATE INDEX idx_jarvis_conversations_created_at ON public.jarvis_conversations USING btree (created_at)
CREATE INDEX idx_jarvis_conversations_session_id ON public.jarvis_conversations USING btree (session_id)
CREATE INDEX idx_jarvis_conversations_tenant_id ON public.jarvis_conversations USING btree (tenant_id)
CREATE INDEX idx_jarvis_conversations_user_id ON public.jarvis_conversations USING btree (user_id)
CREATE INDEX idx_notification_logs_channel ON public.notification_logs USING btree (channel)
CREATE INDEX idx_notification_logs_created_at ON public.notification_logs USING btree (created_at DESC)
CREATE INDEX idx_notification_logs_notification_id ON public.notification_logs USING btree (notification_id)
CREATE INDEX idx_notification_logs_status ON public.notification_logs USING btree (status)
CREATE INDEX idx_notification_rules_enabled ON public.notification_rules USING btree (enabled)
CREATE INDEX idx_notification_rules_tenant_id ON public.notification_rules USING btree (tenant_id)
CREATE INDEX idx_notification_rules_type ON public.notification_rules USING btree (type)
CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read)
CREATE INDEX idx_notifications_priority ON public.notifications USING btree (priority)
CREATE INDEX idx_notifications_scheduled_for ON public.notifications USING btree (scheduled_for)
CREATE INDEX idx_notifications_sent_at ON public.notifications USING btree (sent_at)
CREATE INDEX idx_notifications_tenant_created_at ON public.notifications USING btree (tenant_id, created_at DESC)
CREATE INDEX idx_notifications_tenant_id ON public.notifications USING btree (tenant_id)
CREATE INDEX idx_notifications_tenant_priority ON public.notifications USING btree (tenant_id, priority)
CREATE INDEX idx_notifications_tenant_type ON public.notifications USING btree (tenant_id, type)
CREATE INDEX idx_notifications_type ON public.notifications USING btree (type)
CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id)
CREATE INDEX idx_payments_invoice_id ON public.payments USING btree (invoice_id)
CREATE INDEX idx_payments_status ON public.payments USING btree (status)
CREATE INDEX idx_payments_tenant_id ON public.payments USING btree (tenant_id)
CREATE INDEX idx_protocol_handlers_created ON public.protocol_handlers USING btree (created_at)
CREATE INDEX idx_protocol_handlers_processed ON public.protocol_handlers USING btree (processed)
CREATE INDEX idx_protocol_handlers_protocol ON public.protocol_handlers USING btree (protocol)
CREATE INDEX idx_protocol_handlers_tenant ON public.protocol_handlers USING btree (tenant_id)
CREATE INDEX idx_protocol_handlers_user ON public.protocol_handlers USING btree (user_id)
CREATE INDEX idx_push_subscriptions_tenant_id ON public.push_subscriptions USING btree (tenant_id)
CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions USING btree (user_id)
CREATE INDEX idx_pwa_settings_tenant ON public.pwa_settings USING btree (tenant_id)
CREATE INDEX idx_pwa_settings_user ON public.pwa_settings USING btree (user_id)
CREATE INDEX idx_rate_limit_requests_created_at ON public.rate_limit_requests USING btree (created_at)
CREATE INDEX idx_rate_limit_requests_ip_endpoint ON public.rate_limit_requests USING btree (ip_address, endpoint, created_at)
CREATE INDEX idx_rate_limit_requests_tenant_id ON public.rate_limit_requests USING btree (tenant_id)
CREATE INDEX idx_rate_limit_requests_user_endpoint ON public.rate_limit_requests USING btree (user_id, endpoint, created_at)
CREATE INDEX idx_reports_generated_at ON public.reports USING btree (generated_at)
CREATE INDEX idx_reports_tenant_id ON public.reports USING btree (tenant_id)
CREATE INDEX idx_reports_type ON public.reports USING btree (type)
CREATE INDEX idx_runtime_usage_month_year ON public.runtime_usage USING btree (month, year)
CREATE INDEX idx_runtime_usage_tenant_id ON public.runtime_usage USING btree (tenant_id)
CREATE INDEX idx_service_area_coverage_cities ON public.service_area_coverage USING gin (cities)
CREATE INDEX idx_service_area_coverage_countries ON public.service_area_coverage USING gin (countries)
CREATE INDEX idx_service_area_coverage_location ON public.service_area_coverage USING btree (center_latitude, center_longitude)
CREATE INDEX idx_service_area_coverage_states ON public.service_area_coverage USING gin (states)
CREATE INDEX idx_service_area_coverage_tenant_active ON public.service_area_coverage USING btree (tenant_id, is_active)
CREATE INDEX idx_service_area_coverage_zip_codes ON public.service_area_coverage USING gin (zip_codes)
CREATE INDEX idx_service_areas_tenant_active ON public.service_area_coverage USING btree (tenant_id, is_active)
CREATE INDEX idx_services_category ON public.services USING btree (category)
CREATE INDEX idx_services_is_active ON public.services USING btree (is_active)
CREATE INDEX idx_services_keywords ON public.services USING gin (keywords)
CREATE INDEX idx_services_tenant_active ON public.services USING btree (tenant_id, is_active)
CREATE INDEX idx_services_tenant_id ON public.services USING btree (tenant_id)
CREATE INDEX idx_services_updated_at ON public.services USING btree (updated_at)
CREATE INDEX idx_shared_content_created ON public.shared_content USING btree (created_at)
CREATE INDEX idx_shared_content_processed ON public.shared_content USING btree (processed)
CREATE INDEX idx_shared_content_tenant ON public.shared_content USING btree (tenant_id)
CREATE INDEX idx_shared_content_type ON public.shared_content USING btree (type)
CREATE INDEX idx_shared_content_user ON public.shared_content USING btree (user_id)
CREATE INDEX idx_tenants_business_hours ON public.tenants USING gin (business_hours)
CREATE INDEX idx_tenants_business_type ON public.tenants USING btree (business_type)
CREATE INDEX idx_tenants_slug ON public.tenants USING btree (slug)
CREATE INDEX idx_tenants_status ON public.tenants USING btree (status)
CREATE INDEX idx_tenants_twilio_phone ON public.tenants USING btree (twilio_phone_number)
CREATE INDEX idx_usage_logs_created_at ON public.usage_logs USING btree (created_at)
CREATE INDEX idx_usage_logs_feature ON public.usage_logs USING btree (feature)
CREATE INDEX idx_usage_logs_tenant_id ON public.usage_logs USING btree (tenant_id)
CREATE INDEX idx_user_preferences_tenant_id ON public.user_preferences USING btree (tenant_id)
CREATE INDEX idx_user_preferences_user_tenant ON public.user_preferences USING btree (user_id, tenant_id)
CREATE INDEX idx_users_email ON public.users USING btree (email)
CREATE INDEX idx_users_invitation_expires_at ON public.users USING btree (invitation_expires_at)
CREATE INDEX idx_users_pending_invitations ON public.users USING btree (is_active, invitation_expires_at) WHERE (is_active = false)
CREATE INDEX idx_users_role ON public.users USING btree (role)
CREATE INDEX idx_users_status ON public.users USING btree (status)
CREATE INDEX idx_users_tenant_email ON public.users USING btree (tenant_id, email)
CREATE INDEX idx_users_tenant_id ON public.users USING btree (tenant_id)

CREATE OR REPLACE VIEW public.audit_log_analytics AS
SELECT al.tenant_id,
    t.name AS tenant_name,
    al.action,
    al.resource_type,
    date(al.created_at) AS audit_date,
    count(*) AS event_count,
    count(DISTINCT al.user_id) AS unique_users,
    array_agg(DISTINCT al.user_id) AS user_ids
   FROM (audit_logs al
     JOIN tenants t ON ((al.tenant_id = t.id)))
  WHERE (al.created_at > (now() - '30 days'::interval))
  GROUP BY al.tenant_id, t.name, al.action, al.resource_type, (date(al.created_at));

CREATE OR REPLACE VIEW public.call_health_monitor AS
SELECT c.tenant_id,
    t.name AS tenant_name,
    count(c.id) AS total_calls,
    count(
        CASE
            WHEN (c.status = 'completed'::text) THEN 1
            ELSE NULL::integer
        END) AS completed_calls,
    count(
        CASE
            WHEN (c.status = 'failed'::text) THEN 1
            ELSE NULL::integer
        END) AS failed_calls,
    count(
        CASE
            WHEN (c.status = 'in_progress'::text) THEN 1
            ELSE NULL::integer
        END) AS active_calls,
    avg((EXTRACT(epoch FROM (c.ended_at - c.started_at)) / (60)::numeric)) AS avg_duration_minutes,
    max(c.created_at) AS last_call_at,
    count(
        CASE
            WHEN (c.created_at > (now() - '01:00:00'::interval)) THEN 1
            ELSE NULL::integer
        END) AS calls_last_hour
   FROM (calls c
     JOIN tenants t ON ((c.tenant_id = t.id)))
  WHERE (c.created_at > (now() - '24:00:00'::interval))
  GROUP BY c.tenant_id, t.name;

CREATE OR REPLACE VIEW public.security_events AS
SELECT al.id,
    al.tenant_id,
    al.user_id,
    al.action,
    al.resource_type,
    al.resource_id,
    al.old_values,
    al.new_values,
    al.ip_address,
    al.user_agent,
    al.created_at,
    u.email AS user_email,
    u.first_name,
    u.last_name,
    t.name AS tenant_name
   FROM ((audit_logs al
     LEFT JOIN users u ON ((al.user_id = u.id)))
     LEFT JOIN tenants t ON ((al.tenant_id = t.id)))
  WHERE (al.action = ANY (ARRAY['login'::text, 'logout'::text, 'failed_login'::text, 'password_change'::text, 'permission_change'::text, 'suspicious_activity'::text]));

CREATE OR REPLACE VIEW public.service_area_summary AS
SELECT sac.tenant_id,
    t.name AS tenant_name,
    count(sac.id) AS total_service_areas,
    count(
        CASE
            WHEN sac.is_active THEN 1
            ELSE NULL::integer
        END) AS active_service_areas,
    avg(sac.radius_miles) AS avg_radius_miles,
    max(sac.created_at) AS last_updated,
    array_agg(DISTINCT sac.name) AS service_area_names
   FROM (service_area_coverage sac
     JOIN tenants t ON ((sac.tenant_id = t.id)))
  GROUP BY sac.tenant_id, t.name;

CREATE OR REPLACE VIEW public.suspicious_deletions AS
SELECT al.id,
    al.tenant_id,
    al.user_id,
    al.action,
    al.resource_type,
    al.resource_id,
    al.old_values,
    al.created_at,
    u.email AS user_email,
    u.first_name,
    u.last_name,
    t.name AS tenant_name
   FROM ((audit_logs al
     LEFT JOIN users u ON ((al.user_id = u.id)))
     LEFT JOIN tenants t ON ((al.tenant_id = t.id)))
  WHERE ((al.action = 'delete'::text) AND (al.created_at > (now() - '24:00:00'::interval)) AND (al.resource_type = ANY (ARRAY['clients'::text, 'appointments'::text, 'calls'::text, 'documents'::text, 'invoices'::text])));

-- Generated from Supabase public schema documentation export
-- Functions, triggers, and RLS (functions included from export)

CREATE OR REPLACE FUNCTION public.add_service_area(p_tenant_id uuid, p_name character varying, p_description text, p_center_address text, p_center_latitude numeric, p_center_longitude numeric, p_radius_miles integer DEFAULT 25, p_zip_codes text[] DEFAULT '{}'::text[], p_cities text[] DEFAULT '{}'::text[], p_states text[] DEFAULT '{}'::text[], p_countries text[] DEFAULT '{}'::text[])
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
  new_area_id UUID;
BEGIN
  INSERT INTO service_area_coverage (
    tenant_id, name, description, center_address, 
    center_latitude, center_longitude, radius_miles,
    zip_codes, cities, states, countries
  ) VALUES (
    p_tenant_id, p_name, p_description, p_center_address,
    p_center_latitude, p_center_longitude, p_radius_miles,
    p_zip_codes, p_cities, p_states, p_countries
  ) RETURNING id INTO new_area_id;
  
  RETURN new_area_id;
END;
$function$

CREATE OR REPLACE FUNCTION public.calculate_distance_miles(lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN (
    3959 * acos(
      cos(radians(lat1)) * 
      cos(radians(lat2)) * 
      cos(radians(lon2) - radians(lon1)) + 
      sin(radians(lat1)) * 
      sin(radians(lat2))
    )
  );
END;
$function$

CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs(retention_days integer DEFAULT 90)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_logs 
    WHERE created_at < NOW() - INTERVAL '1 day' * retention_days;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Also clean up old rate limit requests
    DELETE FROM rate_limit_requests 
    WHERE created_at < NOW() - INTERVAL '1 day' * 7; -- Keep rate limit data for 7 days
    
    RETURN deleted_count;
END;
$function$

CREATE OR REPLACE FUNCTION public.create_service_area_coverage(p_tenant_id uuid, p_coverage_type text, p_coverage_value text, p_is_active boolean DEFAULT true)
 RETURNS TABLE(id uuid, tenant_id uuid, coverage_type text, coverage_value text, is_active boolean, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    new_coverage_id UUID;
BEGIN
    -- Validate coverage_type
    IF p_coverage_type NOT IN ('zip_code', 'city', 'state', 'custom') THEN
        RAISE EXCEPTION 'Invalid coverage_type. Must be one of: zip_code, city, state, custom';
    END IF;
    
    -- Validate tenant exists
    IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = p_tenant_id AND status = 'active') THEN
        RAISE EXCEPTION 'Tenant not found or inactive';
    END IF;
    
    -- Insert the new service area coverage
    INSERT INTO public.service_area_coverage (
        tenant_id,
        coverage_type,
        coverage_value,
        is_active
    ) VALUES (
        p_tenant_id,
        p_coverage_type,
        p_coverage_value,
        p_is_active
    ) RETURNING id INTO new_coverage_id;
    
    -- Return the created record
    RETURN QUERY
    SELECT 
        sac.id,
        sac.tenant_id,
        sac.coverage_type,
        sac.coverage_value,
        sac.is_active,
        sac.created_at,
        sac.updated_at
    FROM public.service_area_coverage sac
    WHERE sac.id = new_coverage_id;
END;
$function$

CREATE OR REPLACE FUNCTION public.create_user_profile_safe(p_user_id uuid, p_tenant_id uuid, p_email text, p_first_name text, p_last_name text, p_role text DEFAULT 'worker'::text, p_phone text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_user_data jsonb;
    v_result jsonb;
BEGIN
    -- Validate inputs
    IF p_user_id IS NULL OR p_tenant_id IS NULL OR p_email IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Missing required parameters');
    END IF;
    
    -- Check if user already exists
    IF EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'User already exists');
    END IF;
    
    -- Check if tenant exists
    IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = p_tenant_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Tenant does not exist');
    END IF;
    
    -- Create user profile
    INSERT INTO public.users (
        id,
        tenant_id,
        email,
        first_name,
        last_name,
        role,
        phone,
        is_active,
        status,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_tenant_id,
        p_email,
        p_first_name,
        p_last_name,
        p_role,
        p_phone,
        true,
        'active',
        now(),
        now()
    );
    
    -- Create user preferences (if table exists)
    BEGIN
        INSERT INTO public.user_preferences (user_id, tenant_id)
        VALUES (p_user_id, p_tenant_id);
    EXCEPTION
        WHEN undefined_table THEN
            -- Table doesn't exist, skip
            NULL;
        WHEN OTHERS THEN
            -- Log error but don't fail user creation
            RAISE WARNING 'Failed to create user preferences: %', SQLERRM;
    END;
    
    -- Log the user creation (if audit_logs table exists)
    BEGIN
        INSERT INTO public.audit_logs (
            tenant_id, 
            user_id, 
            action, 
            resource_type, 
            resource_id, 
            new_values,
            created_at
        ) VALUES (
            p_tenant_id, 
            p_user_id, 
            'user_created', 
            'users', 
            p_user_id, 
            jsonb_build_object(
                'email', p_email,
                'first_name', p_first_name,
                'last_name', p_last_name,
                'role', p_role
            ),
            now()
        );
    EXCEPTION
        WHEN undefined_table THEN
            -- Table doesn't exist, skip
            NULL;
        WHEN OTHERS THEN
            -- Log error but don't fail user creation
            RAISE WARNING 'Failed to create audit log: %', SQLERRM;
    END;
    
    -- Return success
    RETURN jsonb_build_object(
        'success', true, 
        'user_id', p_user_id,
        'tenant_id', p_tenant_id
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return error information
        RETURN jsonb_build_object(
            'success', false, 
            'error', SQLERRM,
            'sqlstate', SQLSTATE
        );
END;
$function$

CREATE OR REPLACE FUNCTION public.create_user_simple(p_user_id uuid, p_tenant_id uuid, p_email text, p_first_name text, p_last_name text, p_role text DEFAULT 'admin'::text, p_phone text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Insert user directly without any triggers or complex logic
    INSERT INTO public.users (
        id,
        tenant_id,
        email,
        first_name,
        last_name,
        role,
        phone,
        is_active,
        status,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_tenant_id,
        p_email,
        p_first_name,
        p_last_name,
        p_role,
        p_phone,
        true,
        'active',
        now(),
        now()
    );
    
    RETURN jsonb_build_object('success', true, 'user_id', p_user_id);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$

CREATE OR REPLACE FUNCTION public.detect_suspicious_activity(user_id_param uuid DEFAULT NULL::uuid, hours_back integer DEFAULT 24)
 RETURNS TABLE(user_id uuid, user_email character varying, suspicious_events bigint, high_severity_events bigint, failed_events bigint, unique_ips bigint, risk_score numeric)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        al.user_id,
        al.user_email,
        COUNT(CASE WHEN COALESCE(al.category, 'system_event') = 'security_event' THEN 1 END) as suspicious_events,
        COUNT(CASE WHEN COALESCE(al.severity_score, 0) >= 7 THEN 1 END) as high_severity_events,
        COUNT(CASE WHEN COALESCE(al.outcome, 'success') = 'failure' THEN 1 END) as failed_events,
        COUNT(DISTINCT al.ip_address) as unique_ips,
        (
            COUNT(CASE WHEN COALESCE(al.category, 'system_event') = 'security_event' THEN 1 END) * 3 +
            COUNT(CASE WHEN COALESCE(al.severity_score, 0) >= 7 THEN 1 END) * 2 +
            COUNT(CASE WHEN COALESCE(al.outcome, 'success') = 'failure' THEN 1 END) * 1 +
            COUNT(DISTINCT al.ip_address) * 0.5
        ) as risk_score
    FROM audit_logs al
    WHERE al.created_at >= NOW() - INTERVAL '1 hour' * hours_back
      AND (user_id_param IS NULL OR al.user_id = user_id_param)
    GROUP BY al.user_id, al.user_email
    HAVING (
        COUNT(CASE WHEN COALESCE(al.category, 'system_event') = 'security_event' THEN 1 END) > 0 OR
        COUNT(CASE WHEN COALESCE(al.severity_score, 0) >= 7 THEN 1 END) > 5 OR
        COUNT(CASE WHEN COALESCE(al.outcome, 'success') = 'failure' THEN 1 END) > 10 OR
        COUNT(DISTINCT al.ip_address) > 3
    )
    ORDER BY risk_score DESC;
END;
$function$

CREATE OR REPLACE FUNCTION public.generate_invoice_number(tenant_uuid uuid)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
    next_number INTEGER;
    invoice_number TEXT;
BEGIN
    -- Get the next invoice number for this tenant
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-(\d+)') AS INTEGER)), 0) + 1
    INTO next_number
    FROM invoices
    WHERE tenant_id = tenant_uuid;
    
    -- Format as INV-000001, INV-000002, etc.
    invoice_number := 'INV-' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN invoice_number;
END;
$function$

CREATE OR REPLACE FUNCTION public.get_audit_stats(start_date timestamp with time zone DEFAULT (now() - '24:00:00'::interval), end_date timestamp with time zone DEFAULT now())
 RETURNS TABLE(level character varying, category character varying, outcome character varying, count bigint, avg_severity numeric, max_severity integer)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(al.level, 'info') as level,
        COALESCE(al.category, 'system_event') as category,
        COALESCE(al.outcome, 'success') as outcome,
        COUNT(*) as count,
        AVG(COALESCE(al.severity_score, 0)) as avg_severity,
        MAX(COALESCE(al.severity_score, 0)) as max_severity
    FROM audit_logs al
    WHERE al.created_at BETWEEN start_date AND end_date
    GROUP BY COALESCE(al.level, 'info'), COALESCE(al.category, 'system_event'), COALESCE(al.outcome, 'success')
    ORDER BY count DESC;
END;
$function$

CREATE OR REPLACE FUNCTION public.get_secure_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Get tenant_id from users table instead of JWT metadata
  RETURN (
    SELECT tenant_id 
    FROM public.users 
    WHERE id = auth.uid() 
    LIMIT 1
  );
END;
$function$

CREATE OR REPLACE FUNCTION public.get_tenant_id_from_jwt()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Use the secure function instead of JWT metadata
  RETURN public.get_secure_tenant_id();
END;
$function$

CREATE OR REPLACE FUNCTION public.get_tenant_service_areas(p_tenant_id uuid)
 RETURNS TABLE(id uuid, name character varying, description text, center_address text, center_latitude numeric, center_longitude numeric, radius_miles integer, zip_codes text[], cities text[], states text[], countries text[], is_active boolean)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    sac.id,
    sac.name,
    sac.description,
    sac.center_address,
    sac.center_latitude,
    sac.center_longitude,
    sac.radius_miles,
    sac.zip_codes,
    sac.cities,
    sac.states,
    sac.countries,
    sac.is_active
  FROM service_area_coverage sac
  WHERE sac.tenant_id = p_tenant_id
  ORDER BY sac.created_at DESC;
END;
$function$

CREATE OR REPLACE FUNCTION public.get_user_notification_preferences(p_user_id uuid, p_tenant_id uuid)
 RETURNS TABLE(email_notifications boolean, sms_notifications boolean, push_notifications boolean, in_app_notifications boolean, appointment_reminders boolean, follow_up_reminders boolean, emergency_notifications boolean, team_notifications boolean, maintenance_reminders boolean, payment_notifications boolean, system_notifications boolean, quiet_hours_start time without time zone, quiet_hours_end time without time zone, timezone text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(up.email_notifications, true),
    COALESCE(up.sms_notifications, false),
    COALESCE(up.push_notifications, true),
    COALESCE(up.in_app_notifications, true),
    COALESCE(up.appointment_reminders, true),
    COALESCE(up.follow_up_reminders, true),
    COALESCE(up.emergency_notifications, true),
    COALESCE(up.team_notifications, true),
    COALESCE(up.maintenance_reminders, true),
    COALESCE(up.payment_notifications, true),
    COALESCE(up.system_notifications, true),
    up.quiet_hours_start,
    up.quiet_hours_end,
    COALESCE(up.timezone, 'America/New_York')
  FROM user_preferences up
  WHERE up.user_id = p_user_id AND up.tenant_id = p_tenant_id
  UNION ALL
  SELECT 
    true, false, true, true, true, true, true, true, true, true, true,
    NULL, NULL, 'America/New_York'
  WHERE NOT EXISTS (
    SELECT 1 FROM user_preferences 
    WHERE user_id = p_user_id AND tenant_id = p_tenant_id
  )
  LIMIT 1;
END;
$function$

CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN (
    SELECT tenant_id 
    FROM users 
    WHERE id = auth.uid()
  );
END;
$function$

CREATE OR REPLACE FUNCTION public.get_user_unread_notification_count(p_user_id uuid, p_tenant_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unread_count
  FROM notifications
  WHERE user_id = p_user_id 
    AND tenant_id = p_tenant_id 
    AND is_read = false;
  
  RETURN COALESCE(unread_count, 0);
END;
$function$

CREATE OR REPLACE FUNCTION public.handle_public_user_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Only process if this is a new user with tenant_id
    IF NEW.tenant_id IS NOT NULL THEN
        -- Create user preferences (if table exists)
        BEGIN
            INSERT INTO public.user_preferences (user_id, tenant_id)
            VALUES (NEW.id, NEW.tenant_id)
            ON CONFLICT (user_id) DO NOTHING;
        EXCEPTION
            WHEN undefined_table THEN
                -- Table doesn't exist, skip
                NULL;
            WHEN OTHERS THEN
                -- Log error but don't fail
                RAISE WARNING 'Failed to create user preferences: %', SQLERRM;
        END;
        
        -- Log the user creation (if audit_logs table exists)
        BEGIN
            INSERT INTO public.audit_logs (
                tenant_id, 
                user_id, 
                action, 
                resource_type, 
                resource_id, 
                new_values,
                created_at
            ) VALUES (
                NEW.tenant_id, 
                NEW.id, 
                'user_created', 
                'users', 
                NEW.id, 
                to_jsonb(NEW),
                now()
            );
        EXCEPTION
            WHEN undefined_table THEN
                -- Table doesn't exist, skip
                NULL;
            WHEN OTHERS THEN
                -- Log error but don't fail
                RAISE WARNING 'Failed to create audit log: %', SQLERRM;
        END;
    END IF;
    
    RETURN NEW;
END;
$function$

CREATE OR REPLACE FUNCTION public.invite_user_to_tenant(user_email text, tenant_id uuid, user_role text DEFAULT 'worker'::text, first_name text DEFAULT ''::text, last_name text DEFAULT ''::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    user_id UUID;
    tenant_exists BOOLEAN;
BEGIN
    -- Check if tenant exists
    SELECT EXISTS(SELECT 1 FROM public.tenants WHERE id = tenant_id AND status = 'active') INTO tenant_exists;
    
    IF NOT tenant_exists THEN
        RETURN 'ERROR: Tenant not found or inactive';
    END IF;
    
    -- Check if user already exists
    SELECT id INTO user_id FROM auth.users WHERE email = user_email;
    
    IF user_id IS NOT NULL THEN
        -- Update existing user's tenant
        UPDATE public.users 
        SET tenant_id = invite_user_to_tenant.tenant_id,
            role = invite_user_to_tenant.user_role,
            first_name = invite_user_to_tenant.first_name,
            last_name = invite_user_to_tenant.last_name
        WHERE id = user_id;
        
        RETURN 'SUCCESS: User updated and assigned to tenant';
    ELSE
        RETURN 'ERROR: User not found in auth.users. User must sign up first.';
    END IF;
END;
$function$

CREATE OR REPLACE FUNCTION public.is_address_serviced(p_tenant_id uuid, p_latitude numeric, p_longitude numeric, p_address text DEFAULT NULL::text)
 RETURNS TABLE(is_serviced boolean, service_area_name character varying, distance_miles numeric, eta_minutes integer)
 LANGUAGE plpgsql
AS $function$
DECLARE
  company_settings_record RECORD;
  service_area_record RECORD;
  min_distance DECIMAL(10, 2) := 999999;
  closest_area_name VARCHAR(100) := NULL;
  closest_distance DECIMAL(10, 2) := 999999;
BEGIN
  -- Get company settings for base address
  SELECT base_latitude, base_longitude, service_radius_miles
  INTO company_settings_record
  FROM company_settings
  WHERE tenant_id = p_tenant_id;
  
  -- Check against base address if available
  IF company_settings_record.base_latitude IS NOT NULL AND 
     company_settings_record.base_longitude IS NOT NULL THEN
    
    min_distance := calculate_distance_miles(
      company_settings_record.base_latitude,
      company_settings_record.base_longitude,
      p_latitude,
      p_longitude
    );
    
    IF min_distance <= company_settings_record.service_radius_miles THEN
      closest_area_name := 'Base Service Area';
      closest_distance := min_distance;
    END IF;
  END IF;
  
  -- Check against specific service areas
  FOR service_area_record IN
    SELECT name, center_latitude, center_longitude, radius_miles
    FROM service_area_coverage
    WHERE tenant_id = p_tenant_id AND is_active = true
  LOOP
    min_distance := calculate_distance_miles(
      service_area_record.center_latitude,
      service_area_record.center_longitude,
      p_latitude,
      p_longitude
    );
    
    IF min_distance <= service_area_record.radius_miles AND 
       min_distance < closest_distance THEN
      closest_area_name := service_area_record.name;
      closest_distance := min_distance;
    END IF;
  END LOOP;
  
  -- Return result
  IF closest_area_name IS NOT NULL THEN
    is_serviced := true;
    service_area_name := closest_area_name;
    distance_miles := closest_distance;
    eta_minutes := GREATEST(15, ROUND(closest_distance * 2)); -- Rough ETA calculation
  ELSE
    is_serviced := false;
    service_area_name := NULL;
    distance_miles := closest_distance;
    eta_minutes := NULL;
  END IF;
  
  RETURN NEXT;
END;
$function$

CREATE OR REPLACE FUNCTION public.is_city_serviced(p_tenant_id uuid, p_city text, p_state text DEFAULT NULL::text)
 RETURNS TABLE(is_serviced boolean, service_area_name character varying, message text)
 LANGUAGE plpgsql
AS $function$
DECLARE
  service_area_record RECORD;
  found_areas INTEGER := 0;
  search_condition TEXT;
BEGIN
  -- Build search condition
  IF p_state IS NOT NULL THEN
    search_condition := p_city || ', ' || p_state;
  ELSE
    search_condition := p_city;
  END IF;
  
  -- Check if city is in any service area
  SELECT COUNT(*) INTO found_areas
  FROM service_area_coverage
  WHERE tenant_id = p_tenant_id 
    AND is_active = true 
    AND (p_city = ANY(cities) OR search_condition = ANY(cities));
  
  IF found_areas > 0 THEN
    -- Get the first matching service area name
    SELECT name INTO service_area_record
    FROM service_area_coverage
    WHERE tenant_id = p_tenant_id 
      AND is_active = true 
      AND (p_city = ANY(cities) OR search_condition = ANY(cities))
    LIMIT 1;
    
    is_serviced := true;
    service_area_name := service_area_record.name;
    message := 'City is in service area: ' || service_area_record.name;
  ELSE
    is_serviced := false;
    service_area_name := NULL;
    message := 'City is not in any service area';
  END IF;
  
  RETURN NEXT;
END;
$function$

CREATE OR REPLACE FUNCTION public.is_zip_serviced(p_tenant_id uuid, p_zip_code text)
 RETURNS TABLE(is_serviced boolean, service_area_name character varying, message text)
 LANGUAGE plpgsql
AS $function$
DECLARE
  service_area_record RECORD;
  found_areas INTEGER := 0;
BEGIN
  -- Check if ZIP code is in any service area
  SELECT COUNT(*) INTO found_areas
  FROM service_area_coverage
  WHERE tenant_id = p_tenant_id 
    AND is_active = true 
    AND p_zip_code = ANY(zip_codes);
  
  IF found_areas > 0 THEN
    -- Get the first matching service area name
    SELECT name INTO service_area_record
    FROM service_area_coverage
    WHERE tenant_id = p_tenant_id 
      AND is_active = true 
      AND p_zip_code = ANY(zip_codes)
    LIMIT 1;
    
    is_serviced := true;
    service_area_name := service_area_record.name;
    message := 'ZIP code is in service area: ' || service_area_record.name;
  ELSE
    is_serviced := false;
    service_area_name := NULL;
    message := 'ZIP code is not in any service area';
  END IF;
  
  RETURN NEXT;
END;
$function$

CREATE OR REPLACE FUNCTION public.log_audit_event()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    tenant_uuid UUID;
BEGIN
    -- Get tenant_id from the record, handling tables without tenant_id
    IF TG_TABLE_NAME = 'tenants' THEN
        tenant_uuid := COALESCE(NEW.id, OLD.id);
    ELSE
        tenant_uuid := COALESCE(NEW.tenant_id, OLD.tenant_id);
    END IF;
    
    INSERT INTO audit_logs (
        tenant_id,
        user_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values
    ) VALUES (
        tenant_uuid,
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW) ELSE to_jsonb(NEW) END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$function$

CREATE OR REPLACE FUNCTION public.mark_notifications_as_read(p_user_id uuid, p_tenant_id uuid, p_notification_ids uuid[] DEFAULT NULL::uuid[])
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  updated_count INTEGER;
BEGIN
  IF p_notification_ids IS NULL THEN
    -- Mark all notifications as read
    UPDATE notifications
    SET is_read = true, updated_at = NOW()
    WHERE user_id = p_user_id 
      AND tenant_id = p_tenant_id 
      AND is_read = false;
  ELSE
    -- Mark specific notifications as read
    UPDATE notifications
    SET is_read = true, updated_at = NOW()
    WHERE user_id = p_user_id 
      AND tenant_id = p_tenant_id 
      AND id = ANY(p_notification_ids);
  END IF;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$function$

CREATE OR REPLACE FUNCTION public.prevent_accidental_call_deletion()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Log the deletion attempt
  INSERT INTO audit_logs (
    tenant_id,
    user_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    OLD.tenant_id,
    auth.uid(),
    'DELETE_ATTEMPT',
    'calls',
    OLD.id,
    jsonb_build_object(
      'warning', 'Call deletion attempted',
      'call_id', OLD.id,
      'vapi_call_id', OLD.vapi_call_id,
      'from_number', OLD.from_number,
      'to_number', OLD.to_number,
      'created_at', OLD.created_at
    )
  );
  
  -- Allow the deletion but log it
  RETURN OLD;
END;
$function$

CREATE OR REPLACE FUNCTION public.purge_expired_data()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  policy_record RECORD;
  cutoff_date timestamp with time zone;
  deleted_count integer;
BEGIN
  -- Loop through all retention policies
  FOR policy_record IN 
    SELECT * FROM public.data_retention_policies 
    WHERE auto_purge = true
  LOOP
    -- Calculate cutoff date
    cutoff_date := now() - (policy_record.retention_days || ' days')::interval;
    
    -- Purge data based on table name
    CASE policy_record.table_name
      WHEN 'audit_logs' THEN
        DELETE FROM public.audit_logs 
        WHERE created_at < cutoff_date 
        AND tenant_id = policy_record.tenant_id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
      WHEN 'calls' THEN
        DELETE FROM public.calls 
        WHERE created_at < cutoff_date 
        AND tenant_id = policy_record.tenant_id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
      WHEN 'consent_records' THEN
        DELETE FROM public.consent_records 
        WHERE created_at < cutoff_date 
        AND tenant_id = policy_record.tenant_id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
      ELSE
        -- Skip unknown tables
        deleted_count := 0;
    END CASE;
    
    -- Update last purge time
    UPDATE public.data_retention_policies 
    SET last_purge = now(), updated_at = now()
    WHERE id = policy_record.id;
    
    -- Log the purge operation
    INSERT INTO public.audit_logs (
      tenant_id, 
      action, 
      resource_type, 
      resource_id, 
      new_values
    ) VALUES (
      policy_record.tenant_id,
      'data_purge_completed',
      'retention_policy',
      policy_record.id,
      jsonb_build_object(
        'table_name', policy_record.table_name,
        'deleted_count', deleted_count,
        'cutoff_date', cutoff_date
      )
    );
    
  END LOOP;
END;
$function$

CREATE OR REPLACE FUNCTION public.restore_deleted_call(call_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
  call_data RECORD;
BEGIN
  -- Get the call data from audit logs
  SELECT 
    old_data->>'tenant_id' as tenant_id,
    old_data->>'vapi_call_id' as vapi_call_id,
    old_data->>'direction' as direction,
    old_data->>'from_number' as from_number,
    old_data->>'to_number' as to_number,
    old_data->>'status' as status,
    old_data->>'transcript' as transcript,
    old_data->>'ai_summary' as ai_summary,
    old_data->>'metadata' as metadata
  INTO call_data
  FROM audit_logs 
  WHERE resource_type = 'calls' 
    AND action = 'DELETE' 
    AND resource_id = call_id
    AND old_data IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF call_data IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Restore the call
  INSERT INTO calls (
    id,
    tenant_id,
    vapi_call_id,
    direction,
    from_number,
    to_number,
    status,
    transcript,
    ai_summary,
    metadata,
    created_at,
    updated_at
  ) VALUES (
    call_id,
    call_data.tenant_id::UUID,
    call_data.vapi_call_id,
    call_data.direction::TEXT,
    call_data.from_number,
    call_data.to_number,
    call_data.status::TEXT,
    call_data.transcript,
    call_data.ai_summary,
    call_data.metadata::JSONB,
    NOW(),
    NOW()
  );
  
  RETURN TRUE;
END;
$function$

CREATE OR REPLACE FUNCTION public.sync_tenant_id_to_metadata()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_current_metadata_tenant_id uuid;
BEGIN
  -- Only update if tenant_id is not NULL and different from current value
  IF NEW.tenant_id IS NOT NULL THEN
    -- Get current metadata tenant_id (if exists)
    SELECT (raw_user_meta_data->>'tenant_id')::uuid INTO v_current_metadata_tenant_id
    FROM auth.users
    WHERE id = NEW.id;
    
    -- Only update if value changed or doesn't exist (preserves all other metadata)
    IF v_current_metadata_tenant_id IS DISTINCT FROM NEW.tenant_id THEN
      UPDATE auth.users
      SET raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{tenant_id}',
        to_jsonb(NEW.tenant_id)
      )
      WHERE id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$

CREATE OR REPLACE FUNCTION public.sync_user_tenant_metadata(user_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_tenant_id uuid;
  v_user_id uuid;
  v_current_metadata_tenant_id uuid;
BEGIN
  -- Get user's tenant_id from public.users
  SELECT u.id, u.tenant_id INTO v_user_id, v_tenant_id
  FROM public.users u
  WHERE u.email = user_email
  LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User % not found in public.users', user_email;
  END IF;
  
  IF v_tenant_id IS NULL THEN
    RAISE NOTICE 'User % has no tenant_id assigned', user_email;
    RETURN;
  END IF;
  
  -- Check current metadata value
  SELECT (raw_user_meta_data->>'tenant_id')::uuid INTO v_current_metadata_tenant_id
  FROM auth.users
  WHERE id = v_user_id;
  
  -- Only update if different (preserves all other metadata)
  IF v_current_metadata_tenant_id IS DISTINCT FROM v_tenant_id THEN
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{tenant_id}',
      to_jsonb(v_tenant_id)
    )
    WHERE id = v_user_id;
    
    RAISE NOTICE 'Synced tenant_id % to metadata for user % (preserved all other metadata)', v_tenant_id, user_email;
  ELSE
    RAISE NOTICE 'User % already has correct tenant_id in metadata', user_email;
  END IF;
END;
$function$

CREATE OR REPLACE FUNCTION public.test_user_creation_fix()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN 'Trigger fix applied successfully. User creation should now work.';
END;
$function$

CREATE OR REPLACE FUNCTION public.update_tenant_base_service_area(p_tenant_id uuid, p_base_address text, p_base_latitude numeric, p_base_longitude numeric, p_service_radius_miles integer DEFAULT 25, p_timezone character varying DEFAULT 'America/Chicago'::character varying)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE company_settings 
  SET 
    base_address = p_base_address,
    base_latitude = p_base_latitude,
    base_longitude = p_base_longitude,
    service_radius_miles = p_service_radius_miles,
    timezone = p_timezone,
    updated_at = NOW()
  WHERE tenant_id = p_tenant_id;
  
  RETURN FOUND;
END;
$function$

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$

CREATE OR REPLACE FUNCTION public.user_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
DECLARE
    user_id UUID;
    tenant_id UUID;
BEGIN
    -- Get the current user ID
    user_id := auth.uid();
    
    -- If no user ID, return NULL
    IF user_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Get tenant_id from users table (bypassing RLS with SECURITY DEFINER)
    SELECT u.tenant_id INTO tenant_id
    FROM public.users u
    WHERE u.id = user_id
    LIMIT 1;
    
    -- Return the tenant_id or NULL if not found
    RETURN tenant_id;
END;
$function$

-- =====================================================
-- EXPLICIT RLS AND POLICY DEFINITIONS
-- Sourced from legacy hardened migrations to preserve
-- tenant isolation and service_role webhook access.
-- =====================================================

-- Enable RLS on core tenant-scoped tables used by app runtime.
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_area_coverage ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting legacy policy names.
DROP POLICY IF EXISTS "Users can view appointments for their tenant" ON public.appointments;
DROP POLICY IF EXISTS "Users can insert appointments for their tenant" ON public.appointments;
DROP POLICY IF EXISTS "Users can update appointments for their tenant" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete appointments for their tenant" ON public.appointments;
DROP POLICY IF EXISTS "Service role bypass for appointments" ON public.appointments;

DROP POLICY IF EXISTS "Users can view clients for their tenant" ON public.clients;
DROP POLICY IF EXISTS "Users can insert clients for their tenant" ON public.clients;
DROP POLICY IF EXISTS "Users can update clients for their tenant" ON public.clients;
DROP POLICY IF EXISTS "Users can delete clients for their tenant" ON public.clients;
DROP POLICY IF EXISTS "Service role bypass for clients" ON public.clients;

DROP POLICY IF EXISTS "Users can view calls for their tenant" ON public.calls;
DROP POLICY IF EXISTS "Users can insert calls for their tenant" ON public.calls;
DROP POLICY IF EXISTS "Users can update calls for their tenant" ON public.calls;
DROP POLICY IF EXISTS "Users can delete calls for their tenant" ON public.calls;
DROP POLICY IF EXISTS "Service role bypass for calls" ON public.calls;

DROP POLICY IF EXISTS "Users can view services for their tenant" ON public.services;
DROP POLICY IF EXISTS "Users can insert services for their tenant" ON public.services;
DROP POLICY IF EXISTS "Users can update services for their tenant" ON public.services;
DROP POLICY IF EXISTS "Users can delete services for their tenant" ON public.services;
DROP POLICY IF EXISTS "Service role bypass for services" ON public.services;

DROP POLICY IF EXISTS "Users can view documents for their tenant" ON public.documents;
DROP POLICY IF EXISTS "Users can insert documents for their tenant" ON public.documents;
DROP POLICY IF EXISTS "Users can update documents for their tenant" ON public.documents;
DROP POLICY IF EXISTS "Users can delete documents for their tenant" ON public.documents;
DROP POLICY IF EXISTS "Service role bypass for documents" ON public.documents;

DROP POLICY IF EXISTS "Users can view notifications for their tenant" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert notifications for their tenant" ON public.notifications;
DROP POLICY IF EXISTS "Users can update notifications for their tenant" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete notifications for their tenant" ON public.notifications;
DROP POLICY IF EXISTS "Service role bypass for notifications" ON public.notifications;

DROP POLICY IF EXISTS "Users can view audit events in their tenant" ON public.audit_events;
DROP POLICY IF EXISTS "Users can insert audit events in their tenant" ON public.audit_events;
DROP POLICY IF EXISTS "Users can update audit events in their tenant" ON public.audit_events;
DROP POLICY IF EXISTS "Users can delete audit events in their tenant" ON public.audit_events;

DROP POLICY IF EXISTS "Users can view service area summary in their tenant" ON public.service_area_coverage;

-- Appointments
CREATE POLICY "Users can view appointments for their tenant" ON public.appointments
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Users can insert appointments for their tenant" ON public.appointments
  FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Users can update appointments for their tenant" ON public.appointments
  FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Users can delete appointments for their tenant" ON public.appointments
  FOR DELETE USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Service role bypass for appointments" ON public.appointments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Clients
CREATE POLICY "Users can view clients for their tenant" ON public.clients
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Users can insert clients for their tenant" ON public.clients
  FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Users can update clients for their tenant" ON public.clients
  FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Users can delete clients for their tenant" ON public.clients
  FOR DELETE USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Service role bypass for clients" ON public.clients
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Calls
CREATE POLICY "Users can view calls for their tenant" ON public.calls
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Users can insert calls for their tenant" ON public.calls
  FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Users can update calls for their tenant" ON public.calls
  FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Users can delete calls for their tenant" ON public.calls
  FOR DELETE USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Service role bypass for calls" ON public.calls
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Services
CREATE POLICY "Users can view services for their tenant" ON public.services
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Users can insert services for their tenant" ON public.services
  FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Users can update services for their tenant" ON public.services
  FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Users can delete services for their tenant" ON public.services
  FOR DELETE USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Service role bypass for services" ON public.services
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Documents
CREATE POLICY "Users can view documents for their tenant" ON public.documents
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Users can insert documents for their tenant" ON public.documents
  FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Users can update documents for their tenant" ON public.documents
  FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Users can delete documents for their tenant" ON public.documents
  FOR DELETE USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Service role bypass for documents" ON public.documents
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Notifications
CREATE POLICY "Users can view notifications for their tenant" ON public.notifications
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Users can insert notifications for their tenant" ON public.notifications
  FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Users can update notifications for their tenant" ON public.notifications
  FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Users can delete notifications for their tenant" ON public.notifications
  FOR DELETE USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Service role bypass for notifications" ON public.notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Audit events
CREATE POLICY "Users can view audit events in their tenant" ON public.audit_events
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Users can insert audit events in their tenant" ON public.audit_events
  FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Users can update audit events in their tenant" ON public.audit_events
  FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Users can delete audit events in their tenant" ON public.audit_events
  FOR DELETE USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

-- Service area coverage read isolation
CREATE POLICY "Users can view service area summary in their tenant" ON public.service_area_coverage
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
