import { z } from 'zod'
import { getStoredConfig } from '@/config/crmConfig'

// Client types - loaded lazily from tenant config (businessTypes)
export const getClientTypes = () => getStoredConfig().businessTypes as unknown as readonly [string, ...string[]]

const PHONE_LABELS = ['work', 'mobile', 'home', 'fax', 'other'] as const
export const CLIENT_STATUSES = ['new', 'prospect', 'active', 'inactive'] as const

// Client Create Schema (POST /api/clients)
// Built lazily to avoid circular dependency at module load time
export const getClientCreateSchema = () => z.object({
  // Required field
  name: z.string().min(1, 'Company name is required').max(100),

  // Optional fields
  contact_person: z.string().max(100).optional(),
  contact_title: z.string().max(100).optional(),
  email: z.string().email('Invalid email format').max(255).optional(),
  phone: z.string().max(20).optional(),
  phone_label: z.enum(PHONE_LABELS).default('work'),
  secondary_phone: z.string().max(20).optional(),
  secondary_phone_label: z.enum(PHONE_LABELS).optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zip: z.string().max(20).optional(),
  notes: z.string().optional(),
  type: z.enum(getClientTypes()).default('None'),
  status: z.enum(CLIENT_STATUSES).default('new')
})

// Client Update Schema (PUT /api/clients/{id})
export const getClientUpdateSchema = () => z.object({
  name: z.string().min(1).max(100).optional(),
  contact_person: z.string().max(100).optional(),
  contact_title: z.string().max(100).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(20).optional(),
  phone_label: z.enum(PHONE_LABELS).optional(),
  secondary_phone: z.string().max(20).optional(),
  secondary_phone_label: z.enum(PHONE_LABELS).optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zip: z.string().max(20).optional(),
  notes: z.string().optional(),
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
