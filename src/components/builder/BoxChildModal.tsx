'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FIELD_REGISTRY, CATEGORIES, FieldMeta } from '@/lib/fieldRegistry'
import { FieldType } from '@/types'
import { X, Search, Check } from 'lucide-react'

interface Props {
  open:     boolean
  onClose:  () => void
  onAdd:    (types: FieldType[]) => void
}

export default function BoxChildModal({ open, onClose, onAdd }: Props) {
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState<Set<FieldType>>(new Set())
  const [openCats, setOpenCats]   = useState<Set<string>>(
    new Set(CATEGORIES.map(c => c.key))
  )

  // Reset on open
  useEffect(() => {
    if (open) {
      setSearch('')
      setSelected(new Set())
    }
  }, [open])

  if (!open) return null

  const filtered = FIELD_REGISTRY.filter(f =>
    f.label.toLowerCase().includes(search.toLowerCase())
  )

  const toggleCat = (key: string) => {
    setOpenCats(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const toggleItem = (type: FieldType) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }

  const handleAdd = () => {
    if (selected.size === 0) return
    onAdd(Array.from(selected))
    onClose()
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col"
        style={{ width: 520, maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0 border-b border-[var(--border)]">
          <div>
            <h2 className="text-base font-semibold text-[var(--text)]">Add components to Box</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Select one or more components to place inside the box
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 flex-shrink-0">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              autoFocus
              className="fe-input text-sm w-full"
              style={{ paddingLeft: '2rem' }}
              placeholder="Search components..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Component list */}
        <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-3">
          {search ? (
            <div className="grid grid-cols-2 gap-1.5">
              {filtered.map(meta => (
                <ComponentItem
                  key={meta.type}
                  meta={meta}
                  selected={selected.has(meta.type)}
                  onToggle={() => toggleItem(meta.type)}
                />
              ))}
              {filtered.length === 0 && (
                <p className="col-span-2 text-xs text-[var(--muted)] py-4 text-center">No components found</p>
              )}
            </div>
          ) : (
            CATEGORIES.map(cat => {
              const items  = FIELD_REGISTRY.filter(f => f.category === cat.key)
              const isOpen = openCats.has(cat.key)
              return (
                <div key={cat.key}>
                  <button
                    onClick={() => toggleCat(cat.key)}
                    className="w-full flex items-center justify-between py-1.5 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider hover:text-[var(--text)] transition-colors"
                  >
                    <span>{cat.label}</span>
                    <span className={`transition-transform ${isOpen ? '' : '-rotate-90'}`}>▾</span>
                  </button>
                  {isOpen && (
                    <div className="grid grid-cols-2 gap-1.5 mt-1">
                      {items.map(meta => (
                        <ComponentItem
                          key={meta.type}
                          meta={meta}
                          selected={selected.has(meta.type)}
                          onToggle={() => toggleItem(meta.type)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--border)] flex-shrink-0">
          <span className="text-xs text-[var(--muted)]">
            {selected.size > 0
              ? `${selected.size} component${selected.size > 1 ? 's' : ''} selected`
              : 'No components selected'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={selected.size === 0}
              className="px-4 py-1.5 rounded-lg text-sm font-medium bg-[var(--brand)] text-white hover:bg-[#4f46e5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Add to Box
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

function ComponentItem({
  meta, selected, onToggle,
}: {
  meta:     FieldMeta
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left w-full border transition-all
        ${selected
          ? 'border-[var(--brand)] bg-[#eef2ff] dark:bg-[#1e1b4b] text-[var(--brand)]'
          : 'border-[var(--border)] hover:border-[var(--brand)]/40 hover:bg-[var(--surface-2)] text-[var(--text)]'}
      `}
    >
      <span
        className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ background: meta.color + '18', color: meta.color }}
      >
        <meta.icon size={13} />
      </span>
      <span className="flex-1 text-xs font-medium truncate">{meta.label}</span>
      {selected && (
        <span className="w-4 h-4 rounded-full bg-[var(--brand)] flex items-center justify-center flex-shrink-0">
          <Check size={9} color="white" />
        </span>
      )}
    </button>
  )
}