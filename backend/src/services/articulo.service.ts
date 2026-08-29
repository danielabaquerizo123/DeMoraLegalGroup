import type { ArticuloFilters } from "../repositories/articulo.repository";
import { articuloRepository } from "../repositories/articulo.repository";
import { notFound } from "../utils/http-error";

type ArticuloListRecord = Awaited<ReturnType<typeof articuloRepository.findPublished>>["data"][number];
type ArticuloDetailRecord = NonNullable<Awaited<ReturnType<typeof articuloRepository.findPublishedBySlug>>>;

const toAuthor = (autor: ArticuloListRecord["autores"][number]) => ({
  nombres: autor.profesional.nombres,
  apellidos: autor.profesional.apellidos,
  nombreCompleto: `${autor.profesional.nombres} ${autor.profesional.apellidos}`,
  slug: autor.profesional.slug,
  fotoUrl: autor.profesional.fotoUrl,
  esPrincipal: autor.esPrincipal,
  orden: autor.orden,
});

const toDirectAuthor = (profesional: ArticuloListRecord["autorProfesional"]) =>
  profesional
    ? {
        nombres: profesional.nombres,
        apellidos: profesional.apellidos,
        nombreCompleto: `${profesional.nombres} ${profesional.apellidos}`,
        slug: profesional.slug,
        fotoUrl: profesional.fotoUrl,
        esPrincipal: true,
        orden: 1,
      }
    : null;

const toAuthors = (articulo: ArticuloListRecord) => {
  const directAuthor = toDirectAuthor(articulo.autorProfesional);

  if (directAuthor) {
    return [directAuthor];
  }

  return articulo.autores.map(toAuthor);
};

const toListItem = (articulo: ArticuloListRecord) => ({
  titulo: articulo.titulo,
  tituloHtml: articulo.tituloHtml,
  slug: articulo.slug,
  extracto: articulo.extracto,
  extractoHtml: articulo.extractoHtml,
  imagen: articulo.imagenPortadaUrl,
  tituloTamano: articulo.tituloTamano ?? "NORMAL",
  tituloAlineacion: articulo.tituloAlineacion ?? "IZQUIERDA",
  tituloTipografia: articulo.tituloTipografia ?? "INSTITUCIONAL",
  extractoTamano: articulo.extractoTamano ?? "NORMAL",
  extractoAlineacion: articulo.extractoAlineacion ?? "IZQUIERDA",
  extractoTipografia: articulo.extractoTipografia ?? "INSTITUCIONAL",
  fecha: articulo.publicadoEn,
  categoria: {
    nombre: articulo.categoria?.nombre ?? null,
    slug: articulo.categoria?.slug ?? null,
  },
  autores: toAuthors(articulo),
});

const toDetail = (articulo: ArticuloDetailRecord) => ({
  titulo: articulo.titulo,
  tituloHtml: articulo.tituloHtml,
  slug: articulo.slug,
  contenido: articulo.contenido,
  extracto: articulo.extracto,
  extractoHtml: articulo.extractoHtml,
  imagen: articulo.imagenPortadaUrl,
  tituloTamano: articulo.tituloTamano ?? "NORMAL",
  tituloAlineacion: articulo.tituloAlineacion ?? "IZQUIERDA",
  tituloTipografia: articulo.tituloTipografia ?? "INSTITUCIONAL",
  extractoTamano: articulo.extractoTamano ?? "NORMAL",
  extractoAlineacion: articulo.extractoAlineacion ?? "IZQUIERDA",
  extractoTipografia: articulo.extractoTipografia ?? "INSTITUCIONAL",
  comentariosHabilitados: articulo.comentariosHabilitados,
  fecha: articulo.publicadoEn,
  categoria: {
    nombre: articulo.categoria?.nombre ?? null,
    slug: articulo.categoria?.slug ?? null,
  },
  autores: toAuthors(articulo),
  servicios: articulo.servicios.map((relacion) => ({
    nombre: relacion.servicio.nombre,
    slug: relacion.servicio.slug,
  })),
  etiquetas: articulo.etiquetas.map((relacion) => ({
    nombre: relacion.etiqueta.nombre,
    slug: relacion.etiqueta.slug,
  })),
  metaTitulo: articulo.metaTitulo,
  metaDescripcion: articulo.metaDescripcion,
});

export const articuloService = {
  async list(params: { page: number; limit: number; filters: ArticuloFilters }) {
    const result = await articuloRepository.findPublished(params);
    const totalPages = result.total === 0 ? 0 : Math.ceil(result.total / params.limit);

    return {
      data: result.data.map(toListItem),
      pagination: {
        page: params.page,
        limit: params.limit,
        total: result.total,
        totalPages,
      },
    };
  },

  async detail(slug: string) {
    const articulo = await articuloRepository.findPublishedBySlug(slug);

    if (!articulo) {
      throw notFound("Articulo no encontrado");
    }

    return toDetail(articulo);
  },
};
