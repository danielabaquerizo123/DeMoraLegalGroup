-- Blog typography for titles and summaries.
-- Safe migration: additive only, default preserves current visual identity.

CREATE TYPE "tipografia_blog" AS ENUM ('INSTITUCIONAL', 'TIMES_NEW_ROMAN', 'ARIAL', 'CALIBRI', 'GEORGIA', 'GARAMOND');

ALTER TABLE "articulo_blog"
  ADD COLUMN IF NOT EXISTS "titulo_tipografia" "tipografia_blog" NOT NULL DEFAULT 'INSTITUCIONAL',
  ADD COLUMN IF NOT EXISTS "extracto_tipografia" "tipografia_blog" NOT NULL DEFAULT 'INSTITUCIONAL';
