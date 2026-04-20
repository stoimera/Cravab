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
