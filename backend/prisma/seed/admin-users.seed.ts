import { EstadoUsuarioAdmin } from "../../src/generated/prisma/enums";
import type { PrismaClient } from "../../src/generated/prisma/client";
import { hashPassword } from "../../src/services/password.service";

const adminUsers = [
  {
    username: "lia.demora",
    nombre: "Lia Margarita De Mora Campi",
    profesionalSlug: "lia-margarita-de-mora-campi",
  },
  {
    username: "maria.vargas",
    nombre: "Maria Belen Vargas Gonzalez",
    profesionalSlug: "maria-belen-vargas-gonzalez",
  },
  {
    username: "ronald.marin",
    nombre: "Ronald Ariel Marin Paredes",
    profesionalSlug: "ronald-ariel-marin-paredes",
  },
  {
    username: "paul.cepeda",
    nombre: "Paul Cepeda Chimbolema",
    profesionalSlug: "paul-cepeda-chimbolema",
  },
];

export async function seedAdminUsers(prisma: PrismaClient) {
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD ?? "DemoraLegal2026!";
  const shouldResetPasswords = process.env.ADMIN_RESET_SEED_PASSWORDS === "true";

  for (const adminUser of adminUsers) {
    const profesional = await prisma.profesional.findUnique({
      where: { slug: adminUser.profesionalSlug },
      select: { id: true },
    });

    if (!profesional) {
      throw new Error(`No se encontro el profesional ${adminUser.profesionalSlug} para crear su usuario administrador.`);
    }

    const existing = await prisma.usuarioAdmin.findUnique({
      where: { username: adminUser.username },
      select: { id: true },
    });

    const passwordHash = !existing || shouldResetPasswords ? await hashPassword(initialPassword) : undefined;

    await prisma.usuarioAdmin.upsert({
      where: { username: adminUser.username },
      create: {
        username: adminUser.username,
        nombre: adminUser.nombre,
        passwordHash: passwordHash ?? (await hashPassword(initialPassword)),
        emailVerificado: true,
        estado: EstadoUsuarioAdmin.ACTIVO,
        profesionalId: profesional.id,
      },
      update: {
        nombre: adminUser.nombre,
        estado: EstadoUsuarioAdmin.ACTIVO,
        emailVerificado: true,
        profesionalId: profesional.id,
        ...(passwordHash ? { passwordHash } : {}),
      },
    });
  }
}
