CREATE TYPE "tamano_titulo_blog" AS ENUM ('PEQUENO', 'NORMAL', 'GRANDE');

CREATE TYPE "alineacion_titulo_blog" AS ENUM ('IZQUIERDA', 'CENTRO', 'DERECHA');

CREATE TYPE "tamano_extracto_blog" AS ENUM ('COMPACTO', 'NORMAL', 'AMPLIO');

CREATE TYPE "alineacion_extracto_blog" AS ENUM ('IZQUIERDA', 'CENTRO', 'DERECHA', 'JUSTIFICADO');

ALTER TABLE "articulo_blog"
  ADD COLUMN "titulo_tamano" "tamano_titulo_blog" NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN "titulo_alineacion" "alineacion_titulo_blog" NOT NULL DEFAULT 'IZQUIERDA',
  ADD COLUMN "extracto_tamano" "tamano_extracto_blog" NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN "extracto_alineacion" "alineacion_extracto_blog" NOT NULL DEFAULT 'IZQUIERDA',
  ADD COLUMN "titulo_html" TEXT,
  ADD COLUMN "extracto_html" TEXT,
  ADD COLUMN "comentarios_habilitados" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "comentario_blog" (
  "id" UUID NOT NULL,
  "id_articulo" UUID NOT NULL,
  "id_comentario_padre" UUID,
  "nombre_visitante" VARCHAR(80),
  "id_usuario_admin" UUID,
  "contenido" VARCHAR(500) NOT NULL,
  "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "comentario_blog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "comentario_blog"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

CREATE INDEX "comentario_blog_id_articulo_id_comentario_padre_creado_en_idx"
  ON "comentario_blog"("id_articulo", "id_comentario_padre", "creado_en");

CREATE INDEX "comentario_blog_id_usuario_admin_idx"
  ON "comentario_blog"("id_usuario_admin");

ALTER TABLE "comentario_blog"
  ADD CONSTRAINT "comentario_blog_id_articulo_fkey"
  FOREIGN KEY ("id_articulo") REFERENCES "articulo_blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comentario_blog"
  ADD CONSTRAINT "comentario_blog_id_comentario_padre_fkey"
  FOREIGN KEY ("id_comentario_padre") REFERENCES "comentario_blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comentario_blog"
  ADD CONSTRAINT "comentario_blog_id_usuario_admin_fkey"
  FOREIGN KEY ("id_usuario_admin") REFERENCES "usuario_admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
