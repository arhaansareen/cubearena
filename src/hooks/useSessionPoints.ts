import { useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Solve, WCAEvent } from '@/types'

// ─── Points formula ────────────────────────────────────────────────────────────
// +10  per completed solve
// +100 if a new PB was set this session
// +50  if consistency score < 10% variance (steady hands)
// +5×N daily streak bonus
// -5   per DNF

export interface SessionPointsResult {
  points: number
  breakdown: {
    base: number
    pbBonus: number
    consistencyBonus: number
    streakBonus: number
    dnfPenalty: number
  }
  isNewPB: boolean
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

export function computeSessionPoints(
  solves: Solve[],
  previousBestMs: number | null,
  dayStreak: number
): SessionPointsResult {
  const dnfs = solves.filter((s) => s.penalty === 'DNF')
  const finite = solves.filter((s) => isFinite(s.effectiveTime))
  const times = finite.map((s) => s.effectiveTime)

  const base = solves.length * 10
  const dnfPenalty = dnfs.length * 5

  const sessionBest = times.length > 0 ? Math.min(...times) : null
  const isNewPB = sessionBest !== null && (previousBestMs === null || sessionBest < previousBestMs)
  const pbBonus = isNewPB ? 100 : 0

  const mean = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
  const sd = stddev(times)
  const consistencyBonus = mean > 0 && sd / mean < 0.1 && times.length >= 5 ? 50 : 0

  const streakBonus = dayStreak * 5

  const points = Math.max(0, base + pbBonus + consistencyBonus + streakBonus - dnfPenalty)

  return {
    points,
    breakdown: { base, pbBonus, consistencyBonus, streakBonus, dnfPenalty },
    isNewPB,
  }
}

// ─── Hook: award points and sync session to Supabase ─────────────────────────

export interface AwardPointsArgs {
  uid: string
  sessionId: string
  event: WCAEvent
  solves: Solve[]
  ao5: number | null
  ao12: number | null
  mean: number | null
  previousBestMs: number | null
  dayStreak: number
  startedAt: number
}

export function useSessionPoints() {
  const awardPoints = useCallback(async (args: AwardPointsArgs): Promise<SessionPointsResult | null> => {
    if (!isSupabaseConfigured) return null

    const {
      uid, sessionId, event, solves, ao5, ao12, mean,
      previousBestMs, dayStreak, startedAt,
    } = args

    const finite = solves.filter((s) => isFinite(s.effectiveTime))
    const best = finite.length > 0 ? Math.min(...finite.map((s) => s.effectiveTime)) : null

    const result = computeSessionPoints(solves, previousBestMs, dayStreak)

    try {
      // 1. Upsert all solves
      const solveRows = solves.map((s) => ({
        id: s.id,
        firebase_uid: uid,
        session_id: s.sessionId,
        event: s.event,
        time_ms: s.time,
        effective_time_ms: isFinite(s.effectiveTime) ? s.effectiveTime : null,
        penalty: s.penalty,
        scramble: s.scramble,
        inspection_time_ms: s.inspectionTime,
        timestamp: new Date(s.timestamp).toISOString(),
        notes: s.notes,
        tags: s.tags,
      }))

      if (solveRows.length > 0) {
        const { error: solveErr } = await supabase
          .from('solves')
          .upsert(solveRows, { onConflict: 'id' })
        if (solveErr) throw solveErr
      }

      // 2. Upsert session summary
      const { error: sessionErr } = await supabase
        .from('sessions')
        .upsert({
          id: sessionId,
          firebase_uid: uid,
          event,
          solve_count: solves.length,
          mean_ms: mean !== null ? Math.round(mean) : null,
          best_ms: best,
          ao5_ms: ao5,
          ao12_ms: ao12,
          points_earned: result.points,
          started_at: new Date(startedAt).toISOString(),
          ended_at: new Date().toISOString(),
        }, { onConflict: 'id' })
      if (sessionErr) throw sessionErr

      // 3. Update profile totals + streak
      const now = new Date().toISOString()
      const { error: profileErr } = await supabase.rpc('increment_profile_stats', {
        p_uid: uid,
        p_points: result.points,
        p_solve_count: solves.length,
        p_last_solved_at: now,
      })
      // rpc is optional — gracefully skip if not available
      if (profileErr) {
        console.warn('[useSessionPoints] rpc increment failed, falling back', profileErr)
        // Fallback: fetch then update
        const { data: existing } = await supabase
          .from('profiles')
          .select('total_points, solve_count')
          .eq('firebase_uid', uid)
          .maybeSingle()

        await supabase
          .from('profiles')
          .upsert({
            firebase_uid: uid,
            total_points: (existing?.total_points ?? 0) + result.points,
            solve_count: (existing?.solve_count ?? 0) + solves.length,
            last_solved_at: now,
            updated_at: now,
          }, { onConflict: 'firebase_uid' })
      }

      // 4. Check and award achievements
      await checkAchievements(uid, solves, result, previousBestMs, dayStreak)

      return result
    } catch (e) {
      console.warn('[useSessionPoints] award failed', e)
      return null
    }
  }, [])

  return { awardPoints }
}

// ─── Achievement definitions ──────────────────────────────────────────────────

interface AchievementDef {
  type: string
  label: string
  icon: string
  check: (
    solves: Solve[],
    result: SessionPointsResult,
    prevBest: number | null,
    streak: number
  ) => boolean
}

const ACHIEVEMENTS: AchievementDef[] = [
  {
    type: 'first_solve',
    label: 'First Solve',
    icon: '🎉',
    check: (solves) => solves.length >= 1,
  },
  {
    type: 'solves_10',
    label: '10 Solves in a Session',
    icon: '🔟',
    check: (solves) => solves.length >= 10,
  },
  {
    type: 'pb_set',
    label: 'New PB!',
    icon: '🏆',
    check: (_s, result) => result.isNewPB,
  },
  {
    type: 'consistency_king',
    label: 'Consistency King',
    icon: '🎯',
    check: (_s, result) => result.breakdown.consistencyBonus > 0,
  },
  {
    type: 'streak_7',
    label: '7-Day Streak',
    icon: '🔥',
    check: (_s, _r, _p, streak) => streak >= 7,
  },
  {
    type: 'streak_30',
    label: '30-Day Streak',
    icon: '⚡',
    check: (_s, _r, _p, streak) => streak >= 30,
  },
  {
    type: 'sub_10',
    label: 'Sub-10 Club',
    icon: '💎',
    check: (solves) => solves.some((s) => isFinite(s.effectiveTime) && s.effectiveTime < 10000),
  },
  {
    type: 'sub_20',
    label: 'Sub-20',
    icon: '⚡',
    check: (solves) => solves.some((s) => isFinite(s.effectiveTime) && s.effectiveTime < 20000),
  },
]

async function checkAchievements(
  uid: string,
  solves: Solve[],
  result: SessionPointsResult,
  prevBest: number | null,
  streak: number
) {
  if (!isSupabaseConfigured) return

  // Fetch already-earned achievements to avoid duplicates
  const { data: existing } = await supabase
    .from('achievements')
    .select('type')
    .eq('firebase_uid', uid)

  const earnedTypes = new Set((existing ?? []).map((a: { type: string }) => a.type))

  const toInsert = ACHIEVEMENTS
    .filter((a) => !earnedTypes.has(a.type) && a.check(solves, result, prevBest, streak))
    .map((a) => ({
      firebase_uid: uid,
      type: a.type,
      label: a.label,
      icon: a.icon,
      earned_at: new Date().toISOString(),
    }))

  if (toInsert.length > 0) {
    await supabase.from('achievements').insert(toInsert)
  }
}
