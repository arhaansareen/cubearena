import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { useAuth } from '@/providers/AuthProvider'
import { useSupabaseProfile, type ProfileUpdate } from '@/hooks/useSupabaseProfile'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { formatTime } from '@/lib/utils'
import type { SupabaseAchievement } from '@/lib/supabase'

// ─── Crop utility ─────────────────────────────────────────────────────────────
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
): Promise<Blob> {
  const image = await createImageBitmap(await fetch(imageSrc).then((r) => r.blob()))
  const canvas = document.createElement('canvas')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height)
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('canvas.toBlob returned null'))),
      'image/jpeg',
      0.9,
    )
  )
}

// ─── Country list (subset) ────────────────────────────────────────────────────
const COUNTRIES: { code: string; name: string; flag: string }[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
]

const EVENT_LABELS: Record<string, string> = {
  '333': '3×3', '222': '2×2', '444': '4×4', '555': '5×5',
  '333bf': 'BLD', '333oh': 'OH', 'pyram': 'Pyra', 'skewb': 'Skewb',
  'minx': 'Megaminx', 'sq1': 'Sq-1', '666': '6×6', '777': '7×7',
}

function countryFlag(code: string | null) {
  return COUNTRIES.find((c) => c.code === code)?.flag ?? '🌐'
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({
  url, name, size = 88, editable, onUpload,
}: {
  url: string | null
  name: string | null
  size?: number
  editable?: boolean
  onUpload?: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const initials = (name ?? '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div
      style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}
      onClick={() => editable && inputRef.current?.click()}
    >
      {url ? (
        <img
          src={url}
          alt={name ?? 'avatar'}
          style={{
            width: size, height: size,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '3px solid var(--accent)',
            cursor: editable ? 'pointer' : 'default',
          }}
        />
      ) : (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          backgroundColor: 'var(--accent-dim)',
          border: '3px solid var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.32, fontWeight: 700, color: 'var(--accent)',
          cursor: editable ? 'pointer' : 'default',
          fontFamily: "'Inter', sans-serif",
        }}>
          {initials}
        </div>
      )}
      {editable && (
        <>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0, transition: 'opacity 150ms ease',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0' }}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M7 4l1.5-2h3L13 4h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1h3z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="10" cy="10" r="2.5" stroke="white" strokeWidth="1.5"/></svg>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onUpload?.(file)
              // reset so the same file can be re-selected
              e.target.value = ''
            }}
          />
        </>
      )}
    </div>
  )
}

// ─── Stat chip ────────────────────────────────────────────────────────────────
function StatChip({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{
      backgroundColor: accent ? 'var(--accent-dim)' : 'var(--surface-1)',
      border: `1px solid ${accent ? 'rgba(34,211,238,0.3)' : 'var(--border)'}`,
      borderRadius: 10, padding: '12px 16px',
      display: 'flex', flexDirection: 'column', gap: 3,
    }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: accent ? 'var(--accent)' : 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{
        fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em',
        fontFamily: "'JetBrains Mono', monospace",
        color: accent ? 'var(--accent)' : 'var(--text-primary)',
      }}>
        {value}
      </span>
    </div>
  )
}

// ─── Achievement badge ────────────────────────────────────────────────────────
const ACHIEVEMENT_ICONS: Record<string, React.ReactNode> = {
  '🏆': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4a2 2 0 0 1-2-2V5h4"/><path d="M18 9h2a2 2 0 0 0 2-2V5h-4"/><path d="M12 17v4"/><path d="M8 21h8"/><path d="M6 5h12v7a6 6 0 0 1-12 0V5z"/></svg>,
  '🎯': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  '🔥': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  '⚡': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  '💎': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12l4 6-10 13L2 9z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>,
  '🔟': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 8v8M13 12h4M13 8h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/></svg>,
}

