import { createContext, useContext, type ReactNode } from 'react'
import { useAudio, type UseAudioReturn } from '@/hooks/useAudio'

const AudioContext = createContext<UseAudioReturn | null>(null)

interface AudioProviderProps {
  children: ReactNode
}

export function AudioProvider({ children }: AudioProviderProps) {
  const audio = useAudio()

  return <AudioContext.Provider value={audio}>{children}</AudioContext.Provider>
}

export function useAudioContext(): UseAudioReturn {
  const ctx = useContext(AudioContext)
  if (!ctx) {
    throw new Error('useAudioContext must be used within an AudioProvider')
  }
  return ctx
}
