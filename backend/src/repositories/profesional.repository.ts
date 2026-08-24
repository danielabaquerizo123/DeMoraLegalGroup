import { prisma } from "../config/prisma";

const profesionalInclude = {
  contactos: {
    where: { visible: true },
    orderBy: [{ esPrincipal: "desc" as const }, { orden: "asc" as const }],
  },
  sedes: {
    orderBy: [{ principal: "desc" as const }, { orden: "asc" as const }],
    include: { sede: true },
  },
  servicios: {
    orderBy: [{ esPrincipal: "desc" as const }, { orden: "asc" as const }],
    include: { servicio: true },
  },
};

export const profesionalRepository = {
  findActiveAll() {
    return prisma.profesional.findMany({
      where: { activo: true },
      orderBy: [{ orden: "asc" }, { apellidos: "asc" }],
      include: profesionalInclude,
    });
  },

  findActiveBySlug(slug: string) {
    return prisma.profesional.findFirst({
      where: { slug, activo: true },
      include: profesionalInclude,
    });
  },
};
