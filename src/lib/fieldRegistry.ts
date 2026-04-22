import {
  MousePointerClick, Layers, CheckSquare, Calendar,
  Radio, Circle, ChevronDown, ToggleLeft, Type, Upload,
  List, ListOrdered, HelpCircle, AlignLeft,
  Loader, Minus,
  Square, Layout, Monitor, Columns,
  CreditCard,
  Navigation, Link,
  Tag, FileText,
  Code, Box, TestTube,
  RefreshCw,
  Maximize2,
  Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
  AlignJustify, SeparatorHorizontal, Quote, ListOrdered as OL, List as UL, Captions,
  Table,
} from 'lucide-react'
import { FieldType } from '@/types'

export interface FieldMeta {
  type:     FieldType
  label:    string
  icon:     any
  category: 'inputs' | 'data_display' | 'feedback' | 'layout' | 'surfaces' | 'navigation' | 'form' | 'templates' | 'structure' | 'modal' | 'typography'
  color:    string
}

export const FIELD_REGISTRY: FieldMeta[] = [
  // Inputs
  { type: 'button',             label: 'Button',             icon: MousePointerClick, category: 'inputs',       color: '#6366f1' },
  { type: 'button_group',       label: 'Button group',       icon: Layers,            category: 'inputs',       color: '#6366f1' },
  { type: 'checkbox',           label: 'Checkbox',           icon: CheckSquare,       category: 'inputs',       color: '#6366f1' },
  { type: 'date_picker',        label: 'Date picker',        icon: Calendar,          category: 'inputs',       color: '#6366f1' },
  { type: 'radio_group',        label: 'Radio group',        icon: Radio,             category: 'inputs',       color: '#6366f1' },
  { type: 'radio_item',         label: 'Radio item',         icon: Circle,            category: 'inputs',       color: '#6366f1' },
  { type: 'select',             label: 'Select',             icon: ChevronDown,       category: 'inputs',       color: '#6366f1' },
  { type: 'switch',             label: 'Switch',             icon: ToggleLeft,        category: 'inputs',       color: '#6366f1' },
  { type: 'text_field',         label: 'Text field',         icon: Type,              category: 'inputs',       color: '#6366f1' },
  { type: 'uploader',           label: 'Uploader',           icon: Upload,            category: 'inputs',       color: '#6366f1' },

  // Data display
  { type: 'list',               label: 'List',               icon: List,              category: 'data_display', color: '#8b5cf6' },
  { type: 'list_item',          label: 'List item',          icon: ListOrdered,       category: 'data_display', color: '#8b5cf6' },
  { type: 'tooltip',            label: 'Tooltip',            icon: HelpCircle,        category: 'data_display', color: '#8b5cf6' },
  { type: 'typography',         label: 'Typography',         icon: AlignLeft,         category: 'data_display', color: '#8b5cf6' },
  { type: 'table',              label: 'Table',              icon: Table,             category: 'data_display', color: '#8b5cf6' },

  // Feedback
  { type: 'circular_progress',  label: 'Circular progress',  icon: Loader,            category: 'feedback',     color: '#f59e0b' },
  { type: 'linear_progress',    label: 'Linear progress',    icon: Minus,             category: 'feedback',     color: '#f59e0b' },

  // Layout
  { type: 'box',                label: 'Box',                icon: Square,            category: 'layout',       color: '#10b981' },
  { type: 'container',          label: 'Container',          icon: Layout,            category: 'layout',       color: '#10b981' },
  { type: 'dialog_layout',      label: 'Dialog layout',      icon: Monitor,           category: 'layout',       color: '#10b981' },
  { type: 'stack',              label: 'Stack',              icon: Columns,           category: 'layout',       color: '#10b981' },

  // Surfaces
  { type: 'card',               label: 'Card',               icon: CreditCard,        category: 'surfaces',     color: '#06b6d4' },

  // Navigation
  { type: 'breadcrumbs',        label: 'Breadcrumbs',        icon: Navigation,        category: 'navigation',   color: '#64748b' },
  { type: 'link',               label: 'Link',               icon: Link,              category: 'navigation',   color: '#64748b' },

  // Form
  { type: 'form_control_label', label: 'Form control label', icon: Tag,               category: 'form',         color: '#ec4899' },
  { type: 'form_label',         label: 'Form label',         icon: FileText,          category: 'form',         color: '#ec4899' },

  // Templates
  { type: 'embedded_form',      label: 'Embedded form',      icon: Code,              category: 'templates',    color: '#f97316' },
  { type: 'slot',               label: 'Slot',               icon: Box,               category: 'templates',    color: '#f97316' },
  { type: 'test',               label: 'Test',               icon: TestTube,          category: 'templates',    color: '#f97316' },

  // Structure
  { type: 'repeater',           label: 'Repeater',           icon: RefreshCw,         category: 'structure',    color: '#84cc16' },

  // Modal
  { type: 'modal',              label: 'Modal',              icon: Maximize2,         category: 'modal',        color: '#a855f7' },

  // Typography
  { type: 'heading',            label: 'Heading',            icon: Heading1,          category: 'typography',   color: '#0ea5e9' },
  { type: 'paragraph',          label: 'Paragraph',          icon: AlignJustify,      category: 'typography',   color: '#0ea5e9' },
  { type: 'blockquote',         label: 'Blockquote',         icon: Quote,             category: 'typography',   color: '#0ea5e9' },
  { type: 'code_block',         label: 'Code block',         icon: Code,              category: 'typography',   color: '#0ea5e9' },
  { type: 'ordered_list',       label: 'Ordered list',       icon: ListOrdered,       category: 'typography',   color: '#0ea5e9' },
  { type: 'unordered_list',     label: 'Unordered list',     icon: List,              category: 'typography',   color: '#0ea5e9' },
  { type: 'divider',            label: 'Divider',            icon: SeparatorHorizontal, category: 'typography', color: '#0ea5e9' },
  { type: 'caption',            label: 'Caption',            icon: Captions,          category: 'typography',   color: '#0ea5e9' },
]

export const CATEGORIES = [
  { key: 'inputs',       label: 'Inputs' },
  { key: 'data_display', label: 'Data display' },
  { key: 'feedback',     label: 'Feedback' },
  { key: 'layout',       label: 'Layout' },
  { key: 'surfaces',     label: 'Surfaces' },
  { key: 'navigation',   label: 'Navigation' },
  { key: 'form',         label: 'Form' },
  { key: 'templates',    label: 'Templates' },
  { key: 'structure',    label: 'Structure' },
  { key: 'modal',        label: 'Modal' },
  { key: 'typography',   label: 'Typography' },
] as const

export const getFieldMeta = (type: FieldType): FieldMeta =>
  FIELD_REGISTRY.find(f => f.type === type) ?? FIELD_REGISTRY[0]