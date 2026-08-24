import { prisma } from "../../src/config/prisma";
import { seedAdminUsers } from "./admin-users.seed";
import { seedCategorias } from "./categorias.seed";
import { seedConfiguracion } from "./configuracion.seed";
import { seedProfesionales } from "./profesionales.seed";
import { seedSedes } from "./sedes.seed";
import { seedServicios } from "./servicios.seed";

const main = async () => {
  const sedes = await seedSedes(prisma);
  await seedServicios(prisma);
  await seedCategorias(prisma);
  await seedConfiguracion(prisma);
  await seedProfesionales(prisma, sedes);
  await seedAdminUsers(prisma);
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
