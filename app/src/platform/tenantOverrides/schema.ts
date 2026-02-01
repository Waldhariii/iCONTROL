import { z } from "zod";

export const TenantOverridesSchemaV1 = z.object({
  schemaVersion: z.literal(1),
  updatedAt: z.string().min(10),
  updatedBy: z.string().optional(),
  theme: z.record(z.string(), z.record(z.string(), z.any())).optional(),
  features: z.record(z.boolean()).optional(),
});

export type TenantOverridesV1 = z.infer<typeof TenantOverridesSchemaV1>;
