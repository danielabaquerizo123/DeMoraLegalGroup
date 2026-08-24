import { z } from "zod";

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(280)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const slugParamSchema = z.object({
  slug: slugSchema,
});
