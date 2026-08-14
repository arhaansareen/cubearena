import { createContext, useCallback, useContext, useEffect, useState } from 'react'

export type ThemeMode = 'dark' | 'light'
export type AccentKey = 'cyan' | 'purple' | 'green' | 'rose' | 'orange' | 'custom'

export const ACCENTS: Record<Exclude<AccentKey, 'custom'>, { label: string; color: string; dim: string; shadow: string }> = {
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

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

function accentVarsFromHex(color: string) {
  const [r, g, b] = hexToRgb(color)
  return {
    '--accent': color,
    '--accent-dim': `rgba(${r},${g},${b},0.12)`,
    '--shadow-accent': `0 0 28px rgba(${r},${g},${b},0.18)`,
  }
}

interface ThemeState { mode: ThemeMode; accent: AccentKey; customColor: string }
interface ThemeContextValue extends ThemeState {
  setMode: (m: ThemeMode) => void
  setAccent: (a: AccentKey) => void
  setCustomColor: (hex: string) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const STORAGE_KEY = 'cubearena:theme'

function loadTheme(): ThemeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as ThemeState
  } catch {}
  return { mode: 'dark', accent: 'cyan', customColor: '#ffffff' }
}

function applyTheme(state: ThemeState) {
  const root = document.documentElement
  const base = state.mode === 'dark' ? DARK_BASE : LIGHT_BASE
  const accentVars =
    state.accent === 'custom'
      ? accentVarsFromHex(state.customColor)
      : { '--accent': ACCENTS[state.accent].color, '--accent-dim': ACCENTS[state.accent].dim, '--shadow-accent': ACCENTS[state.accent].shadow }
  const vars = { ...base, ...accentVars }
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeState>(() => {
    const t = loadTheme()
    applyTheme(t) // apply synchronously before first paint
    return t
  })

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme))
  }, [theme])

  const setMode = useCallback((mode: ThemeMode) => setTheme((prev) => ({ ...prev, mode })), [])
  const setAccent = useCallback((accent: AccentKey) => setTheme((prev) => ({ ...prev, accent })), [])
  const setCustomColor = useCallback((customColor: string) => setTheme((prev) => ({ ...prev, accent: 'custom', customColor })), [])

  return (
    <ThemeContext.Provider value={{ ...theme, setMode, setAccent, setCustomColor }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
