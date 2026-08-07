import { createContext, useContext, type ReactNode } from 'react'
import { useUserProfile, type UseUserProfileReturn } from '@/hooks/useUserProfile'
import { useAuth } from '@/providers/AuthProvider'

const ProfileContext = createContext<UseUserProfileReturn | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const profileData = useUserProfile(user?.uid ?? null)

  return <ProfileContext.Provider value={profileData}>{children}</ProfileContext.Provider>
}

export function useProfile(): UseUserProfileReturn {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within a ProfileProvider')
  return ctx
}
