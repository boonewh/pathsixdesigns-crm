import { z } from 'zod'
import { getStoredConfig } from '@/config/crmConfig'

// Phone label options (must match backend PHONE_LABELS)
export const phoneLabels = ['work', 'mobile', 'home', 'fax', 'other'] as const

// Helper to get current config options lazily
// Uses stored tenant config if available, falls back to defaults
const getConfig = () => getStoredConfig()

// Lead status options - loaded lazily from tenant config
export const getLeadStatuses = () => getConfig().leads.statuses as unknown as readonly [string, ...string[]]

// Type options - loaded lazily from tenant config (businessTypes)
export const getTypeOptions = () => getConfig().businessTypes as unknown as readonly [string, ...string[]]

// Lead source options - loaded lazily from tenant config
export const getLeadSourceOptions = () => getConfig().leads.sources as unknown as readonly [string, ...string[]]

// Helper: Transform empty strings to undefined (for optional fields)
const emptyToUndefined = (val: unknown) => (val === '' ? undefined : val)

// Helper: Optional string that treats empty strings as undefined
const optionalString = (maxLength?: number) => {
  const base = z.preprocess(emptyToUndefined, z.string().optional().nullable())
  return maxLength ? z.preprocess(emptyToUndefined, z.string().max(maxLength).optional().nullable()) : base
}

// Helper: Optional email that treats empty strings as undefined
const optionalEmail = () => z.preprocess(
  emptyToUndefined,
  z.string().email('Invalid email format').max(255).optional().nullable()
)

// Lead Create Schema (POST /api/leads)
// Built lazily to avoid circular dependency at module load time
export const getLeadCreateSchema = () => z.object({
  // Required fields
  name: z.string().min(1, "Company name is required").max(100),

  // Optional fields
  contact_person: optionalString(100),
  contact_title: optionalString(100),
  email: optionalEmail(),
  phone: optionalString(20),
  phone_label: z.enum(phoneLabels).default('work'),
  secondary_phone: optionalString(20),
  secondary_phone_label: z.enum(phoneLabels).optional().nullable(),
  address: optionalString(255),
  city: optionalString(100),
  state: optionalString(100),
  zip: optionalString(20),
  notes: optionalString(),
  type: z.enum(getTypeOptions()).default('None'),
  lead_status: z.enum(getLeadStatuses()).default('new'),
  lead_source: z.enum(getLeadSourceOptions()).optional().nullable()
})

// Lead Update Schema (PUT /api/leads/{id})
export const getLeadUpdateSchema = () => z.object({
  name: z.preprocess(emptyToUndefined, z.string().min(1).max(100).optional()),
  contact_person: optionalString(100),
  contact_title: optionalString(100),
  email: optionalEmail(),
  phone: optionalString(20),
  phone_label: z.enum(phoneLabels).optional(),
  secondary_phone: optionalString(20),
  secondary_phone_label: z.enum(phoneLabels).optional().nullable(),
  address: optionalString(255),
  city: optionalString(100),
  state: optionalString(100),
  zip: optionalString(20),
  notes: optionalString(),
  type: z.enum(getTypeOptions()).optional(),
  lead_status: z.enum(getLeadStatuses()).optional(),
  lead_source: z.enum(getLeadSourceOptions()).optional().nullable()
})

// Lead Assign Schema (PUT /api/leads/{id}/assign)
export const leadAssignSchema = z.object({
  assigned_to: z.number().int().positive()
})

// Type exports for TypeScript
export type LeadCreateInput = z.infer<ReturnType<typeof getLeadCreateSchema>>
export type LeadUpdateInput = z.infer<ReturnType<typeof getLeadUpdateSchema>>
export type LeadAssignInput = z.infer<typeof leadAssignSchema>
