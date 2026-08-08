import { useState, useEffect, useCallback, useRef } from 'react'
import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
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

async function loadFromFirestore(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'profile', 'data'))
    return snap.exists() ? (snap.data() as UserProfile) : null
  } catch {
    return null
  }
}

async function saveToFirestore(uid: string, profile: UserProfile): Promise<void> {
  try {
    await setDoc(doc(db, 'users', uid, 'profile', 'data'), profile, { merge: true })
  } catch (err) {
    console.warn('[useUserProfile] Firestore save failed, data saved locally only:', err)
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
        loaded = await loadFromFirestore(uid)
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
      await saveToFirestore(uidRef.current, next)
    }

    setIsSaving(false)
  }, [profile])

  return { profile, loading, save, isSaving }
}
