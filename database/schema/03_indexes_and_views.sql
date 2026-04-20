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
