import { TipoCanalContacto } from "../../src/generated/prisma/enums";
import type { PrismaClient, Sede } from "../../src/generated/prisma/client";

const profesionales = [
  {
    nombres: "Lia Margarita",
    apellidos: "De Mora Campi",
    slug: "lia-margarita-de-mora-campi",
    cargo: "Abogada",
    especialidadResumen: "Abogada · Docente Universitaria · Doctoranda en Derecho",
    biografia:
      "Abogada de los Tribunales de la República en libre ejercicio, con experiencia en litigación y asesoría. Docente universitaria activa desde 2023 en la Universidad Técnica de Babahoyo, doctoranda en Derecho y magíster en Derecho Procesal, con formación complementaria en áreas jurídicas públicas y académicas.",
    fotoUrl: "/images/professionals/Lia.jpeg",
    destacado: true,
    orden: 1,
  },
  {
    nombres: "Maria Belen",
    apellidos: "Vargas Gonzalez",
    slug: "maria-belen-vargas-gonzalez",
    cargo: "Abogada",
    especialidadResumen: "Abogada · Magíster en Derecho Procesal",
    biografia:
      "Abogada con formación de posgrado en Derecho Procesal, magíster en Derecho Procesal y diplomado en Docencia Superior.",
    fotoUrl: "/images/professionals/MariaBelen.jpeg",
    destacado: true,
    orden: 2,
  },
  {
    nombres: "Ronald Ariel",
    apellidos: "Marin Paredes",
    slug: "ronald-ariel-marin-paredes",
    cargo: "Abogado junior",
    especialidadResumen: null,
    biografia: null,
    fotoUrl: "/images/professionals/Ronal.jpeg",
    destacado: false,
    orden: 3,
  },
  {
    nombres: "Paul",
    apellidos: "Cepeda Chimbolema",
    slug: "paul-cepeda-chimbolema",
    cargo: null,
    especialidadResumen: null,
    biografia: null,
    fotoUrl: "/images/professionals/Paul.png",
    destacado: false,
    orden: 4,
  },
];

const liaServicios = [
  "litigacion-y-asesoria-juridica",
  "derecho-procesal",
  "derecho-administrativo",
  "derecho-constitucional",
  "derecho-tributario",
  "contratacion-publica",
];

export const seedProfesionales = async (prisma: PrismaClient, sedes: Record<string, Sede>) => {
  for (const profesional of profesionales) {
    await prisma.profesional.upsert({
      where: { slug: profesional.slug },
      create: {
        ...profesional,
        activo: true,
      },
      update: {
        ...profesional,
        activo: true,
      },
    });
  }

  const lia = await prisma.profesional.findUniqueOrThrow({ where: { slug: "lia-margarita-de-mora-campi" } });
  const maria = await prisma.profesional.findUniqueOrThrow({ where: { slug: "maria-belen-vargas-gonzalez" } });

  if (sedes.babahoyo) {
    await prisma.profesionalSede.upsert({
      where: {
        profesionalId_sedeId: {
          profesionalId: lia.id,
          sedeId: sedes.babahoyo.id,
        },
      },
      create: {
        profesionalId: lia.id,
        sedeId: sedes.babahoyo.id,
        principal: true,
        orden: 1,
      },
      update: {
        principal: true,
        orden: 1,
      },
    });
  }

  if (sedes.guayaquil) {
    await prisma.profesionalSede.upsert({
      where: {
        profesionalId_sedeId: {
          profesionalId: maria.id,
          sedeId: sedes.guayaquil.id,
        },
      },
      create: {
        profesionalId: maria.id,
        sedeId: sedes.guayaquil.id,
        principal: true,
        orden: 1,
      },
      update: {
        principal: true,
        orden: 1,
      },
    });
  }

  await prisma.canalContactoProfesional.upsert({
    where: {
      profesionalId_tipo_valor: {
        profesionalId: maria.id,
        tipo: TipoCanalContacto.EMAIL,
        valor: "ab.mariabelenvargasdematute@gmail.com",
      },
    },
    create: {
      profesionalId: maria.id,
      tipo: TipoCanalContacto.EMAIL,
      etiqueta: "Correo profesional",
      valor: "ab.mariabelenvargasdematute@gmail.com",
      url: "mailto:ab.mariabelenvargasdematute@gmail.com",
      esPrincipal: true,
      visible: true,
      orden: 1,
    },
    update: {
      etiqueta: "Correo profesional",
      url: "mailto:ab.mariabelenvargasdematute@gmail.com",
      esPrincipal: true,
      visible: true,
      orden: 1,
    },
  });

  for (const [index, slug] of liaServicios.entries()) {
    const servicio = await prisma.servicio.findUniqueOrThrow({ where: { slug } });
    await prisma.profesionalServicio.upsert({
      where: {
        profesionalId_servicioId: {
          profesionalId: lia.id,
          servicioId: servicio.id,
        },
      },
      create: {
        profesionalId: lia.id,
        servicioId: servicio.id,
        esPrincipal: slug === "litigacion-y-asesoria-juridica",
        orden: index + 1,
      },
      update: {
        esPrincipal: slug === "litigacion-y-asesoria-juridica",
        orden: index + 1,
      },
    });
  }

  const derechoProcesal = await prisma.servicio.findUniqueOrThrow({ where: { slug: "derecho-procesal" } });
  await prisma.profesionalServicio.upsert({
    where: {
      profesionalId_servicioId: {
        profesionalId: maria.id,
        servicioId: derechoProcesal.id,
      },
    },
    create: {
      profesionalId: maria.id,
      servicioId: derechoProcesal.id,
      esPrincipal: true,
      orden: 1,
    },
    update: {
      esPrincipal: true,
      orden: 1,
    },
  });
};
