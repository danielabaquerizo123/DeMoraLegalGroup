import { profesionalRepository } from "../repositories/profesional.repository";
import { notFound } from "../utils/http-error";

type ProfesionalRecord = Awaited<ReturnType<typeof profesionalRepository.findActiveAll>>[number];

const toPublicProfesional = (profesional: ProfesionalRecord) => ({
  nombres: profesional.nombres,
  apellidos: profesional.apellidos,
  nombreCompleto: `${profesional.nombres} ${profesional.apellidos}`,
  slug: profesional.slug,
  cargo: profesional.cargo,
  resumenProfesional: profesional.especialidadResumen,
  biografia: profesional.biografia,
  fotoUrl: profesional.fotoUrl,
  destacado: profesional.destacado,
  orden: profesional.orden,
  sedes: profesional.sedes.map((relacion) => ({
    nombre: relacion.sede.nombre,
    ciudad: relacion.sede.ciudad,
    provincia: relacion.sede.provincia,
    direccion: relacion.sede.direccion,
    principal: relacion.principal,
    orden: relacion.orden,
  })),
  canales: profesional.contactos.map((contacto) => ({
    tipo: contacto.tipo,
    etiqueta: contacto.etiqueta,
    valor: contacto.valor,
    url: contacto.url,
    esPrincipal: contacto.esPrincipal,
    orden: contacto.orden,
  })),
  servicios: profesional.servicios
    .filter((relacion) => relacion.servicio.activo)
    .map((relacion) => ({
      nombre: relacion.servicio.nombre,
      slug: relacion.servicio.slug,
      resumen: relacion.servicio.resumen,
      esPrincipal: relacion.esPrincipal,
      orden: relacion.orden,
    })),
});

export const profesionalService = {
  async list() {
    const profesionales = await profesionalRepository.findActiveAll();
    return profesionales.map(toPublicProfesional);
  },

  async detail(slug: string) {
    const profesional = await profesionalRepository.findActiveBySlug(slug);

    if (!profesional) {
      throw notFound("Profesional no encontrado");
    }

    return toPublicProfesional(profesional);
  },
};
