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

