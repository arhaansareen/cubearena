import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/providers/AuthProvider'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

export function LoginPage() {
  const { signInWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogle = () => {
    setLoading(true)
    setError(null)
    // Must call signInWithGoogle synchronously inside the click handler
    // so the browser doesn't treat the popup as unsolicited
    signInWithGoogle().catch((err: any) => {
      setError(err?.code ?? err?.message ?? 'Sign-in failed')
      setLoading(false)
    })
  }

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          maxWidth: 380,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0,
        }}
      >
        {/* Cube logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: 24 }}
        >
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
            <path d="M28 10L46 19.5L28 29L10 19.5Z" fill="#22D3EE" opacity="0.95"/>
            <path d="M10 19.5L28 29L28 48L10 38.5Z" fill="#0891B2"/>
            <path d="M46 19.5L28 29L28 48L46 38.5Z" fill="#0E7490"/>
          </svg>
        </motion.div>

        {/* Title */}
        <h1 style={{
          fontSize: 32,
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.03em',
          marginBottom: 8,
          textAlign: 'center',
        }}>
          CubeArena
        </h1>
        <p style={{
          fontSize: 14,
          color: 'var(--text-muted)',
          textAlign: 'center',
          marginBottom: 40,
          lineHeight: 1.5,
        }}>
          Competition training for speedcubers.
          <br />Sign in to sync your solves across devices.
        </p>

        {/* Google button */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '13px 20px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            backgroundColor: loading ? 'var(--surface-1)' : 'var(--surface-0)',
            color: 'var(--text-primary)',
            fontSize: 15,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'background-color 150ms ease, border-color 150ms ease',
            boxShadow: 'var(--shadow-soft)',
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
          }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
          onMouseDown={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)' }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          <GoogleIcon />
          {loading ? 'Redirecting to Google…' : 'Continue with Google'}
        </button>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: 12, fontSize: 13, color: 'var(--penalty)', textAlign: 'center' }}
          >
            {error}
          </motion.p>
        )}

        {/* WCA note */}
        <div style={{
          marginTop: 32,
          padding: '14px 18px',
          backgroundColor: 'var(--surface-0)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          width: '100%',
        }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
            After signing in, go to <strong style={{ color: 'var(--text-primary)' }}>Settings</strong> to
            connect your WCA ID — your official PBs will appear on your dashboard automatically.
          </p>
        </div>

        <p style={{ marginTop: 24, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', opacity: 0.6 }}>
          Your solve data is private and only accessible to you.
        </p>
      </motion.div>
    </div>
  )
}
