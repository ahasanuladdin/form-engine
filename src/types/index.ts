export type FieldType =
  // Inputs
  | 'button' | 'button_group' | 'checkbox' | 'date_picker'
  | 'radio_group' | 'radio_item' | 'select' | 'switch'
  | 'text_field' | 'uploader'
  // Data display
  | 'list' | 'list_item' | 'tooltip' | 'typography' | 'table'
  // Feedback
  | 'circular_progress' | 'linear_progress'
  // Layout
  | 'box' | 'container' | 'dialog_layout' | 'stack'
  // Surfaces
  | 'card'
  // Navigation
  | 'breadcrumbs' | 'link'
  // Form
  | 'form_control_label' | 'form_label'
  // Templates
  | 'embedded_form' | 'slot' | 'test'
  // Structure
  | 'repeater'
  // Modal
  | 'modal'
  // Typography (document-style text blocks)
  | 'heading' | 'paragraph' | 'divider' | 'blockquote' | 'code_block' | 'ordered_list' | 'unordered_list' | 'caption'

// col1 = 100%, col2 = 50%, col3 = 33.3%, col4 = 25%
export type FieldWidth = 'col1' | 'col2' | 'col3' | 'col4'

export interface FieldOption {
  label: string
  value: string
}

export interface FieldValidation {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string
  message?: string
}

export interface FieldStyle {
  // Wrapper
  marginTop?: string
  marginRight?: string
  marginBottom?: string
  marginLeft?: string
  paddingTop?: string
  paddingRight?: string
  paddingBottom?: string
  paddingLeft?: string
  // Label
  labelColor?: string
  labelSize?: string
  labelWeight?: string
  // Input
  inputBg?: string
  inputBorder?: string
  inputRadius?: string
  inputColor?: string
  inputSize?: string
  // Background
  wrapperBg?: string
  wrapperRadius?: string
  wrapperBorder?: string
}

export interface TableColumn {
  id: string
  header: string
  width?: string
  align?: 'left' | 'center' | 'right'
}

export interface TableRow {
  id: string
  cells: Record<string, string> // columnId -> cell value
}

export interface FormField {
  id: string
  type: FieldType
  label: string
  rowId?: string   // fields sharing the same rowId appear side-by-side in one row
  placeholder?: string
  helpText?: string
  defaultValue?: any
  options?: FieldOption[]
  validation?: FieldValidation
  width?: FieldWidth
  // type-specific
  rows?: number
  min?: number
  max?: number
  step?: number
  maxRating?: number
  content?: string   // for heading/paragraph/button label
  level?: 1 | 2 | 3 | 4 | 5 | 6  // for heading
  // button-specific
  buttonVariant?: 'primary' | 'secondary' | 'outline' | 'danger'
  buttonAction?: 'submit' | 'reset' | 'url'
  buttonUrl?: string
  buttonAlign?: 'left' | 'center' | 'right'
  style?: FieldStyle
  // box/container children
  children?: FormField[]
  // table-specific
  tableColumns?: TableColumn[]
  tableRows?: TableRow[]
  tableStriped?: boolean
  tableBordered?: boolean
  tableCompact?: boolean
  tableCaption?: string
}

export interface FormSection {
  id: string
  title: string
  description?: string
  fields: FormField[]
  collapsed?: boolean
}

export interface FormSchema {
  fields: FormField[]
  sections?: FormSection[]
  settings: FormSettings
}

export interface FormSettings {
  submitLabel?: string
  successMessage?: string
  redirectUrl?: string
  showLabels?: boolean
  // Stepper
  stepperMode?: boolean   // true = show sections as wizard steps
}

export interface Form {
  id: number
  name: string
  slug: string
  description?: string
  schema: FormSchema
  settings?: FormSettings
  is_active: boolean
  is_published: boolean
  submissions_count: number
  created_at: string
  updated_at: string
}

export interface FormSubmission {
  id: number
  form_id: number
  data: Record<string, any>
  ip_address: string
  created_at: string
}