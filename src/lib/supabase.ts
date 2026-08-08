import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = !!(url && anonKey)

// Graceful fallback — app runs offline/Firebase-only if env vars missing
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(url!, anonKey!)
  : (null as unknown as SupabaseClient)

// ─── DB Types ─────────────────────────────────────────────────────────────────

export interface SupabaseProfile {
  firebase_uid: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  country_code: string | null
  goals: string | null
  wca_id: string | null
  main_event: string
  total_points: number
  solve_count: number
  day_streak: number
  last_solved_at: string | null
  created_at: string
  updated_at: string
}

export interface SupabaseSolve {
  id: string
  firebase_uid: string
  session_id: string
  event: string
  time_ms: number
  effective_time_ms: number | null  // null = DNF
  penalty: string | null
  scramble: string
  inspection_time_ms: number
  timestamp: string
  notes: string | null
  tags: string[]
}

export interface SupabaseSession {
  id: string
  firebase_uid: string
  event: string
  solve_count: number
  mean_ms: number | null
  best_ms: number | null
  ao5_ms: number | null
  ao12_ms: number | null
  points_earned: number
  started_at: string
  ended_at: string | null
}

export interface SupabaseAchievement {
  id: string
  firebase_uid: string
  type: string
  label: string
  icon: string
  earned_at: string
  metadata: Record<string, unknown> | null
}

export interface LeaderboardEntry {
  firebase_uid: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  country_code: string | null
  total_points: number
  event: string
  pb_ms: number
  solve_count: number
}
