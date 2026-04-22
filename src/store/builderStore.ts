import { create } from 'zustand'
import { FormField, FormSection, FormSettings, TableColumn, TableRow } from '@/types'
import { v4 as uuid } from 'uuid'

interface BuilderState {
  fields:          FormField[]
  sections:        FormSection[]
  selectedId:      string | null
  selectedSectionId: string | null
  selectedFieldSectionId: string | null
  formName:        string
  formDescription: string
  settings:        FormSettings
  isDirty:         boolean
  insertIndex:     number | null
  insertSectionId: string | null

  setFormMeta:    (name: string, description: string) => void
  setSettings:    (s: Partial<FormSettings>) => void
  addField:       (type: FormField['type'], atIndex?: number, sectionId?: string) => void
  removeField:    (id: string, sectionId?: string) => void
  updateField:    (id: string, patch: Partial<FormField>, sectionId?: string) => void
  moveField:      (from: number, to: number, sectionId?: string) => void
  selectField:    (id: string | null, sectionId?: string | null) => void
  duplicateField: (id: string, sectionId?: string) => void
  setInsertIndex: (index: number | null) => void
  setInsertSectionId: (sectionId: string | null) => void
  insertFields:   (newFields: FormField[], atIndex?: number) => void
  loadSchema:     (fields: FormField[], settings: FormSettings, name: string, desc: string, sections?: FormSection[]) => void
  importSchema:   (json: string) => { ok: boolean; error?: string }
  insertSchema:   (json: string, atIndex: number | null) => { ok: boolean; error?: string }
  exportSchema:   () => string
  clearDirty:     () => void
  addSection:       () => void
  removeSection:    (id: string) => void
  updateSection:    (id: string, patch: Partial<FormSection>) => void
  moveSection:      (from: number, to: number) => void
  duplicateSection: (id: string) => void
  selectSection:    (id: string | null) => void
  addFieldToSection: (sectionId: string, type: FormField['type'], atIndex?: number) => void
  removeFieldFromSection: (sectionId: string, fieldId: string) => void
  moveFieldInSection: (sectionId: string, from: number, to: number) => void
  moveFieldBetweenSections: (fieldId: string, fromSectionId: string | null, toSectionId: string | null, toIndex: number) => void
  rebalanceRow: (rowId: string, sectionId?: string) => void
  removeFieldFromRow: (fieldId: string, sectionId?: string) => void
}

