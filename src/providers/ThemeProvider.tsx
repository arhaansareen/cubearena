import { createContext, useCallback, useContext, useState } from 'react'

export type ThemeMode = 'dark' | 'light'
export type AccentKey = 'cyan' | 'purple' | 'green' | 'rose' | 'orange'

export const ACCENTS: Record<AccentKey, { label: string; color: string; dim: string; shadow: string }> = {
  cyan:   { label: 'Cyan',   color: '#22D3EE', dim: 'rgba(34,211,238,0.12)',  shadow: '0 0 28px rgba(34,211,238,0.18)' },
  purple: { label: 'Purple', color: '#A78BFA', dim: 'rgba(167,139,250,0.12)', shadow: '0 0 28px rgba(167,139,250,0.18)' },
  green:  { label: 'Green',  color: '#4ADE80', dim: 'rgba(74,222,128,0.12)',  shadow: '0 0 28px rgba(74,222,128,0.18)' },
  rose:   { label: 'Rose',   color: '#FB7185', dim: 'rgba(251,113,133,0.12)', shadow: '0 0 28px rgba(251,113,133,0.18)' },
  orange: { label: 'Orange', color: '#FB923C', dim: 'rgba(251,146,60,0.12)',  shadow: '0 0 28px rgba(251,146,60,0.18)' },
}

const DARK_BASE = {
  '--bg': '#020617',
  '--surface-0': '#0F172A',
  '--surface-1': '#1E293B',
  '--border': 'rgba(255,255,255,0.08)',
  '--text-primary': '#F8FAFC',
  '--text-muted': '#64748B',
  '--timer-idle': '#E2E8F0',
  '--timer-active': '#FFFFFF',
  '--shadow-soft': '0 4px 24px rgba(2,6,23,0.55)',
  '--shadow-deep': '0 8px 40px rgba(2,6,23,0.7)',
}

const LIGHT_BASE = {
  '--bg': '#F8FAFC',
  '--surface-0': '#FFFFFF',
  '--surface-1': '#F1F5F9',
  '--border': 'rgba(0,0,0,0.09)',
  '--text-primary': '#0F172A',
  '--text-muted': '#64748B',
  '--timer-idle': '#334155',
  '--timer-active': '#0F172A',
  '--shadow-soft': '0 4px 24px rgba(148,163,184,0.35)',
  '--shadow-deep': '0 8px 40px rgba(148,163,184,0.55)',
}

interface ThemeState { mode: ThemeMode; accent: AccentKey }
interface ThemeContextValue extends ThemeState {
  setMode: (m: ThemeMode) => void
  setAccent: (a: AccentKey) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const STORAGE_KEY = 'cubearena:theme'

function loadTheme(): ThemeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as ThemeState
  } catch {}
  return { mode: 'dark', accent: 'cyan' }
}

function applyTheme(state: ThemeState) {
  const root = document.documentElement
  const base = state.mode === 'dark' ? DARK_BASE : LIGHT_BASE
  const accent = ACCENTS[state.accent]
  const vars: Record<string, string> = {
    ...base,
    '--accent': accent.color,
    '--accent-dim': accent.dim,
    '--shadow-accent': accent.shadow,
  }
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeState>(() => {
    const t = loadTheme()
    applyTheme(t)
    return t
  })

  const setMode = useCallback((mode: ThemeMode) => {
    setTheme((prev) => {
      const next = { ...prev, mode }
      applyTheme(next)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const setAccent = useCallback((accent: AccentKey) => {
    setTheme((prev) => {
      const next = { ...prev, accent }
      applyTheme(next)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ ...theme, setMode, setAccent }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
