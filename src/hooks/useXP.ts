import { useState, useCallback } from 'react'

const LS_KEY = 'cubearena:xp'

export interface XPState {
  totalXP: number
  level: number
  progress: number   // 0–1 within current level
  xpInLevel: number  // XP earned inside current level
  xpForNext: number  // XP needed to reach next level
}

function compute(xp: number): XPState {
  // Level N requires N² × 80 total XP (L1=80, L2=320, L3=720…)
  const level = Math.floor(Math.sqrt(xp / 80))
  const xpAtLevel = level * level * 80
  const xpAtNext = (level + 1) * (level + 1) * 80
  const span = xpAtNext - xpAtLevel
  return {
    totalXP: xp,
    level,
    progress: (xp - xpAtLevel) / span,
    xpInLevel: xp - xpAtLevel,
    xpForNext: span,
  }
}

function load(): number {
  try { return Math.max(0, parseInt(localStorage.getItem(LS_KEY) ?? '0') || 0) }
  catch { return 0 }
}

export function useXP() {
  const [state, setState] = useState<XPState>(() => compute(load()))

  const addXP = useCallback((amount: number) => {
    setState(prev => {
      const next = compute(prev.totalXP + amount)
      try { localStorage.setItem(LS_KEY, String(next.totalXP)) } catch {}
      return next
    })
  }, [])

  return { ...state, addXP }
}
