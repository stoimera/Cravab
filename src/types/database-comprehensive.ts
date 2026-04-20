// =============================================
// VENLYN OS - COMPREHENSIVE DATABASE TYPES
// =============================================
// Complete TypeScript types for all database tables
// Matches the comprehensive schema exactly

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          slug: string | null
          email: string | null
          phone: string | null
          address: string | null
          base_address: string | null
          timezone: string | null
          service_area: string | null
          service_radius: number | null
          business_hours: any | null
          subscription_active: boolean | null
          subscription_plan: string | null
          status: 'active' | 'inactive' | 'suspended'
          vapi_api_key_encrypted: string | null
          vapi_public_api_key: string | null
          vapi_assistant_id: string | null
          twilio_phone_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          base_address?: string | null
          timezone?: string | null
          service_area?: string | null
          service_radius?: number | null
          business_hours?: any | null
          subscription_active?: boolean | null
          subscription_plan?: string | null
          status?: 'active' | 'inactive' | 'suspended'
          vapi_api_key_encrypted?: string | null
          vapi_public_api_key?: string | null
          vapi_assistant_id?: string | null
          twilio_phone_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          base_address?: string | null
          timezone?: string | null
          service_area?: string | null
          service_radius?: number | null
          business_hours?: any | null
          subscription_active?: boolean | null
          subscription_plan?: string | null
          status?: 'active' | 'inactive' | 'suspended'
          vapi_api_key_encrypted?: string | null
          vapi_public_api_key?: string | null
          vapi_assistant_id?: string | null
          twilio_phone_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          tenant_id: string
          email: string
          role: 'admin' | 'manager' | 'worker'
          first_name: string | null
          last_name: string | null
          phone: string | null
          title: string | null
          permissions: any
          is_active: boolean
          status: 'active' | 'inactive' | 'pending'
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          email: string
          role?: 'admin' | 'manager' | 'worker'
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          title?: string | null
          permissions?: any
          is_active?: boolean
          status?: 'active' | 'inactive' | 'pending'
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          email?: string
          role?: 'admin' | 'manager' | 'worker'
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          title?: string | null
          permissions?: any
          is_active?: boolean
          status?: 'active' | 'inactive' | 'pending'
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      company_settings: {
        Row: {
          id: string
          tenant_id: string
          business_hours: any
          service_area: any
          ai_settings: any
          notification_settings: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          business_hours?: any
          service_area?: any
          ai_settings?: any
          notification_settings?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          business_hours?: any
          service_area?: any
          ai_settings?: any
          notification_settings?: any
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      services: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          price: number | null
          duration_minutes: number
          category: string | null
          base_price: number | null
          hourly_rate: number | null
          minimum_charge: number | null
          emergency_surcharge: number | null
          estimated_duration_minutes: number | null
          is_emergency_service: boolean | null
          requires_equipment: boolean | null
          equipment_list: string[] | null
          required_permits: string[] | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          description?: string | null
          price?: number | null
          duration_minutes?: number
          category?: string | null
          base_price?: number | null
          hourly_rate?: number | null
          minimum_charge?: number | null
          emergency_surcharge?: number | null
          estimated_duration_minutes?: number | null
          is_emergency_service?: boolean | null
          requires_equipment?: boolean | null
          equipment_list?: string[] | null
          required_permits?: string[] | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          description?: string | null
          price?: number | null
          duration_minutes?: number
          category?: string | null
          base_price?: number | null
          hourly_rate?: number | null
          minimum_charge?: number | null
          emergency_surcharge?: number | null
          estimated_duration_minutes?: number | null
          is_emergency_service?: boolean | null
          requires_equipment?: boolean | null
          equipment_list?: string[] | null
          required_permits?: string[] | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      clients: {
        Row: {
          id: string
          tenant_id: string
          first_name: string
          last_name: string
          phone: string
          email: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          country: string | null
          status: 'active' | 'inactive' | 'blocked'
          preferred_contact_method: 'phone' | 'email' | 'sms' | null
          preferred_appointment_time: string | null
          notes: string | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          first_name: string
          last_name: string
          phone: string
          email?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          country?: string | null
          status?: 'active' | 'inactive' | 'blocked'
          preferred_contact_method?: 'phone' | 'email' | 'sms' | null
          preferred_appointment_time?: string | null
          notes?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          first_name?: string
          last_name?: string
          phone?: string
          email?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          country?: string | null
          status?: 'active' | 'inactive' | 'blocked'
          preferred_contact_method?: 'phone' | 'email' | 'sms' | null
          preferred_appointment_time?: string | null
          notes?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      appointments: {
        Row: {
          id: string
          tenant_id: string
          client_id: string
          service_id: string | null
          title: string
          description: string | null
          starts_at: string
          ends_at: string
          duration_minutes: number
          status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          notes: string | null
          priority: 'normal' | 'high' | 'emergency'
        address: string | null
        city: string | null
        state: string | null
        zip_code: string | null
        coordinates: any
        eta_minutes: number | null
        created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          client_id: string
          service_id?: string | null
          title: string
          description?: string | null
          starts_at: string
          ends_at: string
          duration_minutes: number
          status?: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          notes?: string | null
          priority?: 'normal' | 'high' | 'emergency'
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          coordinates?: any
          eta_minutes?: number | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          client_id?: string
          service_id?: string | null
          title?: string
          description?: string | null
          starts_at?: string
          ends_at?: string
          duration_minutes?: number
          status?: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          notes?: string | null
          priority?: 'normal' | 'high' | 'emergency'
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          coordinates?: any
          eta_minutes?: number | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      calls: {
        Row: {
          id: string
          tenant_id: string
          client_id: string | null
          vapi_call_id: string | null
          direction: 'inbound' | 'outbound'
          from_number: string | null
          to_number: string | null
          status: 'in_progress' | 'started' | 'ringing' | 'completed' | 'failed' | 'busy' | 'no_answer'
          duration_seconds: number | null
          recording_url: string | null
          transcript: string | null
          ai_sentiment: string | null
          ai_intent: string | null
          ai_summary: string | null
          follow_up_required: boolean | null
          follow_up_reason: string | null
          follow_up_notes: string | null
          follow_up_urgency: 'emergency' | 'urgent' | 'standard' | null
          follow_up_callback_timeframe: string | null
          follow_up_completed_at: string | null
          priority: 'normal' | 'high' | 'emergency'
          metadata: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          client_id?: string | null
          vapi_call_id?: string | null
          direction: 'inbound' | 'outbound'
          from_number?: string | null
          to_number?: string | null
          status?: 'in_progress' | 'started' | 'ringing' | 'completed' | 'failed' | 'busy' | 'no_answer'
          duration_seconds?: number | null
          recording_url?: string | null
          transcript?: string | null
          ai_sentiment?: string | null
          ai_intent?: string | null
          ai_summary?: string | null
          follow_up_required?: boolean | null
          follow_up_reason?: string | null
          follow_up_notes?: string | null
          follow_up_urgency?: 'emergency' | 'urgent' | 'standard' | null
          follow_up_callback_timeframe?: string | null
          follow_up_completed_at?: string | null
          priority?: 'normal' | 'high' | 'emergency'
          metadata?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          client_id?: string | null
          vapi_call_id?: string | null
          direction?: 'inbound' | 'outbound'
          from_number?: string | null
          to_number?: string | null
          status?: 'in_progress' | 'started' | 'ringing' | 'completed' | 'failed' | 'busy' | 'no_answer'
          duration_seconds?: number | null
          recording_url?: string | null
          transcript?: string | null
          ai_sentiment?: string | null
          ai_intent?: string | null
          ai_summary?: string | null
          follow_up_required?: boolean | null
          follow_up_reason?: string | null
          follow_up_notes?: string | null
          follow_up_urgency?: 'emergency' | 'urgent' | 'standard' | null
          follow_up_callback_timeframe?: string | null
          follow_up_completed_at?: string | null
          priority?: 'normal' | 'high' | 'emergency'
          metadata?: any
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calls_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      documents: {
        Row: {
          id: string
          tenant_id: string
          client_id: string | null
          appointment_id: string | null
          call_id: string | null
          filename: string
          original_filename: string
          file_type: string
          file_size: number
          mime_type: string
          storage_path: string
          category: 'invoice' | 'contract' | 'estimate' | 'photo' | 'receipt' | 'other' | null
          description: string | null
          tags: string[] | null
          is_public: boolean | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          client_id?: string | null
          appointment_id?: string | null
          call_id?: string | null
          filename: string
          original_filename: string
          file_type: string
          file_size: number
          mime_type: string
          storage_path: string
          category?: 'invoice' | 'contract' | 'estimate' | 'photo' | 'receipt' | 'other' | null
          description?: string | null
          tags?: string[] | null
          is_public?: boolean | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          client_id?: string | null
          appointment_id?: string | null
          call_id?: string | null
          filename?: string
          original_filename?: string
          file_type?: string
          file_size?: number
          mime_type?: string
          storage_path?: string
          category?: 'invoice' | 'contract' | 'estimate' | 'photo' | 'receipt' | 'other' | null
          description?: string | null
          tags?: string[] | null
          is_public?: boolean | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_appointment_id_fkey"
            columns: ["appointment_id"]
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_call_id_fkey"
            columns: ["call_id"]
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      invoices: {
        Row: {
          id: string
          tenant_id: string
          client_id: string
          appointment_id: string | null
          invoice_number: string
          status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          subtotal: number
          tax_amount: number | null
          total_amount: number
          due_date: string | null
          paid_date: string | null
          payment_method: string | null
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          client_id: string
          appointment_id?: string | null
          invoice_number: string
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          subtotal: number
          tax_amount?: number | null
          total_amount: number
          due_date?: string | null
          paid_date?: string | null
          payment_method?: string | null
          notes?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          client_id?: string
          appointment_id?: string | null
          invoice_number?: string
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          due_date?: string | null
          paid_date?: string | null
          payment_method?: string | null
          notes?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_appointment_id_fkey"
            columns: ["appointment_id"]
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      payments: {
        Row: {
          id: string
          tenant_id: string
          invoice_id: string
          amount: number
          payment_method: 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'other'
          payment_reference: string | null
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          processed_at: string | null
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          invoice_id: string
          amount: number
          payment_method: 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'other'
          payment_reference?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          processed_at?: string | null
          notes?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          invoice_id?: string
          amount?: number
          payment_method?: 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'other'
          payment_reference?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          processed_at?: string | null
          notes?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      equipment: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          category: string | null
          serial_number: string | null
          purchase_date: string | null
          warranty_expiry: string | null
          status: 'active' | 'maintenance' | 'retired' | 'lost'
          location: string | null
          assigned_to: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          description?: string | null
          category?: string | null
          serial_number?: string | null
          purchase_date?: string | null
          warranty_expiry?: string | null
          status?: 'active' | 'maintenance' | 'retired' | 'lost'
          location?: string | null
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          description?: string | null
          category?: string | null
          serial_number?: string | null
          purchase_date?: string | null
          warranty_expiry?: string | null
          status?: 'active' | 'maintenance' | 'retired' | 'lost'
          location?: string | null
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_assigned_to_fkey"
            columns: ["assigned_to"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      reports: {
        Row: {
          id: string
          tenant_id: string
          name: string
          type: 'calls' | 'appointments' | 'revenue' | 'clients' | 'custom'
          parameters: any
          data: any
          generated_by: string
          generated_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          type: 'calls' | 'appointments' | 'revenue' | 'clients' | 'custom'
          parameters?: any
          data?: any
          generated_by: string
          generated_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          type?: 'calls' | 'appointments' | 'revenue' | 'clients' | 'custom'
          parameters?: any
          data?: any
          generated_by?: string
          generated_at?: string
          expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_generated_by_fkey"
            columns: ["generated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      jarvis_configs: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          system_prompt: string | null
          features: any
          knowledge_base: any
          is_active: boolean | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          description?: string | null
          system_prompt?: string | null
          features?: any
          knowledge_base?: any
          is_active?: boolean | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          description?: string | null
          system_prompt?: string | null
          features?: any
          knowledge_base?: any
          is_active?: boolean | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jarvis_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jarvis_configs_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      jarvis_conversations: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          session_id: string
          message: string
          response: string | null
          message_type: 'user' | 'assistant' | 'system'
          context: any
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id: string
          session_id: string
          message: string
          response?: string | null
          message_type: 'user' | 'assistant' | 'system'
          context?: any
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string
          session_id?: string
          message?: string
          response?: string | null
          message_type?: 'user' | 'assistant' | 'system'
          context?: any
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jarvis_conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jarvis_conversations_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      sop_materials: {
        Row: {
          id: string
          tenant_id: string
          title: string
          content: string
          category: string
          tags: string[] | null
          is_published: boolean | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          title: string
          content: string
          category: string
          tags?: string[] | null
          is_published?: boolean | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          title?: string
          content?: string
          category?: string
          tags?: string[] | null
          is_published?: boolean | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sop_materials_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sop_materials_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      eta_cache: {
        Row: {
          id: string
          tenant_id: string
          origin: string
          destination: string
          eta_minutes: number
          distance_miles: number | null
          cached_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          origin: string
          destination: string
          eta_minutes: number
          distance_miles?: number | null
          cached_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          origin?: string
          destination?: string
          eta_minutes?: number
          distance_miles?: number | null
          cached_at?: string
          expires_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eta_cache_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      runtime_usage: {
        Row: {
          id: string
          tenant_id: string
          month: number
          year: number
          call_minutes: number | null
          sms_count: number | null
          api_calls: number | null
          cost_usd: number | null
          limits: any
          alerts_sent: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          month: number
          year: number
          call_minutes?: number | null
          sms_count?: number | null
          api_calls?: number | null
          cost_usd?: number | null
          limits?: any
          alerts_sent?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          month?: number
          year?: number
          call_minutes?: number | null
          sms_count?: number | null
          api_calls?: number | null
          cost_usd?: number | null
          limits?: any
          alerts_sent?: any
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "runtime_usage_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      access_requests: {
        Row: {
          id: string
          tenant_id: string
          user_id: string | null
          email: string
          role: 'admin' | 'manager' | 'worker'
          status: 'pending' | 'approved' | 'rejected' | 'expired'
          requested_by: string | null
          approved_by: string | null
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id?: string | null
          email: string
          role: 'admin' | 'manager' | 'worker'
          status?: 'pending' | 'approved' | 'rejected' | 'expired'
          requested_by?: string | null
          approved_by?: string | null
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string | null
          email?: string
          role?: 'admin' | 'manager' | 'worker'
          status?: 'pending' | 'approved' | 'rejected' | 'expired'
          requested_by?: string | null
          approved_by?: string | null
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_requests_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_requests_requested_by_fkey"
            columns: ["requested_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_requests_approved_by_fkey"
            columns: ["approved_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      usage_logs: {
        Row: {
          id: string
          tenant_id: string
          feature: string
          usage_amount: number
          unit: string
          cost_usd: number | null
          metadata: any
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          feature: string
          usage_amount: number
          unit: string
          cost_usd?: number | null
          metadata?: any
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          feature?: string
          usage_amount?: number
          unit?: string
          cost_usd?: number | null
          metadata?: any
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          type: 'error' | 'success' | 'info' | 'warning' | 'appointment' | 'call' | 'system' | 'payment' | 'invoice'
          title: string
          message: string
          data: any
          is_read: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id: string
          type: 'error' | 'success' | 'info' | 'warning' | 'appointment' | 'call' | 'system' | 'payment' | 'invoice'
          title: string
          message: string
          data?: any
          is_read?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string
          type?: 'error' | 'success' | 'info' | 'warning' | 'appointment' | 'call' | 'system' | 'payment' | 'invoice'
          title?: string
          message?: string
          data?: any
          is_read?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_logs: {
        Row: {
          id: string
          tenant_id: string | null
          user_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          old_values: any
          new_values: any
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          user_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          old_values?: any
          new_values?: any
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string | null
          user_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          old_values?: any
          new_values?: any
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// =============================================
// TYPE ALIASES FOR EASY ACCESS
// =============================================

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']

// Core entity types
export type Tenant = Tables<'tenants'>
export type User = Tables<'users'>
export type CompanySettings = Tables<'company_settings'>
export type Service = Tables<'services'>
export type Client = Tables<'clients'>
export type Appointment = Tables<'appointments'>
export type Call = Tables<'calls'>
export type Document = Tables<'documents'>
export type Invoice = Tables<'invoices'>
export type Payment = Tables<'payments'>
export type Equipment = Tables<'equipment'>
export type Report = Tables<'reports'>
export type JarvisConfig = Tables<'jarvis_configs'>
export type JarvisConversation = Tables<'jarvis_conversations'>
export type SOPMaterial = Tables<'sop_materials'>
export type ETACache = Tables<'eta_cache'>
export type RuntimeUsage = Tables<'runtime_usage'>
export type AccessRequest = Tables<'access_requests'>
export type UsageLog = Tables<'usage_logs'>
export type Notification = Tables<'notifications'>
export type AuditLog = Tables<'audit_logs'>

// Insert types
export type TenantInsert = Database['public']['Tables']['tenants']['Insert']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type CompanySettingsInsert = Database['public']['Tables']['company_settings']['Insert']
export type ServiceInsert = Database['public']['Tables']['services']['Insert']
export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type AppointmentInsert = Database['public']['Tables']['appointments']['Insert']
export type CallInsert = Database['public']['Tables']['calls']['Insert']
export type DocumentInsert = Database['public']['Tables']['documents']['Insert']
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']
export type PaymentInsert = Database['public']['Tables']['payments']['Insert']
export type EquipmentInsert = Database['public']['Tables']['equipment']['Insert']
export type ReportInsert = Database['public']['Tables']['reports']['Insert']
export type JarvisConfigInsert = Database['public']['Tables']['jarvis_configs']['Insert']
export type JarvisConversationInsert = Database['public']['Tables']['jarvis_conversations']['Insert']
export type SOPMaterialInsert = Database['public']['Tables']['sop_materials']['Insert']
export type ETACacheInsert = Database['public']['Tables']['eta_cache']['Insert']
export type RuntimeUsageInsert = Database['public']['Tables']['runtime_usage']['Insert']
export type AccessRequestInsert = Database['public']['Tables']['access_requests']['Insert']
export type UsageLogInsert = Database['public']['Tables']['usage_logs']['Insert']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
export type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert']

// Update types
export type TenantUpdate = Database['public']['Tables']['tenants']['Update']
export type UserUpdate = Database['public']['Tables']['users']['Update']
export type CompanySettingsUpdate = Database['public']['Tables']['company_settings']['Update']
export type ServiceUpdate = Database['public']['Tables']['services']['Update']
export type ClientUpdate = Database['public']['Tables']['clients']['Update']
export type AppointmentUpdate = Database['public']['Tables']['appointments']['Update']
export type CallUpdate = Database['public']['Tables']['calls']['Update']
export type DocumentUpdate = Database['public']['Tables']['documents']['Update']
export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update']
export type PaymentUpdate = Database['public']['Tables']['payments']['Update']
export type EquipmentUpdate = Database['public']['Tables']['equipment']['Update']
export type ReportUpdate = Database['public']['Tables']['reports']['Update']
export type JarvisConfigUpdate = Database['public']['Tables']['jarvis_configs']['Update']
export type JarvisConversationUpdate = Database['public']['Tables']['jarvis_conversations']['Update']
export type SOPMaterialUpdate = Database['public']['Tables']['sop_materials']['Update']
export type ETACacheUpdate = Database['public']['Tables']['eta_cache']['Update']
export type RuntimeUsageUpdate = Database['public']['Tables']['runtime_usage']['Update']
export type AccessRequestUpdate = Database['public']['Tables']['access_requests']['Update']
export type UsageLogUpdate = Database['public']['Tables']['usage_logs']['Update']
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update']
export type AuditLogUpdate = Database['public']['Tables']['audit_logs']['Update']

// =============================================
// RELATIONSHIP TYPES
// =============================================

// Appointment with related data
export type AppointmentWithClient = Appointment & {
  clients: Client
  services: Service | null
  users: User
}

// Call with related data
export type CallWithClient = Call & {
  clients: Client | null
}

// Document with related data
export type DocumentWithRelations = Document & {
  clients: Client | null
  appointments: Appointment | null
  calls: Call | null
  users: User
}

// Invoice with related data
export type InvoiceWithClient = Invoice & {
  clients: Client
  appointments: Appointment | null
  users: User
}

// Payment with related data
export type PaymentWithInvoice = Payment & {
  invoices: Invoice
  users: User
}

// Equipment with assigned user
export type EquipmentWithUser = Equipment & {
  users: User | null
}

// Report with generated by user
export type ReportWithUser = Report & {
  users: User
}

// Jarvis Conversation with user
export type JarvisConversationWithUser = JarvisConversation & {
  users: User
}

// SOP Material with created by user
export type SOPMaterialWithUser = SOPMaterial & {
  users: User
}

// Access Request with related users
export type AccessRequestWithUsers = AccessRequest & {
  users: User | null
  requested_by_user: User | null
  approved_by_user: User | null
}

// Notification with user
export type NotificationWithUser = Notification & {
  users: User
}

// =============================================
// BACKWARD COMPATIBILITY
// =============================================

// Legacy type aliases for backward compatibility
export type Company = Tenant
export type CompanyInsert = TenantInsert
export type CompanyUpdate = TenantUpdate
export type CompanyWithUser = Tenant & {
  users: User[]
}