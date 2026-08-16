import { useState } from 'react'
import { motion } from 'framer-motion'
import type { WCAEvent, NotesBehavior, UserSettings } from '@/types'
import { useProfile } from '@/providers/ProfileProvider'
import { useWCAData } from '@/hooks/useWCAData'
import { useAuth } from '@/providers/AuthProvider'
import { useTheme, ACCENTS, type AccentKey } from '@/providers/ThemeProvider'

const WCA_EVENTS: { value: WCAEvent; label: string }[] = [
  { value: '333', label: '3x3' },
  { value: '222', label: '2x2' },
  { value: '444', label: '4x4' },
  { value: '555', label: '5x5' },
  { value: '666', label: '6x6' },
  { value: '777', label: '7x7' },
  { value: '333bf', label: '3BLD' },
  { value: '333oh', label: '3OH' },
  { value: '333fm', label: 'FMC' },
  { value: 'clock', label: 'Clock' },
  { value: 'minx', label: 'Megaminx' },
  { value: 'pyram', label: 'Pyraminx' },
  { value: 'skewb', label: 'Skewb' },
  { value: 'sq1', label: 'Square-1' },
  { value: '444bf', label: '4BLD' },
  { value: '555bf', label: '5BLD' },
]

const DEFAULT_SETTINGS: UserSettings = {
  defaultEvent: '333',
  notesBehavior: 'soft',
  crowdNoiseVolume: 0.5,
  inspectionCallouts: true,
  aiOpponents: false,
  aiDifficulty: 'medium',
  customAiMean: 10000,
  clutchModeEnabled: false,
  wcaId: null,
}

interface SectionProps {
  title: string
  description?: string
  children: React.ReactNode
}

function Section({ title, description, children }: SectionProps) {
  return (
    <section
      style={{
        background: 'var(--surface-0)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 24,
        marginBottom: 16,
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <h2 style={{
          fontSize: 14, fontWeight: 700, color: 'var(--text-primary)',
          borderLeft: '3px solid var(--accent)',
          paddingLeft: 10,
          margin: 0,
        }}>{title}</h2>
        {description && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, marginLeft: 13 }}>{description}</p>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
    </section>
  )
}

interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
}

