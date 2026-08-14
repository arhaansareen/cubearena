import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured, type SupabaseProfile } from '@/lib/supabase'

export interface ProfileUpdate {
  username?: string
  display_name?: string
  bio?: string
  country_code?: string
  goals?: string
  wca_id?: string
  main_event?: string
}

export interface UseSupabaseProfileReturn {
  profile: SupabaseProfile | null
  loading: boolean
  error: string | null
  upsertProfile: (update: ProfileUpdate) => Promise<void>
  uploadAvatar: (file: File) => Promise<string | null>
  refreshProfile: () => Promise<void>
}

export function useSupabaseProfile(uid: string | null | undefined): UseSupabaseProfileReturn {
  const [profile, setProfile] = useState<SupabaseProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!uid || !isSupabaseConfigured) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .eq('firebase_uid', uid)
        .maybeSingle()
      if (err) throw err
      setProfile(data)
    } catch (e) {
      console.warn('[useSupabaseProfile] fetch failed', e)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [uid])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const upsertProfile = useCallback(async (update: ProfileUpdate) => {
    if (!uid || !isSupabaseConfigured) return
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .upsert(
          {
            firebase_uid: uid,
            ...update,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'firebase_uid' }
        )
        .select()
        .maybeSingle()
      if (err) throw err
      if (data) setProfile(data)
    } catch (e) {
      console.warn('[useSupabaseProfile] upsert failed', e)
      setError('Failed to save profile')
    }
  }, [uid])

  const uploadAvatar = useCallback(async (file: File): Promise<string | null> => {
    if (!uid || !isSupabaseConfigured) return null
    setError(null)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${uid}/avatar.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadErr) throw uploadErr

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const avatarUrl = `${data.publicUrl}?t=${Date.now()}` // cache-bust

      await upsertProfile({ ...profile, avatar_url: avatarUrl } as ProfileUpdate)
      return avatarUrl
    } catch (e) {
      console.warn('[useSupabaseProfile] avatar upload failed', e)
      setError('Failed to upload avatar')
      return null
    }
  }, [uid, profile, upsertProfile])

  return {
    profile,
    loading,
    error,
    upsertProfile,
    uploadAvatar,
    refreshProfile: fetchProfile,
  }
}
