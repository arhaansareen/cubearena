// WCA events
export type WCAEvent =
  | '333'
  | '222'
  | '444'
  | '555'
  | '666'
  | '777'
  | '333bf'
  | '333oh'
  | '333fm'
  | 'clock'
  | 'minx'
  | 'pyram'
  | 'skewb'
  | 'sq1'
  | '444bf'
  | '555bf'

// Penalty
export type Penalty = null | '+2' | 'DNF'

// Timer phase
// 'manual_entry' is reached after inspection completes in manual mode:
// inspection runs identically, then instead of starting the solve clock
// the UI shows a text field for the user to type the actual time.
export type TimerPhase = 'idle' | 'inspection' | 'armed' | 'solving' | 'stopped' | 'manual_entry'

// A single solve result
export interface Solve {
  id: string
  sessionId: string
  event: WCAEvent
  time: number // milliseconds, raw
  penalty: Penalty
  effectiveTime: number // computed: time + 2000 if +2, Infinity if DNF
  scramble: string
  inspectionTime: number // ms used in inspection
  timestamp: number // epoch ms
  notes: string | null
  tags: string[]
}

// Session = one training block
export interface Session {
  id: string
  userId: string
  event: WCAEvent
  startedAt: number
  endedAt: number | null
  solves: Solve[]
  ao5: number | null
  ao12: number | null
  mean: number | null
  notes: string | null
}

// AI Opponent
export interface AIOpponent {
  id: string
  name: string
  wcaId: string | null
  avatarColor: string
  targetMean: number // ms, e.g. 8500 for 8.5s
  sigma: number // std dev for randomness, e.g. 800
  currentTime: number | null // live during a solve
  isFinished: boolean
}

// Rival
export interface Rival {
  id: string
  wcaId: string
  name: string
  addedAt: number
  lastSyncedAt: number | null
  stats: {
    event: WCAEvent
    single: number | null
    ao5: number | null
    ao12: number | null
    ao100: number | null
  }[]
}

// User profile -- persisted to Firestore under profiles/{uid}
export interface UserProfile {
  displayName: string
  wcaId: string | null
  updatedAt: number
}

// Planned practice session (stored in localStorage / Firestore)
export interface PlannedSession {
  id: string
  scheduledAt: number       // epoch ms (date + time combined)
  durationMins: number      // 30 | 45 | 60 | 90 | 120
  event: WCAEvent
  goal: string | null       // free text, e.g. "focus on F2L" or "sub-12 ao5"
  targetTime: number | null // ms — optional time goal
  completedAt: number | null // epoch ms when marked done, null if pending
}

// Lightweight daily activity record (written by SessionPage)
export interface DayActivity {
  date: string              // 'YYYY-MM-DD'
  solveCount: number
  ao5: number | null
  mean: number | null
  events: WCAEvent[]
}

// Notes behavior setting
export type NotesBehavior = 'off' | 'soft' | 'required'

// User settings
export interface UserSettings {
  defaultEvent: WCAEvent
  notesBehavior: NotesBehavior
  crowdNoiseVolume: number // 0-1
  inspectionCallouts: boolean
  aiOpponents: boolean
  aiDifficulty: 'easy' | 'medium' | 'hard' | 'custom'
  customAiMean: number // ms
  clutchModeEnabled: boolean
  wcaId: string | null
}
