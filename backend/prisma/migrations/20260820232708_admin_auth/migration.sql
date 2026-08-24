-- CreateEnum
CREATE TYPE "estado_usuario_admin" AS ENUM ('PENDIENTE', 'ACTIVO', 'BLOQUEADO');

-- CreateEnum
CREATE TYPE "tipo_token_admin" AS ENUM ('VERIFICACION_EMAIL', 'RESTABLECER_PASSWORD');

-- CreateTable
CREATE TABLE "usuario_admin" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(160) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "email_verificado" BOOLEAN NOT NULL DEFAULT false,
    "estado" "estado_usuario_admin" NOT NULL DEFAULT 'PENDIENTE',
    "ultimo_acceso_en" TIMESTAMPTZ(3),
    "bloqueado_hasta" TIMESTAMPTZ(3),
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "usuario_admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_admin" (
    "id" UUID NOT NULL,
    "id_usuario" UUID NOT NULL,
    "tipo" "tipo_token_admin" NOT NULL,
    "token_hash" VARCHAR(128) NOT NULL,
    "expira_en" TIMESTAMPTZ(3) NOT NULL,
    "usado_en" TIMESTAMPTZ(3),
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesion_admin" (
    "id" UUID NOT NULL,
    "id_usuario" UUID NOT NULL,
    "token_hash" VARCHAR(128) NOT NULL,
    "ip" VARCHAR(80),
    "user_agent" VARCHAR(500),
    "expira_en" TIMESTAMPTZ(3) NOT NULL,
    "revocada_en" TIMESTAMPTZ(3),
    "ultimo_uso_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sesion_admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intento_login_admin" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "ip" VARCHAR(80),
    "exitoso" BOOLEAN NOT NULL DEFAULT false,
    "motivo" VARCHAR(120),
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intento_login_admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_admin_email_key" ON "usuario_admin"("email");

-- CreateIndex
CREATE INDEX "usuario_admin_estado_idx" ON "usuario_admin"("estado");

-- CreateIndex
CREATE INDEX "usuario_admin_email_verificado_idx" ON "usuario_admin"("email_verificado");

-- CreateIndex
CREATE UNIQUE INDEX "token_admin_token_hash_key" ON "token_admin"("token_hash");

-- CreateIndex
CREATE INDEX "token_admin_id_usuario_tipo_idx" ON "token_admin"("id_usuario", "tipo");

-- CreateIndex
CREATE INDEX "token_admin_tipo_expira_en_idx" ON "token_admin"("tipo", "expira_en");

-- CreateIndex
CREATE UNIQUE INDEX "sesion_admin_token_hash_key" ON "sesion_admin"("token_hash");

-- CreateIndex
CREATE INDEX "sesion_admin_id_usuario_idx" ON "sesion_admin"("id_usuario");

-- CreateIndex
CREATE INDEX "sesion_admin_expira_en_idx" ON "sesion_admin"("expira_en");

-- CreateIndex
CREATE INDEX "intento_login_admin_email_creado_en_idx" ON "intento_login_admin"("email", "creado_en");

-- CreateIndex
CREATE INDEX "intento_login_admin_ip_creado_en_idx" ON "intento_login_admin"("ip", "creado_en");

-- AddForeignKey
ALTER TABLE "token_admin" ADD CONSTRAINT "token_admin_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario_admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesion_admin" ADD CONSTRAINT "sesion_admin_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario_admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
