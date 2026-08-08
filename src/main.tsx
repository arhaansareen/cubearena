import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './styles/globals.css'

// Pre-warm the cubing WASM worker so the first scramble on the session page is fast
import('@/lib/scramble').then(({ generateScramble }) => generateScramble('333')).catch(() => {})

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error(
    'Root element with id "root" not found. Check your index.html.'
  )
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