function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        cursor: 'pointer',
      }}
      onClick={() => onChange(!checked)}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
        {description && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>
        )}
      </div>
      {/* Animated pill toggle */}
      <div
        role="switch"
        aria-checked={checked}
        style={{
          width: 40,
          height: 22,
          borderRadius: 11,
          backgroundColor: checked ? 'var(--accent)' : 'var(--surface-1)',
          border: `1px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
          position: 'relative',
          flexShrink: 0,
          transition: 'background-color 200ms ease, border-color 200ms ease',
          cursor: 'pointer',
        }}
      >
        <motion.div
          animate={{ x: checked ? 18 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{
            position: 'absolute',
            width: 18,
            height: 18,
            borderRadius: '50%',
            backgroundColor: '#fff',
            top: '50%',
            left: 1,
            y: '-50%',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}
        />
      </div>
    </div>
  )
}

export function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const { mode, accent, customColor, setMode, setAccent, setCustomColor } = useTheme()
  const { profile, save: saveProfile, isSaving } = useProfile()
  const { state: wcaVerifyState, lookup: wcaLookup, reset: wcaReset } = useWCAData()
  const { user, signOut } = useAuth()

  const [displayNameInput, setDisplayNameInput] = useState(profile?.displayName ?? '')
  const [wcaIdInput, setWcaIdInput] = useState(profile?.wcaId ?? '')
  const [savedIndicator, setSavedIndicator] = useState(false)
  const [importingWca, setImportingWca] = useState(false)
  const [importToast, setImportToast] = useState<'success' | 'error' | null>(null)

  // Sync inputs if profile loads after mount
  const prevProfileRef = useState<string | null>(null)
  if (profile && prevProfileRef[0] !== profile.displayName) {
    prevProfileRef[1](profile.displayName)
    setDisplayNameInput(profile.displayName)
    setWcaIdInput(profile.wcaId ?? '')
  }

  const update = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSaveProfile = async () => {
    await saveProfile({
      displayName: displayNameInput.trim(),
      wcaId: wcaIdInput.trim().toUpperCase() || null,
    })
    setSavedIndicator(true)
    setTimeout(() => setSavedIndicator(false), 2000)
  }

  const handleVerifyWcaId = () => {
    const id = wcaIdInput.trim()
    if (!id) return
    wcaReset()
    wcaLookup(id)
  }

  // Reset verify state when input changes
  const handleWcaIdChange = (val: string) => {
    setWcaIdInput(val.toUpperCase())
    if (wcaVerifyState.status !== 'idle') {
      wcaReset()
    }
  }

  const handleImportFromWCA = async () => {
    const id = wcaIdInput.trim()
    if (!id) return
    setImportingWca(true)
    setImportToast(null)
    try {
      const res = await fetch(`https://www.worldcubeassociation.org/api/v0/persons/${encodeURIComponent(id)}`, {
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) throw new Error(`${res.status}`)
      const json = await res.json()
      const wcaName: string = json.person?.name ?? ''
      if (!wcaName) throw new Error('No name found')
      setDisplayNameInput(wcaName)
      await saveProfile({ displayName: wcaName, wcaId: id.toUpperCase() })
      setImportToast('success')
      setTimeout(() => setImportToast(null), 3000)
    } catch {
      setImportToast('error')
      setTimeout(() => setImportToast(null), 3000)
    } finally {
      setImportingWca(false)
    }
  }

  return (
    <div
      style={{
        padding: '32px',
        maxWidth: 640,
        margin: '0 auto',
        width: '100%',
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
          Settings
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Customize your training experience.
        </p>
      </div>

      {/* Appearance */}
      <Section title="Appearance">
        {/* Dark / Light toggle */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8 }}>Mode</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['dark', 'light'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 8,
                  border: `1px solid ${mode === m ? 'var(--accent)' : 'var(--border)'}`,
                  backgroundColor: mode === m ? 'var(--accent-dim)' : 'var(--surface-1)',
                  color: mode === m ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 150ms ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
                onMouseEnter={(e) => {
                  if (mode !== m) {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (mode !== m) {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.backgroundColor = 'var(--surface-1)'
                    e.currentTarget.style.color = 'var(--text-muted)'
                  }
                }}
              >
                {m === 'dark' ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                )}
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Accent color */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 10 }}>Accent Color</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {(Object.entries(ACCENTS) as [Exclude<AccentKey, 'custom'>, (typeof ACCENTS)[Exclude<AccentKey, 'custom'>]][]).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setAccent(key)}
                title={val.label}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  backgroundColor: val.color,
                  border: accent === key ? `3px solid var(--text-primary)` : '3px solid transparent',
                  outline: accent === key ? `2px solid ${val.color}` : 'none',
                  outlineOffset: 2,
                  cursor: 'pointer',
                  transition: 'transform 120ms ease, outline 120ms ease',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
              />
            ))}

            {/* Custom color picker */}
            <label
              title="Custom color"
              style={{
                width: 32, height: 32, borderRadius: '50%',
                border: accent === 'custom' ? `3px solid var(--text-primary)` : '3px solid var(--border)',
                outline: accent === 'custom' ? `2px solid ${customColor}` : 'none',
                outlineOffset: 2,
                cursor: 'pointer',
                flexShrink: 0,
                overflow: 'hidden',
                transition: 'transform 120ms ease',
                background: accent === 'custom'
                  ? customColor
                  : 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.15)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
            >
              <input
                type="color"
                value={accent === 'custom' ? customColor : '#ffffff'}
                onChange={(e) => setCustomColor(e.target.value)}
                style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer', border: 'none' }}
              />
            </label>
          </div>
        </div>
      </Section>

      {/* Profile */}
      <Section title="Profile" description="Your identity across sessions and rivals.">
        <div>
          <label
            htmlFor="display-name"
            style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}
          >
            Display Name
          </label>
          <input
            id="display-name"
            type="text"
            value={displayNameInput}
            onChange={(e) => setDisplayNameInput(e.target.value)}
            placeholder="Your name"
            maxLength={40}
            style={{
              width: '100%',
              backgroundColor: 'var(--surface-1)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '9px 12px',
              color: 'var(--text-primary)',
              fontSize: 14,
              outline: 'none',
              transition: 'border-color 150ms ease',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
          />
        </div>

        <div>
          <label
            htmlFor="wca-id"
            style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}
          >
            WCA ID
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              id="wca-id"
              type="text"
              value={wcaIdInput}
              onChange={(e) => handleWcaIdChange(e.target.value)}
              placeholder="e.g. 2009ZEMD01"
              maxLength={10}
              style={{
                flex: 1,
                backgroundColor: 'var(--surface-1)',
                border: `1px solid ${
                  wcaVerifyState.status === 'success'
                    ? 'var(--positive)'
                    : wcaVerifyState.status === 'not_found' || wcaVerifyState.status === 'error'
                    ? 'var(--penalty)'
                    : 'var(--border)'
                }`,
                borderRadius: 8,
                padding: '9px 12px',
                color: 'var(--text-primary)',
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                outline: 'none',
                transition: 'border-color 150ms ease',
                letterSpacing: '0.04em',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
              onBlur={(e) => {
                const borderColor =
                  wcaVerifyState.status === 'success'
                    ? 'var(--positive)'
                    : wcaVerifyState.status === 'not_found' || wcaVerifyState.status === 'error'
                    ? 'var(--penalty)'
                    : 'var(--border)'
                e.currentTarget.style.borderColor = borderColor
              }}
            />
            <button
              onClick={handleVerifyWcaId}
              disabled={!wcaIdInput.trim() || wcaVerifyState.status === 'loading'}
              style={{
                padding: '9px 14px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-1)',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontWeight: 500,
                cursor: !wcaIdInput.trim() || wcaVerifyState.status === 'loading' ? 'not-allowed' : 'pointer',
                opacity: !wcaIdInput.trim() ? 0.5 : 1,
                whiteSpace: 'nowrap',
                transition: 'border-color 150ms ease, opacity 150ms ease',
              }}
              onMouseEnter={(e) => { if (wcaIdInput.trim()) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              {wcaVerifyState.status === 'loading' ? 'Verifying…' : 'Verify'}
            </button>
          </div>
          {/* Verification feedback */}
          {wcaVerifyState.status === 'success' && (
            <div style={{
              marginTop: 6, fontSize: 12,
              color: 'var(--positive)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <span>✓</span>
              <span>
                Verified: <strong>{wcaVerifyState.data.person.name}</strong>
                {wcaVerifyState.data.person.country_iso2
                  ? ` (${wcaVerifyState.data.person.country_iso2})`
                  : ''}
              </span>
            </div>
          )}
          {wcaVerifyState.status === 'not_found' && (
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--penalty)' }}>
              WCA ID not found. Check the ID and try again.
            </div>
          )}
          {wcaVerifyState.status === 'error' && (
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--penalty)' }}>
              {wcaVerifyState.message}
            </div>
          )}
          {/* Import from WCA button */}
          {wcaIdInput.trim() && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={handleImportFromWCA}
                disabled={importingWca}
                style={{
                  padding: '6px 14px',
                  borderRadius: 7,
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-1)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: importingWca ? 'not-allowed' : 'pointer',
                  opacity: importingWca ? 0.6 : 1,
                  transition: 'border-color 150ms ease, opacity 150ms ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => { if (!importingWca) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
              >
                {importingWca ? 'Importing…' : 'Import from WCA'}
              </button>
              {importToast === 'success' && (
                <span style={{ fontSize: 12, color: 'var(--positive)', fontWeight: 600 }}>
                  Profile imported from WCA ✓
                </span>
              )}
              {importToast === 'error' && (
                <span style={{ fontSize: 12, color: 'var(--penalty)' }}>
                  Import failed — check the WCA ID
                </span>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={isSaving}
          style={{
            alignSelf: 'flex-start',
            padding: '9px 20px',
            backgroundColor: savedIndicator ? 'rgba(34,197,94,0.15)' : 'var(--accent)',
            color: savedIndicator ? 'var(--positive)' : '#020617',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            border: savedIndicator ? '1px solid var(--positive)' : 'none',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            transition: 'all 200ms ease',
            opacity: isSaving ? 0.6 : 1,
          }}
        >
          {savedIndicator ? 'Saved' : isSaving ? 'Saving...' : 'Save Profile'}
        </button>
      </Section>

      {/* Session defaults */}
      <Section title="Session Defaults">
        <div>
          <label
            htmlFor="default-event"
            style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}
          >
            Default Event
          </label>
          <select
            id="default-event"
            value={settings.defaultEvent}
            onChange={(e) => update('defaultEvent', e.target.value as WCAEvent)}
            style={{
              width: '100%',
              backgroundColor: 'var(--surface-1)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '9px 12px',
              color: 'var(--text-primary)',
              fontSize: 14,
              outline: 'none',
              cursor: 'pointer',
              transition: 'border-color 150ms ease',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            {WCA_EVENTS.map((ev) => (
              <option key={ev.value} value={ev.value}>{ev.label}</option>
            ))}
          </select>
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8 }}>
            Notes After Solve
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['off', 'soft', 'required'] as NotesBehavior[]).map((behavior) => (
              <button
                key={behavior}
                onClick={() => update('notesBehavior', behavior)}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  borderRadius: 8,
                  border: `1px solid ${settings.notesBehavior === behavior ? 'var(--accent)' : 'var(--border)'}`,
                  backgroundColor: settings.notesBehavior === behavior ? 'var(--accent-dim)' : 'var(--surface-1)',
                  color: settings.notesBehavior === behavior ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  textTransform: 'capitalize',
                }}
              >
                {behavior}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Audio */}
      <Section title="Audio">
        <Toggle
          checked={settings.inspectionCallouts}
          onChange={(v) => update('inspectionCallouts', v)}
          label="Inspection Callouts"
          description="Beep at 8 and 12 seconds during inspection."
        />

        <div>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}
          >
            <label
              htmlFor="crowd-volume"
              style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}
            >
              Crowd Noise Volume
            </label>
            <span
              className="font-mono"
              style={{ fontSize: 13, color: 'var(--text-primary)' }}
            >
              {Math.round(settings.crowdNoiseVolume * 100)}%
            </span>
          </div>
          <input
            id="crowd-volume"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={settings.crowdNoiseVolume}
            onChange={(e) => update('crowdNoiseVolume', parseFloat(e.target.value))}
            style={{
              width: '100%',
              accentColor: 'var(--accent)',
              cursor: 'pointer',
            }}
          />
        </div>
      </Section>

      {/* Account */}
      <Section title="Account">
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt=""
                width={40}
                height={40}
                style={{ borderRadius: '50%', flexShrink: 0 }}
              />
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.displayName ?? 'Signed in'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
            </div>
          </div>
        )}
        <button
          onClick={signOut}
          style={{
            alignSelf: 'flex-start',
            padding: '9px 20px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            backgroundColor: 'transparent',
            color: 'var(--text-muted)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'border-color 150ms ease, color 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--penalty)'
            e.currentTarget.style.color = 'var(--penalty)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.color = 'var(--text-muted)'
          }}
        >
          Sign out
        </button>
      </Section>
    </div>
  )
}
