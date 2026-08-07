# CubeArena

A WCA-accurate competition training simulator for speedcubers. Built for people who want to practice like they compete.

![CubeArena](https://img.shields.io/badge/status-beta-22D3EE?style=flat-square) ![License](https://img.shields.io/badge/license-MIT-22C55E?style=flat-square)

## Features

- **WCA-accurate timer** — inspection with 8s/12s audio callouts, +2 and DNF auto-penalties at 15s/17s
- **Manual entry mode** — type your time after inspection for external stackmat compatibility
- **TNoodle-style scrambles** — event-specific scrambles for all 17 WCA events
- **AI opponents** — compete against simulated solvers with configurable difficulty
- **Crowd noise** — ambient audio that ramps up pressure during solves
- **Solve history** — every solve synced to Firestore, export to CSV
- **Training calendar** — schedule sessions, set goals, track consistency over 12 weeks
- **Rival tracking** — look up any WCA ID and compare stats
- **Post-solve notes** — tag solves and add notes (off / soft prompt / required)
- **Session stats** — live ao5, ao12, mean during a session

## Stack

- React 18 + Vite 5 + TypeScript
- Firebase (Firestore + Anonymous Auth)
- Framer Motion
- Web Audio API (no audio libraries)

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with Firestore and Anonymous Authentication enabled

### Setup

```bash
git clone https://github.com/yourusername/cubearena.git
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
```

```bash
npm run dev
```

### Firebase setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Firestore** (start in test mode)
3. Enable **Anonymous Authentication**
4. Copy your web app config into `.env.local`

## Deployment

Deployed on Vercel. Environment variables are set in the Vercel dashboard under Project Settings → Environment Variables.

## Roadmap

- [ ] Google/Apple sign-in for cross-device sync
- [ ] Clutch mode (hidden timer, pressure training)
- [ ] Session sharing and replay
- [ ] Personal records page with progression charts
- [ ] Mobile app (PWA)

## License

MIT
