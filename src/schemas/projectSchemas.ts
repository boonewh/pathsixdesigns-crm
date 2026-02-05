import { z } from 'zod'
import { getStoredConfig } from '@/config/crmConfig'

// Project types - loaded lazily from tenant config (businessTypes)
export const getProjectTypes = () => getStoredConfig().businessTypes as unknown as readonly [string, ...string[]]
export const PROJECT_STATUSES = ['active', 'pending', 'completed', 'cancelled'] as const
const PHONE_LABELS = ['work', 'mobile', 'home', 'fax', 'other'] as const

// Helper: Transform empty strings to undefined (for optional fields)
const emptyToUndefined = (val: unknown) => (val === '' ? undefined : val)

// Helper: Optional string that treats empty strings as undefined
const optionalString = (maxLength?: number) => {
  const base = z.preprocess(emptyToUndefined, z.string().optional())
  return maxLength ? z.preprocess(emptyToUndefined, z.string().max(maxLength).optional()) : base
}

// Helper: Optional email that treats empty strings as undefined
const optionalEmail = () => z.preprocess(
  emptyToUndefined,
  z.string().email('Invalid email format').max(255).optional()
)

// Project Create Schema (POST /api/projects)
// Built lazily to avoid circular dependency at module load time
export const getProjectCreateSchema = () => z.object({
  // Required fields
  project_name: z.string().min(1, 'Project name is required').max(100),

  // Optional fields
  type: z.enum(getProjectTypes()).default('None'),
  project_description: optionalString(),
  project_status: z.enum(PROJECT_STATUSES).default('active'),
  project_start: optionalString(), // ISO date string
  project_end: optionalString(), // ISO date string
  project_worth: z.number().optional(),
  client_id: z.number().optional(),
  lead_id: z.number().optional(),
  notes: optionalString(),

  // Standalone project contact fields
  primary_contact_name: optionalString(100),
  primary_contact_title: optionalString(100),
  primary_contact_email: optionalEmail(),
  primary_contact_phone: optionalString(20),
  primary_contact_phone_label: z.enum(PHONE_LABELS).optional(),
})

// Project Update Schema (PUT /api/projects/{id})
export const getProjectUpdateSchema = () => z.object({
  project_name: z.preprocess(emptyToUndefined, z.string().min(1).max(100).optional()),
  type: z.enum(getProjectTypes()).optional(),
  project_description: optionalString(),
  project_status: z.enum(PROJECT_STATUSES).optional(),
  project_start: optionalString(),
  project_end: optionalString(),
  project_worth: z.number().optional(),
  client_id: z.number().optional(),
  lead_id: z.number().optional(),
  notes: optionalString(),

  // Standalone project contact fields
  primary_contact_name: optionalString(100),
  primary_contact_title: optionalString(100),
  primary_contact_email: optionalEmail(),
  primary_contact_phone: optionalString(20),
  primary_contact_phone_label: z.enum(PHONE_LABELS).optional(),
})

// Project Assignment Schema (PUT /api/projects/{id}/assign)
export const projectAssignSchema = z.object({
  assigned_to: z.number().positive('User ID must be a positive number')
})

// TypeScript types
export type ProjectCreateInput = z.infer<ReturnType<typeof getProjectCreateSchema>>
export type ProjectUpdateInput = z.infer<ReturnType<typeof getProjectUpdateSchema>>
export type ProjectAssignInput = z.infer<typeof projectAssignSchema>
