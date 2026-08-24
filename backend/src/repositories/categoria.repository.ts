import { EstadoPublicacion } from "../generated/prisma/enums";
import { prisma } from "../config/prisma";

export const categoriaRepository = {
  findActiveAll() {
    return prisma.categoriaBlog.findMany({
      where: { activa: true },
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
      include: {
        _count: {
          select: {
            articulos: {
              where: {
                estado: EstadoPublicacion.PUBLICADO,
                publicadoEn: { not: null },
              },
            },
          },
        },
      },
    });
  },

  findActiveBySlug(slug: string) {
    return prisma.categoriaBlog.findFirst({
      where: { slug, activa: true },
      include: {
        _count: {
          select: {
            articulos: {
              where: {
                estado: EstadoPublicacion.PUBLICADO,
                publicadoEn: { not: null },
              },
            },
          },
        },
      },
    });
  },
};
