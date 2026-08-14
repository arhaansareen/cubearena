# CubeArena

A training platform for serious cubers who want feedback loops, not just a stopwatch.

![CubeArena](https://img.shields.io/badge/status-beta-22D3EE?style=flat-square) ![License](https://img.shields.io/badge/license-MIT-22C55E?style=flat-square)

## Features

- **WCA-legal timer** — inspection with 8s/12s audio callouts, auto +2 and DNF at 15s/17s
- **Post-solve notes** — write what clicked and what broke down after every solve
- **Full solve history** — penalty editing, delete, synced to the cloud
- **Session stats** — live ao5, ao12, mean, PBs and streaks across all events
- **Official WCA PRs** — auto-synced from the WCA database by WCA ID
- **Algorithm trainer** — OLL/PLL/F2L with live cube visualizations
- **Competition simulator** — crowd noise and pressure that ramps up as you solve
- **AI opponents** — race against simulated solvers with configurable difficulty
- **Live multiplayer races** — score-based 1v1 (Race to 3/5/7), real-time via Supabase
- **Training calendar** — schedule sessions with event targets and daily goals
- **Manual entry mode** — type your time for stackmat compatibility

## Stack

- React 18 + Vite 5 + TypeScript
- Firebase (Firestore + Anonymous Auth)
- Supabase (multiplayer real-time)
- Framer Motion
- Web Audio API

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with Firestore and Anonymous Authentication enabled
- A Supabase project (for multiplayer)

### Setup

```bash
git clone https://github.com/arhaansareen/cubearena.git
cd cubearena
npm install
```

Create `.env.local`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

```bash
npm run dev
```

## Deployment

Deployed on Vercel. Push to `main` auto-deploys. Environment variables are set in the Vercel dashboard.

## Roadmap

- [ ] Google/Apple sign-in for cross-device sync
- [ ] Clutch mode (hidden timer, pressure training)
- [ ] Personal records page with progression charts
- [ ] Mobile app (PWA)
- [ ] Session sharing and replay

## License

MIT
