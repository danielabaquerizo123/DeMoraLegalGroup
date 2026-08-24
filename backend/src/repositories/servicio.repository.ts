import { prisma } from "../config/prisma";

const servicioInclude = {
  profesionales: {
    orderBy: [{ esPrincipal: "desc" as const }, { orden: "asc" as const }],
    include: { profesional: true },
  },
};

export const servicioRepository = {
  findActiveAll() {
    return prisma.servicio.findMany({
      where: { activo: true },
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    });
  },

  findActiveBySlug(slug: string) {
    return prisma.servicio.findFirst({
      where: { slug, activo: true },
      include: servicioInclude,
    });
  },
};
