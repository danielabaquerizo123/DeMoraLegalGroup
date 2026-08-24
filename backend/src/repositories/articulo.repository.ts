import { EstadoPublicacion } from "../generated/prisma/enums";
import { prisma } from "../config/prisma";

export type ArticuloFilters = {
  categoria?: string;
  servicio?: string;
  etiqueta?: string;
};

const articuloListInclude = {
  categoria: true,
  autorProfesional: true,
  autores: {
    orderBy: [{ esPrincipal: "desc" as const }, { orden: "asc" as const }],
    include: { profesional: true },
  },
};

const articuloDetailInclude = {
  categoria: true,
  autorProfesional: true,
  autores: {
    orderBy: [{ esPrincipal: "desc" as const }, { orden: "asc" as const }],
    include: { profesional: true },
  },
  servicios: {
    include: { servicio: true },
  },
  etiquetas: {
    include: { etiqueta: true },
  },
};

const buildPublishedWhere = (filters: ArticuloFilters) => ({
  estado: EstadoPublicacion.PUBLICADO,
  publicadoEn: { not: null },
  ...(filters.categoria ? { categoria: { slug: filters.categoria, activa: true } } : {}),
  ...(filters.servicio ? { servicios: { some: { servicio: { slug: filters.servicio, activo: true } } } } : {}),
  ...(filters.etiqueta ? { etiquetas: { some: { etiqueta: { slug: filters.etiqueta, activa: true } } } } : {}),
});

export const articuloRepository = {
  async findPublished(params: { page: number; limit: number; filters: ArticuloFilters }) {
    const where = buildPublishedWhere(params.filters);
    const skip = (params.page - 1) * params.limit;

    const [data, total] = await prisma.$transaction([
      prisma.articuloBlog.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { publicadoEn: "desc" },
        include: articuloListInclude,
      }),
      prisma.articuloBlog.count({ where }),
    ]);

    return { data, total };
  },

  findPublishedBySlug(slug: string) {
    return prisma.articuloBlog.findFirst({
      where: {
        slug,
        estado: EstadoPublicacion.PUBLICADO,
        publicadoEn: { not: null },
      },
      include: articuloDetailInclude,
    });
  },
};