// ── Factory function: returns a FRESH object every call ───────────────────────
// A static FIELD_DEFAULTS object causes shared array/object references between
// multiple fields of the same type. Using a factory guarantees each new field
// gets its own independent copy of arrays like tableColumns / tableRows.
function makeFieldDefaults(type: FormField['type']): Partial<FormField> {
  switch (type) {
    case 'button':             return { label: 'Button', content: 'Button', buttonVariant: 'primary', buttonAction: 'submit' }
    case 'button_group':       return { label: 'Button Group', options: [{ label: 'Option 1', value: 'option1' }, { label: 'Option 2', value: 'option2' }], validation: {} }
    case 'checkbox':           return { label: 'Checkbox', defaultValue: false, validation: {} }
    case 'date_picker':        return { label: 'Date Picker', validation: {} }
    case 'radio_group':        return { label: 'Radio Group', options: [{ label: 'Option 1', value: 'option1' }, { label: 'Option 2', value: 'option2' }], validation: {} }
    case 'radio_item':         return { label: 'Radio Item', validation: {} }
    case 'select':             return { label: 'Select', placeholder: 'Select an option', options: [{ label: 'Option 1', value: 'option1' }, { label: 'Option 2', value: 'option2' }], validation: {} }
    case 'switch':             return { label: 'Switch', defaultValue: false, validation: {} }
    case 'text_field':         return { label: 'Text Field', placeholder: 'Enter text...', validation: {} }
    case 'uploader':           return { label: 'Uploader', validation: {} }
    case 'list':               return { label: 'List' }
    case 'list_item':          return { label: 'List Item' }
    case 'tooltip':            return { label: 'Hover me', placeholder: 'Tooltip text' }
    case 'typography':         return { label: 'Typography', content: 'Text content here...' }
    // Each call to makeFieldDefaults('table') creates brand-new arrays —
    // editing one table field's columns will never affect another table field.
    case 'table': return {
      label: 'Table',
      tableColumns: [
        { id: 'c1', header: 'Column 1', align: 'left'  } as TableColumn,
        { id: 'c2', header: 'Column 2', align: 'left'  } as TableColumn,
        { id: 'c3', header: 'Column 3', align: 'left'  } as TableColumn,
      ],
      tableRows: [
        { id: 'r1', cells: { c1: 'Cell 1,1', c2: 'Cell 1,2', c3: 'Cell 1,3' } } as TableRow,
        { id: 'r2', cells: { c1: 'Cell 2,1', c2: 'Cell 2,2', c3: 'Cell 2,3' } } as TableRow,
      ],
      tableStriped:  true,
      tableBordered: true,
      tableCompact:  false,
    }
    case 'circular_progress':  return { label: 'Loading...' }
    case 'linear_progress':    return { label: 'Progress' }
    case 'box':                return { label: 'Box' }
    case 'container':          return { label: 'Container' }
    case 'dialog_layout':      return { label: 'Dialog' }
    case 'stack':              return { label: 'Stack' }
    case 'card':               return { label: 'Card Title', placeholder: 'Card content goes here.' }
    case 'breadcrumbs':        return { label: 'Current Page' }
    case 'link':               return { label: 'Click here', placeholder: 'https://example.com' }
    case 'form_control_label': return { label: 'Form Control Label', validation: {} }
    case 'form_label':         return { label: 'Form Label', validation: {} }
    case 'embedded_form':      return { label: 'Embedded Form' }
    case 'slot':               return { label: 'Slot' }
    case 'test':               return { label: 'Test Component' }
    case 'repeater':           return { label: 'Repeater' }
    case 'modal':              return { label: 'Modal Title', placeholder: 'Modal body content goes here.' }
    case 'heading':            return { label: 'Heading', content: 'Heading', level: 1 }
    case 'paragraph':          return { label: 'Paragraph', content: 'Paragraph text here...' }
    case 'divider':            return { label: '' }
    case 'blockquote':         return { label: 'Blockquote', content: 'Quote text here...' }
    case 'code_block':         return { label: 'Code Block', content: '// Your code here' }
    case 'ordered_list':       return { label: 'Ordered List', content: 'First item\nSecond item\nThird item' }
    case 'unordered_list':     return { label: 'Unordered List', content: 'First item\nSecond item\nThird item' }
    case 'caption':            return { label: 'Caption', content: 'Caption text here...' }
    default:                   return { label: 'Field' }
  }
}

// ── Deep helpers ──────────────────────────────────────────────────────────────

/** Recursively find a field by id, searching .children of box fields */
export function findFieldDeep(fields: FormField[], id: string): FormField | undefined {
  for (const f of fields) {
    if (f.id === id) return f
    if (f.children?.length) {
      const found = findFieldDeep(f.children, id)
      if (found) return found
    }
  }
  return undefined
}

