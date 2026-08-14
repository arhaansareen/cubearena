import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { generateScramble } from '@/lib/scramble'
import type { WCAEvent } from '@/types'

export type RacePhase = 'lobby' | 'solving' | 'results'
export type RaceFormat = 'solo' | 'bo3' | 'bo5' | 'mo3' | 'ao5'

export interface RoundTime { time: number; penalty: string | null }

export interface RaceParticipant {
  id: string
  uid: string
  displayName: string
  isReady: boolean
  solveTime: number | null
  penalty: string | null
  finishedAt: string | null
  roundTimes: RoundTime[]
  joinedAt: string
}

export interface RaceRoom {
  id: string
  code: string
  hostUid: string
  event: WCAEvent
  format: RaceFormat
  scramble: string | null
  phase: RacePhase
  currentRound: number
  totalRounds: number
  solveStartAt: number | null  // ms epoch — when timer unlocks
  startedAt: string | null
}

export type RaceState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'in_room'; room: RaceRoom; participants: RaceParticipant[]; myUid: string }

// ─── Format helpers ──────────────────────────────────────────────────────────

export const FORMAT_ROUNDS: Record<RaceFormat, number> = {
  solo: 1, bo3: 3, bo5: 5, mo3: 3, ao5: 5,
}

export function computeFinalResult(format: RaceFormat, times: RoundTime[]): number {
  if (times.length === 0) return Infinity
  const effective = times.map(t => t.penalty === 'DNF' ? Infinity : t.penalty === '+2' ? t.time + 2000 : t.time)
  if (format === 'solo') return effective[0] ?? Infinity
  if (format === 'bo3' || format === 'bo5') return Math.min(...effective)
  if (format === 'mo3') {
    const sum = effective.reduce((a, b) => a + b, 0)
    return sum / effective.length
  }
  if (format === 'ao5') {
    if (effective.length < 5) return Infinity
    const sorted = [...effective].sort((a, b) => a - b)
    const middle = sorted.slice(1, 4)
    const sum = middle.reduce((a, b) => a + b, 0)
    return sum / 3
  }
  return Infinity
}

// ─── Row parsers ─────────────────────────────────────────────────────────────

function randomCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function rowToRoom(row: Record<string, unknown>): RaceRoom {
  const solveStartAtStr = row.solve_start_at as string | null
  return {
    id: row.id as string,
    code: row.code as string,
    hostUid: row.host_uid as string,
    event: (row.event as WCAEvent) ?? '333',
    format: (row.format as RaceFormat) ?? 'solo',
    scramble: (row.scramble as string) ?? null,
    phase: (row.phase as RacePhase) ?? 'lobby',
    currentRound: (row.current_round as number) ?? 1,
    totalRounds: (row.total_rounds as number) ?? 1,
    solveStartAt: solveStartAtStr ? new Date(solveStartAtStr).getTime() : null,
    startedAt: (row.started_at as string) ?? null,
  }
}

