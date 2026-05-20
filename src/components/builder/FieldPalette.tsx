'use client'
import { useDraggable } from '@dnd-kit/core'
import { FIELD_REGISTRY, CATEGORIES, FieldMeta } from '@/lib/fieldRegistry'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search } from 'lucide-react'
import SectionPanel from './SectionPanel'

// ── Portal tooltip — renders outside all overflow containers ─────────────────
function TooltipPortal({ label, anchorRef }: { label: string; anchorRef: React.RefObject<HTMLDivElement> }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    setPos({
      top:  rect.top - 6,                      // 6px gap above the item
      left: rect.left + rect.width / 2,        // horizontally centred
    })
  }, [anchorRef])

  if (!mounted || !pos) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top:       pos.top,
        left:      pos.left,
        transform: 'translate(-50%, -100%)',
        zIndex:    9999,
        pointerEvents: 'none',
      }}
      className="palette-tooltip-portal"
    >
      {label}
    </div>,
    document.body
  )
}

function DraggablePaletteItem({ meta }: { meta: FieldMeta }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id:   `palette-${meta.type}`,
    data: { fromPalette: true, type: meta.type },
  })

  const wordCount   = meta.label.trim().split(/\s+/).length
  const needsTooltip = wordCount > 2
  const [hovered, setHovered] = useState(false)
  const itemRef = useRef<HTMLDivElement>(null)

  // Merge dnd ref + our own ref
  const mergedRef = (node: HTMLDivElement | null) => {
    ;(itemRef as React.MutableRefObject<HTMLDivElement | null>).current = node
    setNodeRef(node)
  }

  return (
    <div
      ref={mergedRef}
      {...listeners}
      {...attributes}
      className="palette-item"
      style={{ opacity: isDragging ? 0.4 : 1 }}
      onMouseEnter={() => needsTooltip && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ background: meta.color + '18', color: meta.color }}
      >
        <meta.icon size={13} />
      </span>
      <span className="truncate">{meta.label}</span>

      {needsTooltip && hovered && (
        <TooltipPortal label={meta.label} anchorRef={itemRef as React.RefObject<HTMLDivElement>} />
      )}
    </div>
  )
}

export default function FieldPalette() {
  const [search, setSearch] = useState('')
  const [openCats, setOpenCats] = useState<Set<string>>(
    new Set(CATEGORIES.map(c => c.key))
  )

  const toggleCat = (key: string) => {
    setOpenCats(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const filtered = FIELD_REGISTRY.filter(f =>
    f.label.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Title */}
      <div className="px-4 pt-4 pb-2 flex-shrink-0">
        <h3 className="text-xs font-semibold text-[var(--text)] uppercase tracking-wider">Fields</h3>
      </div>

      {/* Search */}
      <div className="px-4 pb-3 flex-shrink-0">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            className="fe-input pl-8 text-xs"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Field list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {search ? (
          <div className="grid grid-cols-2 gap-1.5">
            {filtered.map(meta => <DraggablePaletteItem key={meta.type} meta={meta} />)}
          </div>
        ) : (
          CATEGORIES.map(cat => {
            const items = FIELD_REGISTRY.filter(f => f.category === cat.key)
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
                    {items.map(meta => <DraggablePaletteItem key={meta.type} meta={meta} />)}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Sections panel */}
      <div className="flex-shrink-0 overflow-y-auto max-h-[40%] px-2 pb-4">
        <SectionPanel />
      </div>
    </div>
  )
}