-- Simplified administrative blog model.
-- Safe migration: no table drops, no column drops, no truncation and no data deletion.

ALTER TABLE "usuario_admin"
  ADD COLUMN IF NOT EXISTS "username" VARCHAR(80),
  ADD COLUMN IF NOT EXISTS "id_profesional" UUID;

UPDATE "usuario_admin"
SET "username" = lower(split_part("email", '@', 1))
WHERE "username" IS NULL AND "email" IS NOT NULL;

ALTER TABLE "usuario_admin"
  ALTER COLUMN "email" DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "usuario_admin_username_key"
  ON "usuario_admin" ("username");

CREATE INDEX IF NOT EXISTS "usuario_admin_id_profesional_idx"
  ON "usuario_admin" ("id_profesional");

ALTER TABLE "usuario_admin"
  ADD CONSTRAINT "usuario_admin_id_profesional_fkey"
  FOREIGN KEY ("id_profesional") REFERENCES "profesional"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "intento_login_admin"
  ADD COLUMN IF NOT EXISTS "username" VARCHAR(80);

CREATE INDEX IF NOT EXISTS "intento_login_admin_username_creado_en_idx"
  ON "intento_login_admin" ("username", "creado_en");

ALTER TABLE "articulo_blog"
  ADD COLUMN IF NOT EXISTS "id_autor_profesional" UUID;

ALTER TABLE "articulo_blog"
  ALTER COLUMN "id_categoria" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "articulo_blog_id_autor_profesional_estado_actualizado_en_idx"
  ON "articulo_blog" ("id_autor_profesional", "estado", "actualizado_en" DESC);

ALTER TABLE "articulo_blog"
  ADD CONSTRAINT "articulo_blog_id_autor_profesional_fkey"
  FOREIGN KEY ("id_autor_profesional") REFERENCES "profesional"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