function AchievementBadge({ icon, label, earnedAt }: { icon: string; label: string; earnedAt: string }) {
  const svgIcon = ACHIEVEMENT_ICONS[icon]
  return (
    <div
      title={`Earned ${new Date(earnedAt).toLocaleDateString()}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '8px 12px',
      }}
    >
      <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>
        {svgIcon ?? <span style={{ fontSize: 18 }}>{icon}</span>}
      </span>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</span>
    </div>
  )
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({
  label, value, onChange, placeholder, multiline, maxLength,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  multiline?: boolean
  maxLength?: number
}) {
  const base: React.CSSProperties = {
    width: '100%',
    backgroundColor: 'var(--surface-1)',
    border: '1px solid var(--border)',
    borderRadius: 8, padding: '9px 12px',
    color: 'var(--text-primary)', fontSize: 14,
    fontFamily: "'Inter', sans-serif",
    outline: 'none', resize: 'vertical' as const,
    boxSizing: 'border-box',
    transition: 'border-color 150ms ease',
  }

  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={3}
          style={base}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.4)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          style={base}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.4)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
        />
      )}
    </div>
  )
}

// ─── ProfilePage ──────────────────────────────────────────────────────────────
export function ProfilePage() {
  const { user } = useAuth()
  const uid = user?.uid ?? null
  const { profile, loading, error, upsertProfile, uploadAvatar } = useSupabaseProfile(uid)

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [achievements, setAchievements] = useState<SupabaseAchievement[]>([])
  const [pbMap, setPbMap] = useState<Record<string, number>>({})

  // Edit form state
  const [form, setForm] = useState<ProfileUpdate>({})

  // Crop modal state
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixelsProp: Area) => {
    setCroppedAreaPixels(croppedAreaPixelsProp)
  }, [])

  useEffect(() => {
    if (profile) {
      setForm({
        username: profile.username ?? '',
        display_name: profile.display_name ?? '',
        bio: profile.bio ?? '',
        country_code: profile.country_code ?? '',
        goals: profile.goals ?? '',
        wca_id: profile.wca_id ?? '',
        main_event: profile.main_event ?? '333',
      })
    }
  }, [profile])

  // Fetch achievements
  useEffect(() => {
    if (!uid || !isSupabaseConfigured) return
    supabase
      .from('achievements')
      .select('*')
      .eq('firebase_uid', uid)
      .order('earned_at', { ascending: false })
      .then(({ data }) => setAchievements((data as SupabaseAchievement[]) ?? []))
  }, [uid])

  // Fetch PBs from solves
  useEffect(() => {
    if (!uid || !isSupabaseConfigured) return
    supabase
      .from('solves')
      .select('event, effective_time_ms')
      .eq('firebase_uid', uid)
      .not('effective_time_ms', 'is', null)
      .then(({ data }) => {
        const map: Record<string, number> = {}
        for (const row of data ?? []) {
          const t = row.effective_time_ms as number
          if (!map[row.event] || t < map[row.event]) map[row.event] = t
        }
        setPbMap(map)
      })
  }, [uid])

  async function handleSave() {
    setSaving(true)
    await upsertProfile(form)
    setSaving(false)
    setEditing(false)
  }

  async function handleAvatarUpload(file: File) {
    setUploadingAvatar(true)
    await uploadAvatar(file)
    setUploadingAvatar(false)
  }

  function handleAvatarSelect(file: File) {
    const url = URL.createObjectURL(file)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    setCropSrc(url)
  }

  async function applyCrop() {
    if (!cropSrc || !croppedAreaPixels) return
    try {
      const blob = await getCroppedImg(cropSrc, croppedAreaPixels)
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
      URL.revokeObjectURL(cropSrc)
      setCropSrc(null)
      await handleAvatarUpload(file)
    } catch {
      URL.revokeObjectURL(cropSrc)
      setCropSrc(null)
    }
  }

  function cancelCrop() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  if (!isSupabaseConfigured) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local
      </div>
    )
  }

  const displayName = profile?.display_name || profile?.username || 'Anonymous Cuber'
  const flag = countryFlag(profile?.country_code ?? null)
  const pbEntries = Object.entries(pbMap).sort((a, b) => a[0].localeCompare(b[0]))

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px 80px' }}>

      {/* ── Crop modal ── */}
      {cropSrc && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) cancelCrop() }}
        >
          <div style={{
            display: 'flex', flexDirection: 'column',
            backgroundColor: 'var(--surface-0)',
            borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}>
            <div style={{
              position: 'relative',
              width: 'min(480px, 90vw)',
              height: 'min(480px, 80vh)',
              backgroundColor: 'var(--surface-0)',
              borderRadius: '16px 16px 0 0',
              overflow: 'hidden',
            }}>
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div style={{
              display: 'flex', gap: 8, padding: 12,
              backgroundColor: 'var(--surface-0)',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={cancelCrop}
                style={{
                  padding: '8px 18px', borderRadius: 8,
                  border: '1px solid var(--border)', backgroundColor: 'transparent',
                  color: 'var(--text-muted)', fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.color = 'var(--text-muted)'
                }}
              >
                Cancel
              </button>
              <button
                onClick={applyCrop}
                style={{
                  padding: '8px 20px', borderRadius: 8,
                  border: 'none', backgroundColor: 'var(--accent)',
                  color: '#020617', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Profile card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          backgroundColor: 'var(--surface-0)',
          border: '1px solid var(--border)',
          borderRadius: 16, overflow: 'hidden',
          marginBottom: 20,
        }}
      >
        {/* Banner */}
        <div style={{
          height: 100,
          background: 'linear-gradient(135deg, rgba(34,211,238,0.15) 0%, rgba(34,211,238,0.04) 50%, var(--surface-0) 100%)',
          borderBottom: '1px solid var(--border)',
        }} />

        {/* Avatar + header info */}
        <div style={{ padding: '0 28px 24px', position: 'relative' }}>
          <div style={{
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
            marginTop: -44, marginBottom: 16,
          }}>
            <div style={{ position: 'relative' }}>
              {uploadingAvatar && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 1, fontSize: 18,
                }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="7.5" stroke="white" strokeWidth="1.5" opacity="0.6"/><path d="M10 6v4l2.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              )}
              <Avatar
                url={profile?.avatar_url ?? null}
                name={displayName}
                size={88}
                editable={editing && !loading}
                onUpload={handleAvatarSelect}
              />
            </div>

            {/* Edit / Save button */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              {editing ? (
                <>
                  <button
                    onClick={() => setEditing(false)}
                    style={{
                      padding: '7px 16px', borderRadius: 8,
                      border: '1px solid var(--border)', backgroundColor: 'transparent',
                      color: 'var(--text-muted)', fontSize: 13, fontWeight: 500,
                      cursor: 'pointer', transition: 'all 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent)'
                      e.currentTarget.style.color = 'var(--text-primary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.color = 'var(--text-muted)'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      padding: '7px 20px', borderRadius: 8,
                      border: 'none', backgroundColor: 'var(--accent)',
                      color: '#020617', fontSize: 13, fontWeight: 700,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      opacity: saving ? 0.7 : 1,
                    }}
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  style={{
                    padding: '7px 18px', borderRadius: 8,
                    border: '1px solid var(--border)', backgroundColor: 'var(--surface-1)',
                    color: 'var(--text-primary)', fontSize: 13, fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Edit profile
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[160, 100, 200].map((w, i) => (
                <div key={i} style={{ width: w, height: 14, backgroundColor: 'var(--surface-1)', borderRadius: 6 }} />
              ))}
            </div>
          ) : editing ? (
            /* ── Edit form ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field
                  label="Display name"
                  value={form.display_name ?? ''}
                  onChange={(v) => setForm((f) => ({ ...f, display_name: v }))}
                  placeholder="Your name"
                  maxLength={40}
                />
                <Field
                  label="Username"
                  value={form.username ?? ''}
                  onChange={(v) => setForm((f) => ({ ...f, username: v.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                  placeholder="@handle"
                  maxLength={24}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
                    Country
                  </label>
                  <select
                    value={form.country_code ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, country_code: e.target.value }))}
                    style={{
                      width: '100%', backgroundColor: 'var(--surface-1)',
                      border: '1px solid var(--border)', borderRadius: 8,
                      padding: '9px 12px', color: 'var(--text-primary)',
                      fontSize: 14, fontFamily: "'Inter', sans-serif", outline: 'none',
                    }}
                  >
                    <option value="">— Select country —</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                    ))}
                  </select>
                </div>
                <Field
                  label="WCA ID"
                  value={form.wca_id ?? ''}
                  onChange={(v) => setForm((f) => ({ ...f, wca_id: v.toUpperCase() }))}
                  placeholder="2020ABCD01"
                  maxLength={12}
                />
              </div>
              <Field
                label="Bio / Tagline"
                value={form.bio ?? ''}
                onChange={(v) => setForm((f) => ({ ...f, bio: v }))}
                placeholder="One line about you — e.g. Sub-10 3×3, BLD learner, comp veteran"
                maxLength={120}
              />
              <Field
                label="Cubing Goals"
                value={form.goals ?? ''}
                onChange={(v) => setForm((f) => ({ ...f, goals: v }))}
                placeholder="What are you working towards? Sub-10 3×3, learning 4BLD, competing at Nats…"
                multiline
                maxLength={500}
              />
              {error && (
                <div style={{ fontSize: 13, color: 'var(--penalty)', padding: '8px 12px', backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 6 }}>
                  {error}
                </div>
              )}
            </div>
          ) : (
            /* ── View mode ── */
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
                  {displayName}
                </h1>
                {profile?.country_code && (
                  <span style={{ fontSize: 20 }}>{flag}</span>
                )}
                {profile?.username && (
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                    @{profile.username}
                  </span>
                )}
              </div>

              {profile?.bio && (
                <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 10px', lineHeight: 1.5 }}>
                  {profile.bio}
                </p>
              )}

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {profile?.wca_id && (
                  <a
                    href={`https://www.worldcubeassociation.org/persons/${profile.wca_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontSize: 12, color: 'var(--accent)', textDecoration: 'none',
                      backgroundColor: 'var(--accent-dim)', borderRadius: 6,
                      padding: '4px 10px', border: '1px solid rgba(34,211,238,0.2)',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M6 11l-2 7 6-3 6 3-2-7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                    WCA: {profile.wca_id}
                  </a>
                )}
                {profile?.total_points !== undefined && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: 12, color: 'var(--positive)',
                    backgroundColor: 'rgba(34,197,94,0.08)', borderRadius: 6,
                    padding: '4px 10px', border: '1px solid rgba(34,197,94,0.2)',
                    fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                  }}>
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 2l2.4 5 5.6.8-4 3.9.9 5.3L10 14.5l-4.9 2.5.9-5.3L2 7.8l5.6-.8L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                    {profile.total_points.toLocaleString()} pts
                  </span>
                )}
                {profile?.day_streak !== undefined && profile.day_streak > 0 && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: 12, color: '#f97316',
                    backgroundColor: 'rgba(249,115,22,0.08)', borderRadius: 6,
                    padding: '4px 10px', border: '1px solid rgba(249,115,22,0.2)',
                    fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                  }}>
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 2c0 4-4 5-4 9a4 4 0 008 0c0-2-1-3-1-5 0 0-1 2-2 2s-2-2-1-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                    {profile.day_streak}-day streak
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* ── Left column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* About / Goals */}
          {!editing && profile?.goals && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                backgroundColor: 'var(--surface-0)',
                border: '1px solid var(--border)',
                borderRadius: 14, padding: '20px 22px',
              }}
            >
              <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 7 }}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5"/><circle cx="10" cy="10" r="1.5" fill="currentColor"/></svg>
                Goals
              </h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap' }}>
                {profile.goals}
              </p>
            </motion.section>
          )}

          {/* Stats */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 7 }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="2" y="10" width="4" height="8" rx="1" fill="currentColor" opacity="0.7"/><rect x="8" y="6" width="4" height="12" rx="1" fill="currentColor" opacity="0.9"/><rect x="14" y="2" width="4" height="16" rx="1" fill="currentColor"/></svg>
              Stats
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <StatChip label="Total Solves" value={(profile?.solve_count ?? 0).toLocaleString()} />
              <StatChip label="Points" value={(profile?.total_points ?? 0).toLocaleString()} accent />
              <StatChip label="Day Streak" value={`${profile?.day_streak ?? 0}d`} />
              <StatChip label="Main Event" value={EVENT_LABELS[profile?.main_event ?? '333'] ?? '3×3'} />
            </div>
          </motion.section>
        </div>

        {/* ── Right column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Personal Bests */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              backgroundColor: 'var(--surface-0)',
              border: '1px solid var(--border)',
              borderRadius: 14, padding: '20px 22px',
            }}
          >
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 7 }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 13c-3.314 0-6-2.686-6-6V3h12v4c0 3.314-2.686 6-6 6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M4 5H2.5a1 1 0 00-1 1v1a3 3 0 003 3H5M16 5h1.5a1 1 0 011 1v1a3 3 0 01-3 3H15M10 13v3M7 18h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Personal bests
            </h2>
            {pbEntries.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                No solves recorded yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {pbEntries.map(([event, pb]) => (
                  <div key={event} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '7px 0',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {EVENT_LABELS[event] ?? event}
                    </span>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 15, fontWeight: 700,
                      color: 'var(--positive)',
                    }}>
                      {formatTime(pb)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.section>

          {/* Achievements */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            style={{
              backgroundColor: 'var(--surface-0)',
              border: '1px solid var(--border)',
              borderRadius: 14, padding: '20px 22px',
            }}
          >
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 7 }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 2l1.8 3.8 4.2.6-3 3 .7 4.2L10 11.5l-3.7 2.1.7-4.2-3-3 4.2-.6L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
              Achievements
            </h2>
            <AnimatePresence>
              {achievements.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                  Complete sessions to earn badges.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {achievements.map((a) => (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <AchievementBadge icon={a.icon} label={a.label} earnedAt={a.earned_at} />
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </motion.section>
        </div>
      </div>
    </div>
  )
}
