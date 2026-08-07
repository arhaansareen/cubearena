import { useCallback, useMemo, useState } from 'react'
import type { DayActivity, PlannedSession, WCAEvent } from '@/types'
import { generateId } from '@/lib/utils'

const PLANS_KEY = 'cubearena:plans'
const ACTIVITY_KEY = 'cubearena:activity'

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export interface UseCalendarReturn {
  plans: PlannedSession[]
  activity: DayActivity[]
  activityByDay: Map<string, DayActivity>
  plansByDay: Map<string, PlannedSession[]>
  streak: number
  weeklyFrequency: number[]
  createPlan: (draft: Omit<PlannedSession, 'id' | 'completedAt'>) => void
  deletePlan: (id: string) => void
  markComplete: (id: string) => void
  logActivity: (
    date: string,
    solveCount: number,
    ao5: number | null,
    mean: number | null,
    events: WCAEvent[]
  ) => void
}

export function useCalendar(): UseCalendarReturn {
  const [plans, setPlans] = useState<PlannedSession[]>(() =>
    loadJSON<PlannedSession[]>(PLANS_KEY, [])
  )
  const [activity, setActivity] = useState<DayActivity[]>(() =>
    loadJSON<DayActivity[]>(ACTIVITY_KEY, [])
  )

  const createPlan = useCallback((draft: Omit<PlannedSession, 'id' | 'completedAt'>) => {
    setPlans((prev) => {
      const next = [...prev, { ...draft, id: generateId(), completedAt: null }]
      localStorage.setItem(PLANS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const deletePlan = useCallback((id: string) => {
    setPlans((prev) => {
      const next = prev.filter((p) => p.id !== id)
      localStorage.setItem(PLANS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const markComplete = useCallback((id: string) => {
    setPlans((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, completedAt: Date.now() } : p))
      localStorage.setItem(PLANS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const logActivity = useCallback(
    (date: string, solveCount: number, ao5: number | null, mean: number | null, events: WCAEvent[]) => {
      setActivity((prev) => {
        const next = prev.some((a) => a.date === date)
          ? prev.map((a) => (a.date === date ? { date, solveCount, ao5, mean, events } : a))
          : [...prev, { date, solveCount, ao5, mean, events }]
        localStorage.setItem(ACTIVITY_KEY, JSON.stringify(next))
        return next
      })
    },
    []
  )

  const activityByDay = useMemo(() => {
    const map = new Map<string, DayActivity>()
    for (const a of activity) map.set(a.date, a)
    return map
  }, [activity])

  const plansByDay = useMemo(() => {
    const map = new Map<string, PlannedSession[]>()
    for (const p of plans) {
      const key = toDateKey(new Date(p.scheduledAt))
      const arr = map.get(key) ?? []
      arr.push(p)
      map.set(key, arr)
    }
    return map
  }, [plans])

  // Consecutive days ending at today that have activity or a completed plan
  const streak = useMemo(() => {
    let count = 0
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    for (;;) {
      const key = toDateKey(d)
      const hasActivity = (activityByDay.get(key)?.solveCount ?? 0) > 0
      const hasCompletedPlan = (plansByDay.get(key) ?? []).some((p) => p.completedAt !== null)
      if (!hasActivity && !hasCompletedPlan) break
      count++
      d.setDate(d.getDate() - 1)
    }
    return count
  }, [activityByDay, plansByDay])

  // Solve counts for the last 12 weeks, oldest → newest
  const weeklyFrequency = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startOfThisWeek = new Date(today)
    startOfThisWeek.setDate(today.getDate() - today.getDay())

    return Array.from({ length: 12 }, (_, i) => {
      const weekStart = new Date(startOfThisWeek)
      weekStart.setDate(startOfThisWeek.getDate() - (11 - i) * 7)
      let count = 0
      for (let day = 0; day < 7; day++) {
        const d = new Date(weekStart)
        d.setDate(weekStart.getDate() + day)
        count += activityByDay.get(toDateKey(d))?.solveCount ?? 0
      }
      return count
    })
  }, [activityByDay])

  return {
    plans,
    activity,
    activityByDay,
    plansByDay,
    streak,
    weeklyFrequency,
    createPlan,
    deletePlan,
    markComplete,
    logActivity,
  }
}
