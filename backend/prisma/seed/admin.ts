import { prisma } from "../../src/config/prisma";
import { seedAdminUsers } from "./admin-users.seed";

const main = async () => {
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
