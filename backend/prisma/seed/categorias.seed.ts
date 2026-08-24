import type { PrismaClient } from "../../src/generated/prisma/client";

const categorias = [
  {
    nombre: "Actualidad Jurídica",
    slug: "actualidad-juridica",
    descripcion: "Actualidad y novedades relevantes para el análisis jurídico.",
    orden: 1,
  },
  {
    nombre: "Análisis Legal",
    slug: "analisis-legal",
    descripcion: "Comentarios y análisis sobre temas jurídicos de interés público.",
    orden: 2,
  },
  {
    nombre: "Guías Jurídicas",
    slug: "guias-juridicas",
    descripcion: "Orientaciones generales sobre temas legales y procedimientos.",
    orden: 3,
  },
];

export const seedCategorias = async (prisma: PrismaClient) => {
  for (const categoria of categorias) {
    await prisma.categoriaBlog.upsert({
      where: { slug: categoria.slug },
      create: {
        ...categoria,
        activa: true,
      },
      update: {
        ...categoria,
        activa: true,
      },
    });
  }
};
