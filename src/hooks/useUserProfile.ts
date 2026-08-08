import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { UserProfile } from '@/types'

const LS_KEY = 'cubearena:profile'

function loadFromStorage(): UserProfile | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as UserProfile) : null
  } catch {
    return null
  }
}

function saveToStorage(profile: UserProfile) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(profile))
  } catch {}
}

async function loadFromSupabase(uid: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured) return null
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single()
    if (error || !data) return null
    return {
      displayName: (data.display_name as string) ?? '',
      wcaId: (data.wca_id as string | null) ?? null,
      updatedAt: new Date(data.updated_at as string).getTime(),
    }
  } catch {
    return null
  }
}

async function saveToSupabase(uid: string, profile: UserProfile): Promise<void> {
  if (!isSupabaseConfigured) return
  try {
    const { error } = await supabase.from('profiles').upsert({
      id: uid,
      display_name: profile.displayName,
      wca_id: profile.wcaId,
      updated_at: new Date(profile.updatedAt).toISOString(),
    })
    if (error) console.warn('[useUserProfile] Supabase save failed:', error)
  } catch (err) {
    console.warn('[useUserProfile] save failed:', err)
  }
}

export interface UseUserProfileReturn {
  profile: UserProfile | null
  loading: boolean
  save: (updates: Partial<Omit<UserProfile, 'updatedAt'>>) => Promise<void>
  isSaving: boolean
}

export function useUserProfile(uid: string | null): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const uidRef = useRef(uid)
  uidRef.current = uid

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    async function load() {
      let loaded: UserProfile | null = null
      if (uid) {
        loaded = await loadFromSupabase(uid)
      }
      if (!loaded) {
        loaded = loadFromStorage()
      }
      if (!cancelled) {
        setProfile(loaded)
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [uid])

  const save = useCallback(async (updates: Partial<Omit<UserProfile, 'updatedAt'>>) => {
    const next: UserProfile = {
      displayName: '',
      wcaId: null,
      ...profile,
      ...updates,
      updatedAt: Date.now(),
    }

    setIsSaving(true)
    setProfile(next)
    saveToStorage(next)

    if (uidRef.current) {
      await saveToSupabase(uidRef.current, next)
    }

    setIsSaving(false)
  }, [profile])

  return { profile, loading, save, isSaving }
}
