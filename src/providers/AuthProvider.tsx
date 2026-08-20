import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInAnonymously,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  linkWithPopup,
  signInWithCredential,
  type User,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  linkWithGoogle: () => Promise<'linked' | 'already_linked' | 'error'>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth || typeof auth.onAuthStateChanged !== 'function') {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser)
          setLoading(false)
        } else {
          signInAnonymously(auth).catch(() => setLoading(false))
        }
      },
      () => setLoading(false)
    )

    return unsubscribe
  }, [])

  const signOut = async () => {
    if (!auth || typeof auth.onAuthStateChanged !== 'function') return
    await firebaseSignOut(auth)
  }

  const linkWithGoogle = async (): Promise<'linked' | 'already_linked' | 'error'> => {
    if (!auth || typeof auth.onAuthStateChanged !== 'function') return 'error'
    const provider = new GoogleAuthProvider()
    try {
      await linkWithPopup(auth.currentUser!, provider)
      return 'linked'
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err) {
        // Google account already tied to a different UID — don't switch, keep current data safe
        if (err.code === 'auth/credential-already-in-use') {
          // Same Google account linked to a different anon UID (e.g. second device).
          // Sign in with the existing credential so this session adopts the real account.
          const credential = GoogleAuthProvider.credentialFromError(err as Parameters<typeof GoogleAuthProvider.credentialFromError>[0])
          if (credential) {
            try {
              await signInWithCredential(auth, credential)
              return 'linked'
            } catch {
              // fall through to already_linked
            }
          }
          return 'already_linked'
        }
        // User closed the popup — not an error worth showing
        if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') return 'error'
      }
      return 'error'
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, linkWithGoogle }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
