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

// Lead Create Schema (POST /api/leads)
// Built lazily to avoid circular dependency at module load time
export const getLeadCreateSchema = () => z.object({
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
  type: z.enum(getTypeOptions()).default('None'),
  lead_status: z.enum(getLeadStatuses()).default('new'),
  lead_source: z.enum(getLeadSourceOptions()).optional().nullable()
})

// Lead Update Schema (PUT /api/leads/{id})
export const getLeadUpdateSchema = () => z.object({
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
