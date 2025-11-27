import { z } from 'zod'

// Match the backend PHONE_LABELS
const PHONE_LABELS = ['work', 'mobile', 'home', 'fax', 'other'] as const

// Contact Create Schema (POST /api/contacts)
export const contactCreateSchema = z.object({
  // Required field
  first_name: z.string().min(1, 'First name is required').max(100),
  
  // Entity relationships (optional but one should usually be provided)
  client_id: z.number().positive().optional(),
  lead_id: z.number().positive().optional(),
  
  // Optional fields
  last_name: z.string().max(100).optional(),
  title: z.string().max(100).optional(),
  email: z.string().email('Invalid email format').max(255).optional(),
  phone: z.string().max(20).optional(),
  phone_label: z.enum(PHONE_LABELS).default('work'),
  secondary_phone: z.string().max(20).optional(),
  secondary_phone_label: z.enum(PHONE_LABELS).optional(),
  notes: z.string().optional()
})

// Contact Update Schema (PUT /api/contacts/{id})
export const contactUpdateSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  client_id: z.number().positive().optional(),
  lead_id: z.number().positive().optional(),
  last_name: z.string().max(100).optional(),
  title: z.string().max(100).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(20).optional(),
  phone_label: z.enum(PHONE_LABELS).optional(),
  secondary_phone: z.string().max(20).optional(),
  secondary_phone_label: z.enum(PHONE_LABELS).optional(),
  notes: z.string().optional()
})

// TypeScript types
export type ContactCreateInput = z.infer<typeof contactCreateSchema>
export type ContactUpdateInput = z.infer<typeof contactUpdateSchema>