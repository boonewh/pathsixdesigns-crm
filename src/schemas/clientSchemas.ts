import { z } from 'zod'
import { getStoredConfig } from '@/config/crmConfig'

// Client types - loaded lazily from tenant config (businessTypes)
export const getClientTypes = () => getStoredConfig().businessTypes as unknown as readonly [string, ...string[]]

const PHONE_LABELS = ['work', 'mobile', 'home', 'fax', 'other'] as const
export const CLIENT_STATUSES = ['new', 'prospect', 'active', 'inactive'] as const

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

// Client Create Schema (POST /api/clients)
// Built lazily to avoid circular dependency at module load time
export const getClientCreateSchema = () => z.object({
  // Required field
  name: z.string().min(1, 'Company name is required').max(100),

  // Optional fields
  contact_person: optionalString(100),
  contact_title: optionalString(100),
  email: optionalEmail(),
  phone: optionalString(20),
  phone_label: z.enum(PHONE_LABELS).default('work'),
  secondary_phone: optionalString(20),
  secondary_phone_label: z.enum(PHONE_LABELS).optional(),
  address: optionalString(255),
  city: optionalString(100),
  state: optionalString(100),
  zip: optionalString(20),
  notes: optionalString(),
  type: z.enum(getClientTypes()).default('None'),
  status: z.enum(CLIENT_STATUSES).default('new')
})

// Client Update Schema (PUT /api/clients/{id})
export const getClientUpdateSchema = () => z.object({
  name: z.preprocess(emptyToUndefined, z.string().min(1).max(100).optional()),
  contact_person: optionalString(100),
  contact_title: optionalString(100),
  email: optionalEmail(),
  phone: optionalString(20),
  phone_label: z.enum(PHONE_LABELS).optional(),
  secondary_phone: optionalString(20),
  secondary_phone_label: z.enum(PHONE_LABELS).optional(),
  address: optionalString(255),
  city: optionalString(100),
  state: optionalString(100),
  zip: optionalString(20),
  notes: optionalString(),
  type: z.enum(getClientTypes()).optional(),
  status: z.enum(CLIENT_STATUSES).optional()
})

// Client Assignment Schema (PUT /api/clients/{id}/assign)
export const clientAssignSchema = z.object({
  assigned_to: z.number().positive('User ID must be a positive number')
})

// TypeScript types
export type ClientCreateInput = z.infer<ReturnType<typeof getClientCreateSchema>>
export type ClientUpdateInput = z.infer<ReturnType<typeof getClientUpdateSchema>>
export type ClientAssignInput = z.infer<typeof clientAssignSchema>
