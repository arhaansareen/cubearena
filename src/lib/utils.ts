import type { Solve } from '@/types'

/**
 * Formats a millisecond value into a human-readable time string.
 * Returns "DNF" for Infinity.
 * Examples: 8320 -> "8.32", 63450 -> "1:03.45"
 */
export function formatTime(ms: number): string {
  if (!isFinite(ms)) return 'DNF'

  const totalCentiseconds = Math.floor(ms / 10)
  const centiseconds = totalCentiseconds % 100
  const totalSeconds = Math.floor(totalCentiseconds / 100)
  const seconds = totalSeconds % 60
  const minutes = Math.floor(totalSeconds / 60)

  const cs = String(centiseconds).padStart(2, '0')
  const sec = String(seconds).padStart(2, '0')

  if (minutes > 0) {
    return `${minutes}:${sec}.${cs}`
  }

  // For times under a minute, don't zero-pad the seconds
  return `${seconds}.${cs}`
}

/**
 * Computes the WCA average of N solves.
 * Trims the single best and single worst (by effectiveTime), averages the rest.
 * Returns null if there are fewer than n solves.
 * Returns Infinity if after trimming, any remaining solve is DNF.
 */
export function computeAo(solves: Solve[], n: number): number | null {
  if (solves.length < n) return null

  // Take the most recent n solves
  const subset = solves.slice(-n)
  const times = subset.map((s) => s.effectiveTime)

  // Sort to find best and worst
  const sorted = [...times].sort((a, b) => a - b)
  const trimmedBest = sorted[0]
  const trimmedWorst = sorted[sorted.length - 1]

  // Remove one instance of best and one of worst
  let removedBest = false
  let removedWorst = false
  const middle: number[] = []

  for (const t of times) {
    if (!removedBest && t === trimmedBest) {
      removedBest = true
      continue
    }
    if (!removedWorst && t === trimmedWorst) {
      removedWorst = true
      continue
    }
    middle.push(t)
  }

  // If any remaining is DNF (Infinity), the average is DNF
  if (middle.some((t) => !isFinite(t))) return Infinity

  const sum = middle.reduce((acc, t) => acc + t, 0)
  return sum / middle.length
}

/**
 * Computes the mean of the most recent n solves.
 * Returns null if there are fewer than n solves.
 * Returns Infinity if any solve in the window is DNF.
 */
export function computeMean(solves: Solve[], n: number): number | null {
  if (solves.length < n) return null

  const subset = solves.slice(-n)
  const times = subset.map((s) => s.effectiveTime)

  if (times.some((t) => !isFinite(t))) return Infinity

  const sum = times.reduce((acc, t) => acc + t, 0)
  return sum / times.length
}

/**
 * Generates a cryptographically random UUID v4.
 */
export function generateId(): string {
  return crypto.randomUUID()
}
