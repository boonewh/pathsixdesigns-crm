import { z } from "zod";

// Accepts any string that Date.parse can understand (local datetime without timezone)
const localDatetime = z
  .string()
  .min(1, "Date is required")
  .refine((val) => !isNaN(Date.parse(val)), "Invalid date/time");

// Optional datetime - accepts a valid datetime string or empty/undefined
const optionalDatetime = z
  .string()
  .optional()
  .transform((val) => (val && val.trim() !== "" ? val : undefined))
  .refine(
    (val) => val === undefined || !isNaN(Date.parse(val)),
    "Invalid date/time"
  );

// Interaction Create Schema (POST /api/interactions)
export const interactionCreateSchema = z.object({
  // Required fields
  contact_date: localDatetime,
  summary: z.string().min(1, "Summary is required").max(255),

  // Entity relationships (exactly one must be provided)
  client_id: z.number().positive().optional(),
  lead_id: z.number().positive().optional(),
  project_id: z.number().positive().optional(),

  // Optional fields
  outcome: z.string().max(255).optional(),
  notes: z.string().optional(),
  follow_up: optionalDatetime,
  contact_person: z.string().max(100).optional(),
  email: z.string().email("Invalid email format").max(255).optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  followup_status: z.enum(["pending", "completed", "contacted", "rescheduled"]).optional(),
});

// Interaction Update Schema (PUT /api/interactions/{id})
export const interactionUpdateSchema = z.object({
  contact_date: localDatetime.optional(),
  summary: z.string().min(1).max(255).optional(),
  client_id: z.number().positive().optional(),
  lead_id: z.number().positive().optional(),
  project_id: z.number().positive().optional(),
  outcome: z.string().max(255).optional(),
  notes: z.string().optional(),
  follow_up: optionalDatetime,
  contact_person: z.string().max(100).optional(),
  email: z.string().email().max(255).optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  followup_status: z.enum(["pending", "completed", "contacted", "rescheduled"]).optional(),
});

// TypeScript types
export type InteractionCreateInput = z.infer<typeof interactionCreateSchema>;
export type InteractionUpdateInput = z.infer<typeof interactionUpdateSchema>;