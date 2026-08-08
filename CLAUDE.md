# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # dev server on :5173
npm run build        # tsc + vite build (outputs to dist/)
npm run lint         # eslint strict, max-warnings 0
npx tsc --noEmit     # type-check only, no emit
npx vercel --prod    # deploy to production (or: git push origin main)
```

No test suite exists. Type-check with `npx tsc --noEmit` before committing.

## Stack

React 18 + Vite 5 + TypeScript strict. No Tailwind — all styling is **inline styles** using CSS variables. Framer Motion v11 (`framer-motion`, which also exports `motion/react` as an alias). React Router v6. Firebase v10. Deployed on Vercel; GitHub push to `main` auto-deploys.

Path alias: `@/` → `src/`. All three esbuild targets set to `es2022` (required by the `cubing` package's top-level await).

## CSS Variables (globals.css)

All components use these tokens — never hardcode colors:

```
--bg, --surface-0, --surface-1, --border
--text-primary, --text-muted
--accent (#22D3EE), --accent-dim
--timer-idle, --timer-active, --inspection, --penalty, --positive
```

Font families: `'Inter'` for UI text, `'JetBrains Mono'` for times/scrambles (class `font-mono`).

## Architecture

### Data flow

```
Firebase (Firestore)
  └─ useSolveHistory(uid)   — real-time listener, users/{uid}/solves
  └─ ProfileProvider        — users/{uid}/profile

localStorage
  └─ useSession             — key: cubearena:session-v1 (current session solves + id)
  └─ useCalendar            — keys: cubearena:plans, cubearena:activity

Component state
  └─ useTimer               — timer phase machine (idle→armed→inspection→solving→stopped)
  └─ useScramble(event)     — synchronous, instant, returns { scramble, next }
```

### Timer state machine (`useTimer`)

Phases: `idle → armed → inspection → armed → solving → stopped → idle`  
Hold threshold: 300ms. Inspection limit: 15s (+2 at 15s, DNF at 17s).  
Two modes: `'live'` (starts solve clock on release) and `'manual'` (enters `manual_entry` phase for typed input).  
Keyboard: space. Touch: any single touch on `window`. Both handled in `useTimer` directly — no component-level listeners needed.

### Session page composition (`SessionPage.tsx`)

Orchestrates all hooks and passes props down. Key refs: `currentScrambleRef` (captures scramble at solve-complete time), `solveStartTimeRef` (for AI opponent timing). Ambient audio starts on `inspection`, stops on `idle/stopped/manual_entry`.

### Scramble generation (`src/lib/scramble.ts`)

Pure synchronous JS — no WASM, no workers. Event-specific generators: axis-aware move sequences for NxN cubes, WCA-format Megaminx rows, Pyraminx with tip moves, Clock with pin notation, Square-1 `(top,bottom)/` format. `generateScramble(event)` is the only public export.

### Firebase (`src/lib/firebase.ts`)

Graceful-degrades: if env vars are missing, exports stub objects so the rest of the app runs offline. All Firebase imports in hooks use dynamic `import()` to avoid crashing when unconfigured.

Required env vars (`.env.local`, also set in Vercel dashboard):
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Auth: anonymous sign-in only (`signInAnonymously`). `AuthProvider` wraps the whole app and always resolves to a uid — Firestore writes are keyed on that uid.

### Persistence layers

| Data | Where | Key/Path |
|------|-------|----------|
| Current session solves | localStorage | `cubearena:session-v1` |
| All historical solves | Firestore | `users/{uid}/solves/{solveId}` |
| User profile | Firestore | `users/{uid}/profile` |
| Planned sessions | localStorage | `cubearena:plans` |
| Daily activity | localStorage | `cubearena:activity` |

### UI component conventions

- No Tailwind. All styles are inline objects.
- `framer-motion` for all animation — `AnimatePresence` + `motion.*` components.
- kokonutui (MIT) patterns are adapted to inline styles + CubeArena tokens. Components pulled: `EventTabs` (sliding tab indicator), `SpotlightStatCell` (3D tilt + cursor glow), `HoldDeleteButton` (fill-bar hold-to-confirm).
- `AppShell` provides desktop sidebar (240px fixed) + mobile bottom nav. Content area has `marginLeft: 240` on desktop, collapsed on mobile via CSS media queries embedded in the component.
