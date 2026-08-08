import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = !!(url && anonKey)

// Graceful fallback — app runs offline/Firebase-only if env vars missing
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(url!, anonKey!)
  : (null as unknown as SupabaseClient)
