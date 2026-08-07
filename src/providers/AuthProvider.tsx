import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Guard against uninitialized auth (e.g., missing Firebase config)
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
          // Sign in anonymously so there is always a uid for Firestore writes
          signInAnonymously(auth).catch((err) => {
            console.warn('[AuthProvider] Anonymous sign-in failed:', err)
            setLoading(false)
          })
        }
      },
      (error) => {
        console.warn('[AuthProvider] onAuthStateChanged error:', error)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string): Promise<void> => {
    if (!auth || typeof auth.onAuthStateChanged !== 'function') {
      throw new Error('Firebase is not configured. Check your environment variables.')
    }
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signOut = async (): Promise<void> => {
    if (!auth || typeof auth.onAuthStateChanged !== 'function') return
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
