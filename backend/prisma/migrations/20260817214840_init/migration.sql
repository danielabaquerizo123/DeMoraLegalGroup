-- CreateEnum
CREATE TYPE "estado_publicacion" AS ENUM ('BORRADOR', 'PUBLICADO', 'ARCHIVADO');

-- CreateEnum
CREATE TYPE "tipo_canal_contacto" AS ENUM ('WHATSAPP', 'EMAIL', 'TELEFONO', 'LINKEDIN', 'INSTAGRAM', 'FACEBOOK', 'YOUTUBE', 'SITIO_WEB');

-- CreateTable
CREATE TABLE "profesional" (
    "id" UUID NOT NULL,
    "nombres" VARCHAR(100) NOT NULL,
    "apellidos" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "cargo" VARCHAR(150),
    "especialidad_resumen" VARCHAR(250),
    "biografia" TEXT,
    "foto_url" VARCHAR(500),
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "meta_titulo" VARCHAR(200),
    "meta_descripcion" VARCHAR(320),
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "profesional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sede" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "ciudad" VARCHAR(100) NOT NULL,
    "provincia" VARCHAR(100),
    "direccion" VARCHAR(300),
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sede_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profesional_sede" (
    "id_profesional" UUID NOT NULL,
    "id_sede" UUID NOT NULL,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profesional_sede_pkey" PRIMARY KEY ("id_profesional","id_sede")
);

-- CreateTable
CREATE TABLE "canal_contacto_profesional" (
    "id" UUID NOT NULL,
    "id_profesional" UUID NOT NULL,
    "tipo" "tipo_canal_contacto" NOT NULL,
    "etiqueta" VARCHAR(100),
    "valor" VARCHAR(255) NOT NULL,
    "url" VARCHAR(500),
    "es_principal" BOOLEAN NOT NULL DEFAULT false,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "canal_contacto_profesional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicio" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "resumen" VARCHAR(350),
    "descripcion" TEXT,
    "icono" VARCHAR(150),
    "imagen_url" VARCHAR(500),
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "meta_titulo" VARCHAR(200),
    "meta_descripcion" VARCHAR(320),
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profesional_servicio" (
    "id_profesional" UUID NOT NULL,
    "id_servicio" UUID NOT NULL,
    "es_principal" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profesional_servicio_pkey" PRIMARY KEY ("id_profesional","id_servicio")
);

