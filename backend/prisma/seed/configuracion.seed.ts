import type { PrismaClient } from "../../src/generated/prisma/client";

const configuraciones = [
  {
    clave: "nombre_estudio",
    valor: {
      nombre: "De Mora Legal Group",
    },
    descripcion: "Nombre público del estudio jurídico.",
  },
  {
    clave: "contacto_whatsapp_principal",
    valor: {
      numero: "+593993513995",
      display: "+593 99 351 3995",
      url: "https://wa.me/593993513995",
    },
    descripcion: "Contacto institucional principal para WhatsApp.",
  },
];

export const seedConfiguracion = async (prisma: PrismaClient) => {
  for (const configuracion of configuraciones) {
    await prisma.configuracionSitio.upsert({
      where: { clave: configuracion.clave },
      create: {
        ...configuracion,
        publica: true,
      },
      update: {
        ...configuracion,
        publica: true,
      },
    });
  }
};
