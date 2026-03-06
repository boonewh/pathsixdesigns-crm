import { z } from "zod";

export const subscriptionCreateSchema = z.object({
  plan_name: z.string().min(1, "Plan name is required").max(255),
  price: z.coerce.number().min(0, "Price must be 0 or greater"),
  billing_cycle: z.enum(["monthly", "yearly"], {
    errorMap: () => ({ message: "Select a billing cycle" }),
  }),
  start_date: z.string().min(1, "Start date is required"),
  renewal_date: z
    .string()
    .optional()
    .transform((val) => (val && val.trim() !== "" ? val : undefined)),
  status: z.enum(["active", "paused", "cancelled"]).default("active"),
  notes: z.string().optional(),
});

export const subscriptionUpdateSchema = z.object({
  plan_name: z.string().min(1).max(255).optional(),
  price: z.coerce.number().min(0).optional(),
  billing_cycle: z.enum(["monthly", "yearly"]).optional(),
  start_date: z.string().optional(),
  renewal_date: z
    .string()
    .optional()
    .transform((val) => (val && val.trim() !== "" ? val : undefined)),
  status: z.enum(["active", "paused", "cancelled"]).optional(),
  notes: z.string().optional(),
});

export type SubscriptionCreateInput = z.infer<typeof subscriptionCreateSchema>;
export type SubscriptionUpdateInput = z.infer<typeof subscriptionUpdateSchema>;

export interface Subscription {
  id: number;
  tenant_id: number;
  client_id: number;
  client_name: string | null;
  plan_name: string;
  price: number;
  billing_cycle: "monthly" | "yearly";
  start_date: string;
  renewal_date: string | null;
  status: "active" | "paused" | "cancelled";
  notes: string | null;
  created_at: string;
  cancelled_at: string | null;
}