-- CreateTable
CREATE TABLE "categoria_blog" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "categoria_blog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articulo_blog" (
    "id" UUID NOT NULL,
    "titulo" VARCHAR(250) NOT NULL,
    "slug" VARCHAR(280) NOT NULL,
    "extracto" VARCHAR(500),
    "contenido" TEXT NOT NULL,
    "imagen_portada_url" VARCHAR(500),
    "estado" "estado_publicacion" NOT NULL DEFAULT 'BORRADOR',
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "publicado_en" TIMESTAMPTZ(3),
    "id_categoria" UUID NOT NULL,
    "meta_titulo" VARCHAR(200),
    "meta_descripcion" VARCHAR(320),
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "articulo_blog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articulo_autor" (
    "id_articulo" UUID NOT NULL,
    "id_profesional" UUID NOT NULL,
    "es_principal" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "articulo_autor_pkey" PRIMARY KEY ("id_articulo","id_profesional")
);

-- CreateTable
CREATE TABLE "articulo_servicio" (
    "id_articulo" UUID NOT NULL,
    "id_servicio" UUID NOT NULL,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "articulo_servicio_pkey" PRIMARY KEY ("id_articulo","id_servicio")
);

-- CreateTable
CREATE TABLE "etiqueta_blog" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(130) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "etiqueta_blog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articulo_etiqueta" (
    "id_articulo" UUID NOT NULL,
    "id_etiqueta" UUID NOT NULL,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "articulo_etiqueta_pkey" PRIMARY KEY ("id_articulo","id_etiqueta")
);

-- CreateTable
CREATE TABLE "configuracion_sitio" (
    "id" UUID NOT NULL,
    "clave" VARCHAR(150) NOT NULL,
    "valor" JSONB NOT NULL,
    "descripcion" VARCHAR(500),
    "publica" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "configuracion_sitio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profesional_slug_key" ON "profesional"("slug");

-- CreateIndex
CREATE INDEX "profesional_activo_orden_idx" ON "profesional"("activo", "orden");

-- CreateIndex
CREATE INDEX "profesional_destacado_activo_idx" ON "profesional"("destacado", "activo");

-- CreateIndex
CREATE INDEX "sede_activa_orden_idx" ON "sede"("activa", "orden");

-- CreateIndex
CREATE INDEX "sede_ciudad_activa_idx" ON "sede"("ciudad", "activa");

-- CreateIndex
CREATE INDEX "profesional_sede_id_sede_idx" ON "profesional_sede"("id_sede");

-- CreateIndex
CREATE INDEX "profesional_sede_id_profesional_principal_idx" ON "profesional_sede"("id_profesional", "principal");

-- CreateIndex
CREATE INDEX "canal_contacto_profesional_id_profesional_visible_orden_idx" ON "canal_contacto_profesional"("id_profesional", "visible", "orden");

-- CreateIndex
CREATE INDEX "canal_contacto_profesional_tipo_visible_idx" ON "canal_contacto_profesional"("tipo", "visible");

-- CreateIndex
CREATE UNIQUE INDEX "uq_contacto_profesional_tipo_valor" ON "canal_contacto_profesional"("id_profesional", "tipo", "valor");

-- CreateIndex
CREATE UNIQUE INDEX "servicio_slug_key" ON "servicio"("slug");

-- CreateIndex
CREATE INDEX "servicio_activo_orden_idx" ON "servicio"("activo", "orden");

-- CreateIndex
CREATE INDEX "servicio_destacado_activo_idx" ON "servicio"("destacado", "activo");

-- CreateIndex
CREATE INDEX "profesional_servicio_id_servicio_idx" ON "profesional_servicio"("id_servicio");

-- CreateIndex
CREATE INDEX "profesional_servicio_id_profesional_es_principal_idx" ON "profesional_servicio"("id_profesional", "es_principal");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_blog_slug_key" ON "categoria_blog"("slug");

-- CreateIndex
CREATE INDEX "categoria_blog_activa_orden_idx" ON "categoria_blog"("activa", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "articulo_blog_slug_key" ON "articulo_blog"("slug");

-- CreateIndex
CREATE INDEX "articulo_blog_estado_publicado_en_idx" ON "articulo_blog"("estado", "publicado_en" DESC);

-- CreateIndex
CREATE INDEX "articulo_blog_id_categoria_estado_publicado_en_idx" ON "articulo_blog"("id_categoria", "estado", "publicado_en" DESC);

-- CreateIndex
CREATE INDEX "articulo_blog_destacado_estado_idx" ON "articulo_blog"("destacado", "estado");

-- CreateIndex
CREATE INDEX "articulo_autor_id_profesional_idx" ON "articulo_autor"("id_profesional");

-- CreateIndex
CREATE INDEX "articulo_autor_id_articulo_orden_idx" ON "articulo_autor"("id_articulo", "orden");

-- CreateIndex
CREATE INDEX "articulo_servicio_id_servicio_idx" ON "articulo_servicio"("id_servicio");

-- CreateIndex
CREATE UNIQUE INDEX "etiqueta_blog_slug_key" ON "etiqueta_blog"("slug");

-- CreateIndex
CREATE INDEX "etiqueta_blog_activa_idx" ON "etiqueta_blog"("activa");

-- CreateIndex
CREATE INDEX "articulo_etiqueta_id_etiqueta_idx" ON "articulo_etiqueta"("id_etiqueta");

-- CreateIndex
CREATE UNIQUE INDEX "configuracion_sitio_clave_key" ON "configuracion_sitio"("clave");

-- CreateIndex
CREATE INDEX "configuracion_sitio_publica_idx" ON "configuracion_sitio"("publica");

-- AddForeignKey
ALTER TABLE "profesional_sede" ADD CONSTRAINT "profesional_sede_id_profesional_fkey" FOREIGN KEY ("id_profesional") REFERENCES "profesional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profesional_sede" ADD CONSTRAINT "profesional_sede_id_sede_fkey" FOREIGN KEY ("id_sede") REFERENCES "sede"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canal_contacto_profesional" ADD CONSTRAINT "canal_contacto_profesional_id_profesional_fkey" FOREIGN KEY ("id_profesional") REFERENCES "profesional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profesional_servicio" ADD CONSTRAINT "profesional_servicio_id_profesional_fkey" FOREIGN KEY ("id_profesional") REFERENCES "profesional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profesional_servicio" ADD CONSTRAINT "profesional_servicio_id_servicio_fkey" FOREIGN KEY ("id_servicio") REFERENCES "servicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articulo_blog" ADD CONSTRAINT "articulo_blog_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categoria_blog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articulo_autor" ADD CONSTRAINT "articulo_autor_id_articulo_fkey" FOREIGN KEY ("id_articulo") REFERENCES "articulo_blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articulo_autor" ADD CONSTRAINT "articulo_autor_id_profesional_fkey" FOREIGN KEY ("id_profesional") REFERENCES "profesional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articulo_servicio" ADD CONSTRAINT "articulo_servicio_id_articulo_fkey" FOREIGN KEY ("id_articulo") REFERENCES "articulo_blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articulo_servicio" ADD CONSTRAINT "articulo_servicio_id_servicio_fkey" FOREIGN KEY ("id_servicio") REFERENCES "servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articulo_etiqueta" ADD CONSTRAINT "articulo_etiqueta_id_articulo_fkey" FOREIGN KEY ("id_articulo") REFERENCES "articulo_blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articulo_etiqueta" ADD CONSTRAINT "articulo_etiqueta_id_etiqueta_fkey" FOREIGN KEY ("id_etiqueta") REFERENCES "etiqueta_blog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddCheckConstraint
ALTER TABLE "articulo_blog" ADD CONSTRAINT "chk_articulo_publicado_fecha" CHECK ("estado" <> 'PUBLICADO' OR "publicado_en" IS NOT NULL);

-- AddPartialUniqueIndex
CREATE UNIQUE INDEX "uq_profesional_sede_principal" ON "profesional_sede"("id_profesional") WHERE "principal" = true;

-- AddPartialUniqueIndex
CREATE UNIQUE INDEX "uq_profesional_servicio_principal" ON "profesional_servicio"("id_profesional") WHERE "es_principal" = true;

-- AddPartialUniqueIndex
CREATE UNIQUE INDEX "uq_articulo_autor_principal" ON "articulo_autor"("id_articulo") WHERE "es_principal" = true;

-- AddPartialUniqueIndex
CREATE UNIQUE INDEX "uq_contacto_profesional_tipo_principal" ON "canal_contacto_profesional"("id_profesional", "tipo") WHERE "es_principal" = true;

-- AddCaseInsensitiveSlugUniqueIndex
CREATE UNIQUE INDEX "uq_profesional_slug_lower" ON "profesional"(LOWER("slug"));

-- AddCaseInsensitiveSlugUniqueIndex
CREATE UNIQUE INDEX "uq_servicio_slug_lower" ON "servicio"(LOWER("slug"));

-- AddCaseInsensitiveSlugUniqueIndex
CREATE UNIQUE INDEX "uq_categoria_blog_slug_lower" ON "categoria_blog"(LOWER("slug"));

-- AddCaseInsensitiveSlugUniqueIndex
CREATE UNIQUE INDEX "uq_articulo_blog_slug_lower" ON "articulo_blog"(LOWER("slug"));

-- AddCaseInsensitiveSlugUniqueIndex
CREATE UNIQUE INDEX "uq_etiqueta_blog_slug_lower" ON "etiqueta_blog"(LOWER("slug"));
