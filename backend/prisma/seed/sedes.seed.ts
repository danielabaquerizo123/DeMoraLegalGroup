import type { PrismaClient, Sede } from "../../src/generated/prisma/client";

const sedes = [
  {
    nombre: "Guayaquil",
    ciudad: "Guayaquil",
    provincia: "Guayas",
    orden: 1,
  },
  {
    nombre: "Babahoyo",
    ciudad: "Babahoyo",
    provincia: "Los Rios",
    orden: 2,
  },
];

export const seedSedes = async (prisma: PrismaClient) => {
  const result: Record<string, Sede> = {};

  for (const sede of sedes) {
    const existing = await prisma.sede.findFirst({
      where: {
        nombre: sede.nombre,
        ciudad: sede.ciudad,
      },
    });

    const saved = existing
      ? await prisma.sede.update({
          where: { id: existing.id },
          data: {
            ...sede,
            direccion: null,
            activa: true,
          },
        })
      : await prisma.sede.create({
          data: {
            ...sede,
            direccion: null,
            activa: true,
          },
        });

    result[sede.ciudad.toLowerCase()] = saved;
  }

  return result;
};
