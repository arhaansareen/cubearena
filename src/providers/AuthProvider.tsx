import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface AuthContextValue {
  user: User | null
  loading: boolean
  isAnonymous: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const googleProvider = new GoogleAuthProvider()

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
        setUser(firebaseUser)
        setLoading(false)
      },
      () => setLoading(false)
    )

    return unsubscribe
  }, [])

  const signInWithGoogle = async (): Promise<void> => {
    if (!auth || typeof auth.onAuthStateChanged !== 'function') return
    await signInWithPopup(auth, googleProvider)
  }

  const signOut = async (): Promise<void> => {
    if (!auth || typeof auth.onAuthStateChanged !== 'function') return
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAnonymous: !user || user.isAnonymous,
      signInWithGoogle,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
