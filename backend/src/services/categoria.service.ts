import { categoriaRepository } from "../repositories/categoria.repository";
import { notFound } from "../utils/http-error";

type CategoriaRecord = Awaited<ReturnType<typeof categoriaRepository.findActiveAll>>[number];

const toPublicCategoria = (categoria: CategoriaRecord) => ({
  nombre: categoria.nombre,
  slug: categoria.slug,
  descripcion: categoria.descripcion,
  orden: categoria.orden,
  articulosPublicados: categoria._count.articulos,
});

export const categoriaService = {
  async list() {
    const categorias = await categoriaRepository.findActiveAll();
    return categorias.map(toPublicCategoria);
  },

  async detail(slug: string) {
    const categoria = await categoriaRepository.findActiveBySlug(slug);

    if (!categoria) {
      throw notFound("Categoria no encontrada");
    }

    return toPublicCategoria(categoria);
  },
};
