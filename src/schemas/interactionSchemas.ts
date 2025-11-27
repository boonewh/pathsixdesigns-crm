import { z } from "zod";

// Interaction Create Schema (POST /api/interactions)
export const interactionCreateSchema = z.object({
  // Required fields
  contact_date: z.string().datetime("Invalid date format - use ISO datetime"),
  summary: z.string().min(1, "Summary is required").max(255),
  
  // Entity relationships (exactly one must be provided)
  client_id: z.number().positive().optional(),
  lead_id: z.number().positive().optional(),
  project_id: z.number().positive().optional(),
  
  // Optional fields
  outcome: z.string().max(255).optional(),
  notes: z.string().optional(),
  follow_up: z.string().datetime().optional(),
  contact_person: z.string().max(100).optional(),
  email: z.string().email("Invalid email format").optional(),
  phone: z.string().max(20).optional(),
});

// Interaction Update Schema (PUT /api/interactions/{id})
export const interactionUpdateSchema = z.object({
  contact_date: z.string().datetime().optional(),
  summary: z.string().min(1).max(255).optional(),
  client_id: z.number().positive().optional(),
  lead_id: z.number().positive().optional(),
  project_id: z.number().positive().optional(),
  outcome: z.string().max(255).optional(),
  notes: z.string().optional(),
  follow_up: z.string().datetime().optional(),
  contact_person: z.string().max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
});

// TypeScript types
export type InteractionCreateInput = z.infer<typeof interactionCreateSchema>;
export type InteractionUpdateInput = z.infer<typeof interactionUpdateSchema>;