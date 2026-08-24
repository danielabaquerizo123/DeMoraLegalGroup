import { z } from "zod";
import { slugSchema } from "./slug.validator";

const firstQueryValue = (value: unknown) => (Array.isArray(value) ? value[0] : value);

const positiveIntegerFromQuery = (defaultValue: number) => z.preprocess(firstQueryValue, z.coerce.number().int().min(1).default(defaultValue));

const optionalSlugFromQuery = z.preprocess(firstQueryValue, slugSchema.optional());

export const articuloQuerySchema = z.object({
  page: positiveIntegerFromQuery(1),
  limit: positiveIntegerFromQuery(10).pipe(z.number().max(50)),
  categoria: optionalSlugFromQuery,
  servicio: optionalSlugFromQuery,
  etiqueta: optionalSlugFromQuery,
});
