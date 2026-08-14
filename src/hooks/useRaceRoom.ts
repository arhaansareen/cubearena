import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { generateScramble } from '@/lib/scramble'
import type { WCAEvent } from '@/types'

export type RacePhase = 'lobby' | 'solving' | 'results'

export interface RaceParticipant {
  id: string
  uid: string
  displayName: string
  isReady: boolean
  solveTime: number | null
  penalty: string | null
  finishedAt: string | null
  joinedAt: string
}

export type RaceFormat = 'solo' | 'bo3' | 'bo5' | 'mo3' | 'ao5'

export interface RaceRoom {
  id: string
  code: string
  hostUid: string
  event: WCAEvent
  format: RaceFormat
  scramble: string | null
  phase: RacePhase
  startedAt: string | null
}

export type RaceState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'in_room'; room: RaceRoom; participants: RaceParticipant[]; myUid: string }

function randomCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function rowToRoom(row: Record<string, unknown>): RaceRoom {
  return {
    id: row.id as string,
    code: row.code as string,
    hostUid: row.host_uid as string,
    event: (row.event as WCAEvent) ?? '333',
    format: (row.format as RaceFormat) ?? 'solo',
    scramble: (row.scramble as string) ?? null,
    phase: (row.phase as RacePhase) ?? 'lobby',
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
    joinedAt: row.joined_at as string,
  }
}

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
          if (payload.eventType === 'DELETE') {
            cleanup()
            setState({ status: 'idle' })
            return
          }
          currentRoom = rowToRoom(payload.new as Record<string, unknown>)
          setState({ status: 'in_room', room: currentRoom, participants: currentParticipants, myUid: myUid! })
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'race_participants', filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const p = rowToParticipant(payload.new as Record<string, unknown>)
            currentParticipants = [...currentParticipants, p]
          } else if (payload.eventType === 'UPDATE') {
            const p = rowToParticipant(payload.new as Record<string, unknown>)
            currentParticipants = currentParticipants.map((x) => x.id === p.id ? p : x)
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as Record<string, unknown>
            currentParticipants = currentParticipants.filter((x) => x.id !== deleted.id)
          }
          setState({ status: 'in_room', room: currentRoom, participants: currentParticipants, myUid: myUid! })
        }
      )
      .subscribe()

    channelRef.current = channel
  }, [myUid, cleanup])

  const createRoom = useCallback(async (event: WCAEvent, format: RaceFormat = 'solo') => {
    if (!isSupabaseConfigured || !myUid) return setError('Not connected')
    setState({ status: 'loading' })

    const code = randomCode()
    const { data: room, error: roomErr } = await supabase
      .from('race_rooms')
      .insert({ code, host_uid: myUid, event, format, phase: 'lobby' })
      .select()
      .single()

    if (roomErr || !room) return setError(roomErr?.message ?? 'Failed to create room')

    const { data: participant, error: pErr } = await supabase
      .from('race_participants')
      .insert({ room_id: room.id, uid: myUid, display_name: myDisplayName || 'Anonymous', is_ready: false })
      .select()
      .single()

    if (pErr || !participant) return setError(pErr?.message ?? 'Failed to join room')

    subscribeToRoom(room.id, rowToRoom(room as Record<string, unknown>), [rowToParticipant(participant as Record<string, unknown>)])
  }, [myUid, myDisplayName, subscribeToRoom])

  const joinRoom = useCallback(async (code: string) => {
    if (!isSupabaseConfigured || !myUid) return setError('Not connected')
    setState({ status: 'loading' })

    const { data: room, error: roomErr } = await supabase
      .from('race_rooms')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .single()

    if (roomErr || !room) return setError('Room not found — check the code and try again')
    if ((room as Record<string, unknown>).phase !== 'lobby') return setError('Race already in progress')

    const { data: existing } = await supabase
      .from('race_participants')
      .select('id')
      .eq('room_id', (room as Record<string, unknown>).id)
      .eq('uid', myUid)
      .maybeSingle()

    if (!existing) {
      const { data: p, error: pErr } = await supabase
        .from('race_participants')
        .insert({ room_id: (room as Record<string, unknown>).id, uid: myUid, display_name: myDisplayName || 'Anonymous', is_ready: false })
        .select()
        .single()
      if (pErr || !p) return setError(pErr?.message ?? 'Failed to join room')
    }

    const { data: allParticipants } = await supabase
      .from('race_participants')
      .select('*')
      .eq('room_id', (room as Record<string, unknown>).id)

    subscribeToRoom(
      (room as Record<string, unknown>).id as string,
      rowToRoom(room as Record<string, unknown>),
      ((allParticipants ?? []) as Record<string, unknown>[]).map(rowToParticipant)
    )
  }, [myUid, myDisplayName, subscribeToRoom])

  const setReady = useCallback(async (ready: boolean) => {
    if (!myUid || !roomIdRef.current) return
    await supabase
      .from('race_participants')
      .update({ is_ready: ready })
      .eq('room_id', roomIdRef.current)
      .eq('uid', myUid)
  }, [myUid])

  const startRace = useCallback(async (event: WCAEvent) => {
    if (!roomIdRef.current) return
    const scramble = generateScramble(event)
    await supabase
      .from('race_rooms')
      .update({ phase: 'solving', scramble, started_at: new Date().toISOString() })
      .eq('id', roomIdRef.current)
    // reset all participant solve data for a fresh round
    await supabase
      .from('race_participants')
      .update({ solve_time: null, penalty: null, finished_at: null, is_ready: false })
      .eq('room_id', roomIdRef.current)
  }, [])

  const submitSolve = useCallback(async (solveTime: number, penalty: string | null) => {
    if (!myUid || !roomIdRef.current) return
    const effective = penalty === 'DNF' ? null : penalty === '+2' ? solveTime + 2000 : solveTime
    await supabase
      .from('race_participants')
      .update({ solve_time: effective, penalty, finished_at: new Date().toISOString() })
      .eq('room_id', roomIdRef.current)
      .eq('uid', myUid)
  }, [myUid])

  const finishRound = useCallback(async () => {
    if (!roomIdRef.current) return
    await supabase
      .from('race_rooms')
      .update({ phase: 'results' })
      .eq('id', roomIdRef.current)
  }, [])

  const nextRound = useCallback(async (event: WCAEvent) => {
    await startRace(event)
  }, [startRace])

  const leaveRoom = useCallback(async () => {
    if (!myUid || !roomIdRef.current) return
    const roomId = roomIdRef.current
    cleanup()
    setState({ status: 'idle' })
    await supabase
      .from('race_participants')
      .delete()
      .eq('room_id', roomId)
      .eq('uid', myUid)
    // if host leaves, delete the whole room
    const { data: remaining } = await supabase
      .from('race_participants')
      .select('id')
      .eq('room_id', roomId)
    if (!remaining || remaining.length === 0) {
      await supabase.from('race_rooms').delete().eq('id', roomId)
    }
  }, [myUid, cleanup])

  // auto-transition to results when everyone finishes
  useEffect(() => {
    if (state.status !== 'in_room') return
    const { room, participants, myUid: uid } = state
    if (room.phase !== 'solving') return
    const amHost = room.hostUid === uid
    if (!amHost) return
    const allDone = participants.length >= 2 && participants.every((p) => p.finishedAt !== null)
    if (allDone) void finishRound()
  }, [state, finishRound])

  useEffect(() => () => { cleanup() }, [cleanup])

  return { state, createRoom, joinRoom, setReady, startRace, submitSolve, nextRound, leaveRoom }
}
