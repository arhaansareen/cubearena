import { useEffect, useRef, useState } from 'react'
import type { Solve } from '@/types'

interface SessionMeta {
  id: string
  name: string
  solves: Solve[]
  createdAt: number
}

interface SessionPickerProps {
  sessions: SessionMeta[]
  activeSessionId: string
  onSwitch: (id: string) => void
  onCreate: () => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

export function SessionPicker({
  sessions,
  activeSessionId,
  onSwitch,
  onCreate,
  onRename,
  onDelete,
}: SessionPickerProps) {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  const activeSession = sessions.find(s => s.id === activeSessionId)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setEditingId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  const startEdit = (s: SessionMeta, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(s.id)
    setEditValue(s.name)
  }

  const commitEdit = () => {
    if (editingId && editValue.trim()) {
      onRename(editingId, editValue.trim())
    }
    setEditingId(null)
  }

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') setEditingId(null)
  }

  const handleDelete = (s: SessionMeta, e: React.MouseEvent) => {
    e.stopPropagation()
    if (s.solves.length > 0) {
      if (!window.confirm(`Delete "${s.name}" (${s.solves.length} solve${s.solves.length === 1 ? '' : 's'})?`)) return
    }
    onDelete(s.id)
  }

  const handleSwitch = (id: string) => {
    onSwitch(id)
    setOpen(false)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4 }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: open ? 'var(--surface-1)' : 'none',
          border: `1px solid ${open ? 'var(--border)' : 'var(--border)'}`,
          borderRadius: 8,
          padding: '5px 10px',
          color: 'var(--text-primary)',
          fontSize: 12, fontWeight: 500,
          cursor: 'pointer',
          transition: 'background 150ms ease',
          maxWidth: 160,
          overflow: 'hidden',
        }}
        onMouseOver={e => { if (!open) e.currentTarget.style.background = 'var(--surface-1)' }}
        onMouseOut={e => { if (!open) e.currentTarget.style.background = 'none' }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>
          {activeSession?.name ?? 'Session'}
        </span>
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms ease' }}
        >
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <button
        onClick={onCreate}
        title="New session"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28,
          background: 'none',
          border: '1px solid var(--border)',
          borderRadius: 8,
          color: 'var(--text-muted)',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'color 150ms ease, border-color 150ms ease, background 150ms ease',
        }}
        onMouseOver={e => {
          e.currentTarget.style.color = 'var(--accent)'
          e.currentTarget.style.borderColor = 'var(--accent)'
          e.currentTarget.style.background = 'var(--accent-dim)'
        }}
        onMouseOut={e => {
          e.currentTarget.style.color = 'var(--text-muted)'
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.background = 'none'
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 200,
            minWidth: 200,
            backgroundColor: 'var(--surface-0)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '4px 0',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          {sessions.map(s => {
            const isActive = s.id === activeSessionId
            const isHovered = hoveredId === s.id
            const isEditing = editingId === s.id

            return (
              <div
                key={s.id}
                onClick={() => !isEditing && handleSwitch(s.id)}
                onMouseEnter={() => setHoveredId(s.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 10px',
                  cursor: isEditing ? 'default' : 'pointer',
                  backgroundColor: isActive ? 'var(--accent-dim)' : isHovered ? 'var(--surface-1)' : 'transparent',
                  transition: 'background 100ms ease',
                  userSelect: 'none',
                }}
              >
                {isActive && (
                  <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: 'var(--accent)', flexShrink: 0 }} />
                )}
                {!isActive && <span style={{ width: 5, flexShrink: 0 }} />}

                <div style={{ flex: 1, minWidth: 0 }}>
                  {isEditing ? (
                    <input
                      ref={editInputRef}
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={handleEditKeyDown}
                      onClick={e => e.stopPropagation()}
                      style={{
                        width: '100%',
                        background: 'var(--surface-1)',
                        border: '1px solid var(--accent)',
                        borderRadius: 4,
                        color: 'var(--text-primary)',
                        fontSize: 12,
                        fontFamily: 'inherit',
                        padding: '2px 4px',
                        outline: 'none',
                      }}
                    />
                  ) : (
                    <span
                      onDoubleClick={e => startEdit(s, e)}
                      style={{
                        fontSize: 12,
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title="Double-click to rename"
                    >
                      {s.name}
                    </span>
                  )}
                </div>

                <span style={{
                  fontSize: 10, fontWeight: 600,
                  color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                  backgroundColor: isActive ? 'var(--accent-dim)' : 'var(--surface-1)',
                  borderRadius: 4,
                  padding: '1px 5px',
                  flexShrink: 0,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {s.solves.length}
                </span>

                {isHovered && !isEditing && (
                  <button
                    onClick={e => handleDelete(s, e)}
                    title="Delete session"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 20, height: 20, flexShrink: 0,
                      background: 'none', border: 'none',
                      color: 'var(--penalty)',
                      cursor: 'pointer',
                      borderRadius: 4,
                      padding: 0,
                      transition: 'background 100ms ease',
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)' }}
                    onMouseOut={e => { e.currentTarget.style.background = 'none' }}
                  >
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                      <path d="M1.5 2.5h8M4 2.5V1.5h3v1M4.5 4.5v4M6.5 4.5v4M2 2.5l.5 7h6l.5-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
                {(!isHovered || isEditing) && <span style={{ width: 20, flexShrink: 0 }} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
