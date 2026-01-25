import { z } from 'zod'
import { ACTIVE_CONFIG } from '@/config/crmConfig'

// Phone label options (must match backend PHONE_LABELS)
export const phoneLabels = ['work', 'mobile', 'home', 'fax', 'other'] as const

// Lead status options - loaded from active config
// Cast to tuple type for Zod enum compatibility
export const leadStatuses = ACTIVE_CONFIG.leads.statuses as unknown as readonly [string, ...string[]]

// Type options - loaded from active config (businessTypes)
export const typeOptions = ACTIVE_CONFIG.businessTypes as unknown as readonly [string, ...string[]]

// Lead source options - loaded from active config
export const leadSourceOptions = ACTIVE_CONFIG.leads.sources as unknown as readonly [string, ...string[]]

// Lead Create Schema (POST /api/leads)
export const leadCreateSchema = z.object({
  // Required fields
  name: z.string().min(1, "Company name is required").max(100),

  // Optional fields
  contact_person: z.string().max(100).optional().nullable(),
  contact_title: z.string().max(100).optional().nullable(),
  email: z.string().email().max(255).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  phone_label: z.enum(phoneLabels).default('work'),
  secondary_phone: z.string().max(20).optional().nullable(),
  secondary_phone_label: z.enum(phoneLabels).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  zip: z.string().max(20).optional().nullable(),
  notes: z.string().optional().nullable(),
  type: z.enum(typeOptions).default('None'),
  lead_status: z.enum(leadStatuses).default('new'),
  lead_source: z.enum(leadSourceOptions).optional().nullable()
})

// Lead Update Schema (PUT /api/leads/{id})
export const leadUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  contact_person: z.string().max(100).optional().nullable(),
  contact_title: z.string().max(100).optional().nullable(),
  email: z.string().email().max(255).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  phone_label: z.enum(phoneLabels).optional(),
  secondary_phone: z.string().max(20).optional().nullable(),
  secondary_phone_label: z.enum(phoneLabels).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  zip: z.string().max(20).optional().nullable(),
  notes: z.string().optional().nullable(),
  type: z.enum(typeOptions).optional(),
  lead_status: z.enum(leadStatuses).optional(),
  lead_source: z.enum(leadSourceOptions).optional().nullable()
})

// Lead Assign Schema (PUT /api/leads/{id}/assign)
export const leadAssignSchema = z.object({
  assigned_to: z.number().int().positive()
})

// Type exports for TypeScript
export type LeadCreateInput = z.infer<typeof leadCreateSchema>
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>
export type LeadAssignInput = z.infer<typeof leadAssignSchema>