/** Recursively update a field by id in a list (including inside .children) */
function updateInList(fields: FormField[], id: string, patch: Partial<FormField>): FormField[] {
  return fields.map(f => {
    if (f.id === id) return { ...f, ...patch }
    if (f.children?.length) return { ...f, children: updateInList(f.children, id, patch) }
    return f
  })
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useBuilderStore = create<BuilderState>((set, get) => ({
  fields:             [],
  sections:           [],
  selectedId:         null,
  selectedSectionId:  null,
  selectedFieldSectionId: null,
  insertIndex:        null,
  insertSectionId:    null,
  formName:           'Untitled Form',
  formDescription:    '',
  settings: {
    submitLabel:    'Submit',
    successMessage: 'Thank you! Your response has been recorded.',
    showLabels:     true,
  },
  isDirty: false,

  setFormMeta: (name, description) =>
    set({ formName: name, formDescription: description, isDirty: true }),

  setSettings: (s) =>
    set(state => ({ settings: { ...state.settings, ...s }, isDirty: true })),

  addField: (type, atIndex, sectionId) => {
    // makeFieldDefaults() is called here — a fresh object with fresh arrays
    // every single time, so no cross-field reference sharing.
    const newField: FormField = {
      id:    uuid(),
      type,
      width: 'col1',
      ...makeFieldDefaults(type),
    } as FormField

    if (sectionId) {
      set(state => {
        const sections = state.sections.map(sec => {
          if (sec.id !== sectionId) return sec
          const fields = [...sec.fields]
          if (atIndex !== undefined) fields.splice(atIndex, 0, newField)
          else fields.push(newField)
          return { ...sec, fields }
        })
        return { sections, selectedId: newField.id, selectedFieldSectionId: sectionId, isDirty: true }
      })
    } else {
      set(state => {
        const fields = [...state.fields]
        if (atIndex !== undefined) fields.splice(atIndex, 0, newField)
        else fields.push(newField)
        return { fields, selectedId: newField.id, selectedFieldSectionId: null, isDirty: true }
      })
    }
  },

  removeField: (id, sectionId) => {
    if (sectionId) {
      set(state => ({
        sections: state.sections.map(sec =>
          sec.id !== sectionId ? sec : { ...sec, fields: sec.fields.filter(f => f.id !== id) }
        ),
        selectedId: state.selectedId === id ? null : state.selectedId,
        isDirty: true,
      }))
    } else {
      set(state => ({
        fields:     state.fields.filter(f => f.id !== id),
        selectedId: state.selectedId === id ? null : state.selectedId,
        isDirty:    true,
      }))
    }
  },

  updateField: (id, patch, sectionId) => {
    if (sectionId) {
      set(state => ({
        sections: state.sections.map(sec =>
          sec.id !== sectionId
            ? sec
            : { ...sec, fields: updateInList(sec.fields, id, patch) }
        ),
        isDirty: true,
      }))
    } else {
      set(state => ({
        fields:  updateInList(state.fields, id, patch),
        isDirty: true,
      }))
    }
  },

  moveField: (from, to, sectionId) => {
    if (sectionId) {
      set(state => ({
        sections: state.sections.map(sec => {
          if (sec.id !== sectionId) return sec
          const fields = [...sec.fields]
          const [moved] = fields.splice(from, 1)
          fields.splice(to, 0, moved)
          return { ...sec, fields }
        }),
        isDirty: true,
      }))
    } else {
      set(state => {
        const fields = [...state.fields]
        const [moved] = fields.splice(from, 1)
        fields.splice(to, 0, moved)
        return { fields, isDirty: true }
      })
    }
  },

  selectField: (id, sectionId) =>
    set({ selectedId: id, selectedSectionId: null, selectedFieldSectionId: sectionId ?? null }),

  setInsertIndex: (index) => set({ insertIndex: index }),

  setInsertSectionId: (sectionId) => set({ insertSectionId: sectionId }),

  insertFields: (newFields, atIndex) =>
    set(state => {
      const fields = [...state.fields]
      const pos = atIndex !== undefined && atIndex !== null ? atIndex : fields.length
      fields.splice(pos, 0, ...newFields)
      return { fields, isDirty: true }
    }),

  duplicateField: (id, sectionId) => {
    if (sectionId) {
      set(state => {
        const sec = state.sections.find(s => s.id === sectionId)
        if (!sec) return {}
        const idx = sec.fields.findIndex(f => f.id === id)
        if (idx === -1) return {}
        const copy = { ...sec.fields[idx], id: uuid() }
        return {
          sections: state.sections.map(s =>
            s.id !== sectionId ? s : {
              ...s,
              fields: [...s.fields.slice(0, idx + 1), copy, ...s.fields.slice(idx + 1)]
            }
          ),
          selectedId: copy.id,
          selectedFieldSectionId: sectionId,
          isDirty: true,
        }
      })
    } else {
      set(state => {
        const idx  = state.fields.findIndex(f => f.id === id)
        if (idx === -1) return {}
        const copy = { ...state.fields[idx], id: uuid() }
        const fields = [...state.fields]
        fields.splice(idx + 1, 0, copy)
        return { fields, selectedId: copy.id, selectedFieldSectionId: null, isDirty: true }
      })
    }
  },

  addSection: () => {
    const newSection: FormSection = {
      id:     uuid(),
      title:  'New Section',
      fields: [],
    }
    set(state => ({
      sections:          [...state.sections, newSection],
      selectedSectionId: newSection.id,
      selectedId:        null,
      isDirty:           true,
    }))
  },

  removeSection: (id) =>
    set(state => ({
      sections:          state.sections.filter(s => s.id !== id),
      selectedSectionId: state.selectedSectionId === id ? null : state.selectedSectionId,
      isDirty:           true,
    })),

  updateSection: (id, patch) =>
    set(state => ({
      sections: state.sections.map(s => s.id === id ? { ...s, ...patch } : s),
      isDirty:  true,
    })),

  moveSection: (from, to) =>
    set(state => {
      const sections = [...state.sections]
      const [moved]  = sections.splice(from, 1)
      sections.splice(to, 0, moved)
      return { sections, isDirty: true }
    }),

  duplicateSection: (id) =>
    set(state => {
      const idx = state.sections.findIndex(s => s.id === id)
      if (idx === -1) return {}
      const src  = state.sections[idx]
      const copy: FormSection = {
        ...src,
        id:     uuid(),
        title:  src.title + ' (Copy)',
        fields: src.fields.map(f => ({ ...f, id: uuid() })),
      }
      const sections = [...state.sections]
      sections.splice(idx + 1, 0, copy)
      return { sections, selectedSectionId: copy.id, isDirty: true }
    }),

  selectSection: (id) => set({ selectedSectionId: id, selectedId: null, selectedFieldSectionId: null }),

  addFieldToSection: (sectionId, type, atIndex) => {
    get().addField(type, atIndex, sectionId)
  },

  removeFieldFromSection: (sectionId, fieldId) => {
    get().removeField(fieldId, sectionId)
  },

  moveFieldInSection: (sectionId, from, to) => {
    get().moveField(from, to, sectionId)
  },

  moveFieldBetweenSections: (fieldId, fromSectionId, toSectionId, toIndex) => {
    set(state => {
      let movedField: FormField | undefined

      let newFields   = state.fields
      let newSections = state.sections

      if (fromSectionId) {
        newSections = newSections.map(sec => {
          if (sec.id !== fromSectionId) return sec
          movedField = sec.fields.find(f => f.id === fieldId)
          return { ...sec, fields: sec.fields.filter(f => f.id !== fieldId) }
        })
      } else {
        movedField = state.fields.find(f => f.id === fieldId)
        newFields  = state.fields.filter(f => f.id !== fieldId)
      }

      if (!movedField) return {}

      if (toSectionId) {
        newSections = newSections.map(sec => {
          if (sec.id !== toSectionId) return sec
          const fields = [...sec.fields]
          fields.splice(toIndex, 0, movedField!)
          return { ...sec, fields }
        })
      } else {
        const fields = [...newFields]
        fields.splice(toIndex, 0, movedField)
        newFields = fields
      }

      return { fields: newFields, sections: newSections, isDirty: true }
    })
  },

  loadSchema: (fields, settings, name, desc, sections) =>
    set({ fields, sections: sections || [], settings, formName: name, formDescription: desc, isDirty: false }),

  importSchema: (json) => {
    try {
      const parsed = JSON.parse(json)
      let fields, settings, name, description, sections

      if (parsed.schema?.fields) {
        fields      = parsed.schema.fields
        settings    = parsed.schema.settings || parsed.settings || {}
        sections    = parsed.schema.sections || []
        name        = parsed.name || 'Imported Form'
        description = parsed.description || ''
      } else if (Array.isArray(parsed.fields)) {
        fields      = parsed.fields
        settings    = parsed.settings || {}
        sections    = parsed.sections || []
        name        = parsed.name || 'Imported Form'
        description = parsed.description || ''
      } else {
        return { ok: false, error: 'Invalid JSON format. Expected { fields: [...] } or { schema: { fields: [...] } }' }
      }

      const remapped = fields.map((f: FormField) => ({
        ...f,
        id: uuid(),
        ...(f.children ? { children: f.children.map((c: FormField) => ({ ...c, id: uuid() })) } : {}),
      }))
      const remappedSections = (sections as FormSection[]).map((sec: FormSection) => ({
        ...sec,
        id:     uuid(),
        fields: sec.fields.map((f: FormField) => ({ ...f, id: uuid() })),
      }))
      set({
        fields:          remapped,
        sections:        remappedSections,
        settings:        { ...get().settings, ...settings },
        formName:        name,
        formDescription: description,
        selectedId:      null,
        isDirty:         true,
      })
      return { ok: true }
    } catch {
      return { ok: false, error: 'Invalid JSON — could not parse file' }
    }
  },

  insertSchema: (json, atIndex) => {
    try {
      const parsed = JSON.parse(json)
      let fields
      if (parsed.schema?.fields)            fields = parsed.schema.fields
      else if (Array.isArray(parsed.fields)) fields = parsed.fields
      else return { ok: false, error: 'Invalid JSON format. Expected { fields: [...] } or { schema: { fields: [...] } }' }

      const remapped: FormField[] = fields.map((f: FormField) => ({
        ...f,
        id: uuid(),
        ...(f.children ? { children: f.children.map((c: FormField) => ({ ...c, id: uuid() })) } : {}),
      }))

      const current = get().fields
      const pos = atIndex !== null && atIndex !== undefined ? atIndex : current.length
      const next = [...current]
      next.splice(pos, 0, ...remapped)
      set({ fields: next, isDirty: true })
      return { ok: true }
    } catch {
      return { ok: false, error: 'Invalid JSON — could not parse file' }
    }
  },

  exportSchema: () => {
    const { fields, sections, settings, formName, formDescription } = get()
    return JSON.stringify({
      name:        formName,
      description: formDescription,
      schema: { fields, sections, settings },
    }, null, 2)
  },

  clearDirty: () => set({ isDirty: false }),

  rebalanceRow: (rowId, sectionId) => {
    // Find all fields with this rowId and set equal widths
    set(state => {
      const autoW = (n: number): FormField['width'] =>
        n >= 4 ? 'col4' : n === 3 ? 'col3' : n === 2 ? 'col2' : 'col1'

      if (sectionId) {
        return {
          sections: state.sections.map(sec => {
            if (sec.id !== sectionId) return sec
            const rowMembers = sec.fields.filter(f => f.rowId === rowId)
            if (rowMembers.length === 0) return sec
            const w = autoW(rowMembers.length)
            return {
              ...sec,
              fields: sec.fields.map(f =>
                f.rowId === rowId ? { ...f, width: w } : f
              ),
            }
          }),
          isDirty: true,
        }
      } else {
        const rowMembers = state.fields.filter(f => f.rowId === rowId)
        if (rowMembers.length === 0) return {}
        const w = autoW(rowMembers.length)
        return {
          fields: state.fields.map(f =>
            f.rowId === rowId ? { ...f, width: w } : f
          ),
          isDirty: true,
        }
      }
    })
  },

  removeFieldFromRow: (fieldId, sectionId) => {
    // Strip rowId from a field; then rebalance remaining row members
    set(state => {
      let targetRowId: string | undefined

      const processFields = (fields: FormField[]): FormField[] =>
        fields.map(f => {
          if (f.id === fieldId) {
            targetRowId = f.rowId
            return { ...f, rowId: undefined, width: 'col1' }
          }
          return f
        })

      let newFields = state.fields
      let newSections = state.sections

      if (sectionId) {
        newSections = state.sections.map(sec =>
          sec.id !== sectionId ? sec : { ...sec, fields: processFields(sec.fields) }
        )
      } else {
        newFields = processFields(state.fields)
      }

      // Now rebalance remaining members of that row
      if (targetRowId) {
        const rowId = targetRowId
        const autoW = (n: number): FormField['width'] =>
          n >= 4 ? 'col4' : n === 3 ? 'col3' : n === 2 ? 'col2' : 'col1'

        if (sectionId) {
          newSections = newSections.map(sec => {
            if (sec.id !== sectionId) return sec
            const remaining = sec.fields.filter(f => f.rowId === rowId)
            if (remaining.length === 0) return sec
            if (remaining.length === 1) {
              // Only 1 left — dissolve the row entirely
              return { ...sec, fields: sec.fields.map(f => f.rowId === rowId ? { ...f, rowId: undefined, width: 'col1' } : f) }
            }
            const w = autoW(remaining.length)
            return { ...sec, fields: sec.fields.map(f => f.rowId === rowId ? { ...f, width: w } : f) }
          })
        } else {
          const remaining = newFields.filter(f => f.rowId === rowId)
          if (remaining.length === 1) {
            newFields = newFields.map(f => f.rowId === rowId ? { ...f, rowId: undefined, width: 'col1' } : f)
          } else if (remaining.length > 1) {
            const w = autoW(remaining.length)
            newFields = newFields.map(f => f.rowId === rowId ? { ...f, width: w } : f)
          }
        }
      }

      return { fields: newFields, sections: newSections, isDirty: true }
    })
  },

}))