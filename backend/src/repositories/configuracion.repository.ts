import { prisma } from "../config/prisma";

export const configuracionRepository = {
  findPublicAll() {
    return prisma.configuracionSitio.findMany({
      where: { publica: true },
      orderBy: { clave: "asc" },
    });
  },
};
