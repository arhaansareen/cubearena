import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const

const missingVars = requiredVars.filter(
  (key) => !import.meta.env[key] || import.meta.env[key].startsWith('your_')
)

if (missingVars.length > 0) {
  console.warn(
    '[CubeArena] Firebase environment variables are not configured. ' +
      'Copy .env.local and fill in your Firebase project credentials. ' +
      'Missing or placeholder values: ' +
      missingVars.join(', ')
  )
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
}

let app: FirebaseApp
let auth: Auth
let db: Firestore

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  auth = getAuth(app)
  db = getFirestore(app)
} catch (err) {
  console.warn('[CubeArena] Firebase initialization failed. Running in offline mode.', err)
  // Provide stub exports so the rest of the app can import without crashing
  app = {} as FirebaseApp
  auth = {} as Auth
  db = {} as Firestore
}

export { app, auth, db }
