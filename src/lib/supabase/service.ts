import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database-comprehensive'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

// Service role client that bypasses RLS policies
export const createServiceClient = () => {
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Alias for backward compatibility
export const supabaseAdmin = createServiceClient