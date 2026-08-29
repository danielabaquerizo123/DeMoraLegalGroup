-- AlterTable
ALTER TABLE "servicio" ADD COLUMN     "palabras_clave" TEXT[] DEFAULT ARRAY[]::TEXT[];
