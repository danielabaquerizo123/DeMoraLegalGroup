import { servicioRepository } from "../repositories/servicio.repository";
import { notFound } from "../utils/http-error";

type ServicioListRecord = Awaited<ReturnType<typeof servicioRepository.findActiveAll>>[number];
type ServicioDetailRecord = NonNullable<Awaited<ReturnType<typeof servicioRepository.findActiveBySlug>>>;

const toPublicServicioListItem = (servicio: ServicioListRecord) => ({
  nombre: servicio.nombre,
  slug: servicio.slug,
  resumen: servicio.resumen,
  descripcion: servicio.descripcion,
  preguntaColoquial: servicio.preguntaColoquial,
  icono: servicio.icono,
  imagenUrl: servicio.imagenUrl,
  destacado: servicio.destacado,
  orden: servicio.orden,
  metaTitulo: servicio.metaTitulo,
  metaDescripcion: servicio.metaDescripcion,
});

const toPublicServicioDetail = (servicio: ServicioDetailRecord) => ({
  ...toPublicServicioListItem(servicio),
  profesionales: servicio.profesionales
    .filter((relacion) => relacion.profesional.activo)
    .map((relacion) => ({
      nombres: relacion.profesional.nombres,
      apellidos: relacion.profesional.apellidos,
      nombreCompleto: `${relacion.profesional.nombres} ${relacion.profesional.apellidos}`,
      slug: relacion.profesional.slug,
      cargo: relacion.profesional.cargo,
      destacado: relacion.profesional.destacado,
      esPrincipal: relacion.esPrincipal,
      orden: relacion.orden,
    })),
});

export const servicioService = {
  async list() {
    const servicios = await servicioRepository.findActiveAll();
    return servicios.map(toPublicServicioListItem);
  },

  async detail(slug: string) {
    const servicio = await servicioRepository.findActiveBySlug(slug);

    if (!servicio) {
      throw notFound("Servicio no encontrado");
    }

    return toPublicServicioDetail(servicio);
  },
};
