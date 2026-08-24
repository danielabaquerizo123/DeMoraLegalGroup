import type { PrismaClient } from "../../src/generated/prisma/client";

const servicios = [
  {
    nombre: "Litigación y Asesoría Jurídica",
    slug: "litigacion-y-asesoria-juridica",
    resumen: "Acompañamiento jurídico, análisis de controversias y representación legal de acuerdo con las necesidades de cada caso.",
    descripcion: "Acompañamiento jurídico, análisis de controversias y representación legal de acuerdo con las necesidades de cada caso.",
    orden: 1,
  },
  {
    nombre: "Derecho Procesal",
    slug: "derecho-procesal",
    resumen: "Asesoría y acompañamiento jurídico en procedimientos y controversias que requieren estrategia y análisis procesal.",
    descripcion: "Asesoría y acompañamiento jurídico en procedimientos y controversias que requieren estrategia y análisis procesal.",
    orden: 2,
  },
  {
    nombre: "Derecho Administrativo",
    slug: "derecho-administrativo",
    resumen: "Orientación jurídica en procedimientos, actuaciones y controversias relacionadas con la administración pública.",
    descripcion: "Orientación jurídica en procedimientos, actuaciones y controversias relacionadas con la administración pública.",
    orden: 3,
  },
  {
    nombre: "Derecho Constitucional",
    slug: "derecho-constitucional",
    resumen: "Asesoría en asuntos relacionados con derechos, garantías y mecanismos previstos por el ordenamiento constitucional.",
    descripcion: "Asesoría en asuntos relacionados con derechos, garantías y mecanismos previstos por el ordenamiento constitucional.",
    orden: 4,
  },
  {
    nombre: "Derecho Tributario",
    slug: "derecho-tributario",
    resumen: "Orientación jurídica en asuntos tributarios y en la interpretación y aplicación de la normativa correspondiente.",
    descripcion: "Orientación jurídica en asuntos tributarios y en la interpretación y aplicación de la normativa correspondiente.",
    orden: 5,
  },
  {
    nombre: "Contratación Pública",
    slug: "contratacion-publica",
    resumen: "Asesoría jurídica relacionada con procedimientos y actuaciones dentro del ámbito de la contratación pública.",
    descripcion: "Asesoría jurídica relacionada con procedimientos y actuaciones dentro del ámbito de la contratación pública.",
    orden: 6,
  },
  {
    nombre: "Derecho de Familia",
    slug: "derecho-de-familia",
    resumen: "Acompañamiento jurídico en asuntos familiares que requieren orientación, análisis y una atención responsable de cada situación.",
    descripcion: "Acompañamiento jurídico en asuntos familiares que requieren orientación, análisis y una atención responsable de cada situación.",
    orden: 7,
  },
  {
    nombre: "Derecho de Tránsito",
    slug: "derecho-de-transito",
    resumen: "Asesoría jurídica en asuntos relacionados con tránsito, incluyendo procedimientos e impugnaciones que requieran análisis y defensa legal.",
    descripcion: "Asesoría jurídica en asuntos relacionados con tránsito, incluyendo procedimientos e impugnaciones que requieran análisis y defensa legal.",
    orden: 8,
  },
];

export const seedServicios = async (prisma: PrismaClient) => {
  for (const servicio of servicios) {
    await prisma.servicio.upsert({
      where: { slug: servicio.slug },
      create: {
        ...servicio,
        activo: true,
        destacado: servicio.orden <= 2,
      },
      update: {
        ...servicio,
        activo: true,
        destacado: servicio.orden <= 2,
      },
    });
  }
};
