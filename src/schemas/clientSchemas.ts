import { z } from 'zod'

// Match the backend TYPE_OPTIONS and PHONE_LABELS
export const CLIENT_TYPES = [
  'None', 
  'Retail', 
  'Wholesale', 
  'Services', 
  'Manufacturing', 
  'Construction', 
  'Real Estate', 
  'Healthcare', 
  'Technology', 
  'Education', 
  'Finance & Insurance', 
  'Hospitality', 
  'Transportation & Logistics', 
  'Non-Profit', 
  'Government', 
  'Other'
] as const

const PHONE_LABELS = ['work', 'mobile', 'home', 'fax', 'other'] as const
const CLIENT_STATUSES = ['prospect', 'active', 'inactive', 'cancelled'] as const

// Client Create Schema (POST /api/clients)
export const clientCreateSchema = z.object({
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
  type: z.enum(CLIENT_TYPES).default('None'),
  status: z.enum(CLIENT_STATUSES).default('prospect')
})

// Client Update Schema (PUT /api/clients/{id})
export const clientUpdateSchema = z.object({
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
  type: z.enum(CLIENT_TYPES).optional(),
  status: z.enum(CLIENT_STATUSES).optional()
})

// Client Assignment Schema (PUT /api/clients/{id}/assign)
export const clientAssignSchema = z.object({
  assigned_to: z.number().positive('User ID must be a positive number')
})

// TypeScript types
export type ClientCreateInput = z.infer<typeof clientCreateSchema>
export type ClientUpdateInput = z.infer<typeof clientUpdateSchema>
export type ClientAssignInput = z.infer<typeof clientAssignSchema>