function rowToParticipant(row: Record<string, unknown>): RaceParticipant {
  return {
    id: row.id as string,
    uid: row.uid as string,
    displayName: row.display_name as string,
    isReady: (row.is_ready as boolean) ?? false,
    solveTime: (row.solve_time as number) ?? null,
    penalty: (row.penalty as string) ?? null,
    finishedAt: (row.finished_at as string) ?? null,
    roundTimes: (row.round_times as RoundTime[]) ?? [],
    joinedAt: row.joined_at as string,
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useRaceRoom(myUid: string | null, myDisplayName: string) {
  const [state, setState] = useState<RaceState>({ status: 'idle' })
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const roomIdRef = useRef<string | null>(null)

  const setError = (msg: string) => setState({ status: 'error', message: msg })

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      void supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    roomIdRef.current = null
  }, [])

  const subscribeToRoom = useCallback((roomId: string, initialRoom: RaceRoom, initialParticipants: RaceParticipant[]) => {
    roomIdRef.current = roomId
    let currentRoom = initialRoom
    let currentParticipants = initialParticipants
    setState({ status: 'in_room', room: currentRoom, participants: currentParticipants, myUid: myUid! })

    const channel = supabase
      .channel(`race:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'race_rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') { cleanup(); setState({ status: 'idle' }); return }
          currentRoom = rowToRoom(payload.new as Record<string, unknown>)
          setState({ status: 'in_room', room: currentRoom, participants: currentParticipants, myUid: myUid! })
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'race_participants', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            currentParticipants = [...currentParticipants, rowToParticipant(payload.new as Record<string, unknown>)]
          } else if (payload.eventType === 'UPDATE') {
            const p = rowToParticipant(payload.new as Record<string, unknown>)
            currentParticipants = currentParticipants.map(x => x.id === p.id ? p : x)
          } else if (payload.eventType === 'DELETE') {
            currentParticipants = currentParticipants.filter(x => x.id !== (payload.old as Record<string, unknown>).id)
          }
          setState({ status: 'in_room', room: currentRoom, participants: currentParticipants, myUid: myUid! })

          // Host advances round when every participant has finished
          if (
            myUid === currentRoom.hostUid &&
            currentRoom.phase === 'solving' &&
            currentParticipants.length > 0 &&
            currentParticipants.every(p => p.finishedAt !== null)
          ) {
            const nextRound = currentRoom.currentRound + 1
            if (nextRound <= currentRoom.totalRounds) {
              const scramble = generateScramble(currentRoom.event)
              const solveStartAt = new Date(Date.now() + 4000).toISOString()
              await supabase.from('race_rooms').update({
                phase: 'solving', scramble, solve_start_at: solveStartAt,
                current_round: nextRound, started_at: new Date().toISOString(),
              }).eq('id', roomId)
              await supabase.from('race_participants')
                .update({ solve_time: null, penalty: null, finished_at: null, is_ready: false })
                .eq('room_id', roomId)
            } else {
              await supabase.from('race_rooms').update({ phase: 'results' }).eq('id', roomId)
            }
          }
        }
      )
      .subscribe()

    channelRef.current = channel
  }, [myUid, cleanup])

  const createRoom = useCallback(async (event: WCAEvent, format: RaceFormat = 'solo') => {
    if (!isSupabaseConfigured || !myUid) return setError('Not connected')
    setState({ status: 'loading' })
    const totalRounds = FORMAT_ROUNDS[format]
    const code = randomCode()
    const { data: room, error: roomErr } = await supabase
      .from('race_rooms')
      .insert({ code, host_uid: myUid, event, format, phase: 'lobby', current_round: 1, total_rounds: totalRounds })
      .select().single()
    if (roomErr || !room) return setError(roomErr?.message ?? 'Failed to create room')

    const { data: participant, error: pErr } = await supabase
      .from('race_participants')
      .insert({ room_id: room.id, uid: myUid, display_name: myDisplayName || 'Anonymous', is_ready: false, round_times: [] })
      .select().single()
    if (pErr || !participant) return setError(pErr?.message ?? 'Failed to join room')

    subscribeToRoom(room.id, rowToRoom(room as Record<string, unknown>), [rowToParticipant(participant as Record<string, unknown>)])
  }, [myUid, myDisplayName, subscribeToRoom])

  const joinRoom = useCallback(async (code: string) => {
    if (!isSupabaseConfigured || !myUid) return setError('Not connected')
    setState({ status: 'loading' })
    const { data: room, error: roomErr } = await supabase
      .from('race_rooms').select('*').eq('code', code.trim().toUpperCase()).single()
    if (roomErr || !room) return setError('Room not found — check the code and try again')
    if ((room as Record<string, unknown>).phase !== 'lobby') return setError('Race already in progress')

    const { data: existing } = await supabase
      .from('race_participants').select('id')
      .eq('room_id', (room as Record<string, unknown>).id).eq('uid', myUid).maybeSingle()
    if (!existing) {
      const { data: p, error: pErr } = await supabase
        .from('race_participants')
        .insert({ room_id: (room as Record<string, unknown>).id, uid: myUid, display_name: myDisplayName || 'Anonymous', is_ready: false, round_times: [] })
        .select().single()
      if (pErr || !p) return setError(pErr?.message ?? 'Failed to join room')
    }

    const { data: allParticipants } = await supabase
      .from('race_participants').select('*').eq('room_id', (room as Record<string, unknown>).id)

    subscribeToRoom(
      (room as Record<string, unknown>).id as string,
      rowToRoom(room as Record<string, unknown>),
      ((allParticipants ?? []) as Record<string, unknown>[]).map(rowToParticipant)
    )
  }, [myUid, myDisplayName, subscribeToRoom])

  const setReady = useCallback(async (ready: boolean) => {
    if (!myUid || !roomIdRef.current) return
    await supabase.from('race_participants').update({ is_ready: ready })
      .eq('room_id', roomIdRef.current).eq('uid', myUid)
  }, [myUid])

  // solveStartAt = 4 seconds from now (countdown)
  const startRound = useCallback(async (event: WCAEvent, round: number) => {
    if (!roomIdRef.current) return
    const scramble = generateScramble(event)
    const solveStartAt = new Date(Date.now() + 4000).toISOString()
    await supabase.from('race_rooms').update({
      phase: 'solving', scramble,
      solve_start_at: solveStartAt,
      current_round: round,
      started_at: new Date().toISOString(),
    }).eq('id', roomIdRef.current)
    // reset per-round solve data (keep round_times)
    await supabase.from('race_participants')
      .update({ solve_time: null, penalty: null, finished_at: null, is_ready: false })
      .eq('room_id', roomIdRef.current)
  }, [])

  const startRace = useCallback(async (event: WCAEvent) => {
    await startRound(event, 1)
  }, [startRound])

  const submitSolve = useCallback(async (rawTime: number, penalty: string | null) => {
    if (!myUid || !roomIdRef.current || state.status !== 'in_room') return
    const { participants } = state
    const me = participants.find(p => p.uid === myUid)
    if (!me) return

    const effective = penalty === 'DNF' ? null : penalty === '+2' ? rawTime + 2000 : rawTime
    const newEntry: RoundTime = { time: rawTime, penalty }
    const newRoundTimes = [...me.roundTimes, newEntry]

    await supabase.from('race_participants')
      .update({ solve_time: effective, penalty, finished_at: new Date().toISOString(), round_times: newRoundTimes })
      .eq('room_id', roomIdRef.current).eq('uid', myUid)
    // Advance logic is handled in the realtime participant handler
  }, [myUid, state])

  const nextRound = useCallback(async (_event: WCAEvent) => {
    if (!roomIdRef.current || state.status !== 'in_room') return
    // full reset for a new match
    await supabase.from('race_participants')
      .update({ round_times: [], solve_time: null, penalty: null, finished_at: null, is_ready: false })
      .eq('room_id', roomIdRef.current)
    await supabase.from('race_rooms')
      .update({ phase: 'lobby', current_round: 1, scramble: null, solve_start_at: null })
      .eq('id', roomIdRef.current)
  }, [state])

  const leaveRoom = useCallback(async () => {
    if (!myUid || !roomIdRef.current) return
    const roomId = roomIdRef.current
    cleanup()
    setState({ status: 'idle' })
    await supabase.from('race_participants').delete().eq('room_id', roomId).eq('uid', myUid)
    const { data: remaining } = await supabase.from('race_participants').select('id').eq('room_id', roomId)
    if (!remaining || remaining.length === 0) {
      await supabase.from('race_rooms').delete().eq('id', roomId)
    }
  }, [myUid, cleanup])

  useEffect(() => () => { cleanup() }, [cleanup])

  return { state, createRoom, joinRoom, setReady, startRace, submitSolve, nextRound, leaveRoom }
}
