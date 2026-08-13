import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Solve } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(ms: number): string {
  if (!isFinite(ms)) return 'DNF'
  const totalCentiseconds = Math.floor(ms / 10)
  const centiseconds = totalCentiseconds % 100
  const totalSeconds = Math.floor(totalCentiseconds / 100)
  const seconds = totalSeconds % 60
  const minutes = Math.floor(totalSeconds / 60)
  const cs = String(centiseconds).padStart(2, '0')
  const sec = String(seconds).padStart(2, '0')
  if (minutes > 0) return `${minutes}:${sec}.${cs}`
  return `${seconds}.${cs}`
}

export function computeAo(solves: Solve[], n: number): number | null {
  const valid = solves.filter((s) => isFinite(s.effectiveTime))
  if (valid.length < n) return null
  const last = valid.slice(-n).map((s) => s.effectiveTime)
  const sorted = [...last].sort((a, b) => a - b)
  const trimmed = sorted.slice(1, -1)
  if (trimmed.some((t) => !isFinite(t))) return Infinity
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length
}

export function computeMean(solves: Solve[], n: number): number | null {
  const valid = solves.filter((s) => isFinite(s.effectiveTime))
  if (valid.length < n) return null
  const last = valid.slice(-n)
  const sum = last.reduce((a, s) => a + s.effectiveTime, 0)
  return sum / last.length
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
