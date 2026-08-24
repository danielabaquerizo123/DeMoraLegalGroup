import type { Request, Response } from "express";
import { articuloService } from "../services/articulo.service";
import { articuloQuerySchema } from "../validators/articulo-query.validator";
import { slugParamSchema } from "../validators/slug.validator";

export const articuloController = {
  async list(request: Request, response: Response) {
    const query = articuloQuerySchema.parse(request.query);
    const result = await articuloService.list({
      page: query.page,
      limit: query.limit,
      filters: {
        categoria: query.categoria,
        servicio: query.servicio,
        etiqueta: query.etiqueta,
      },
    });

    response.json(result);
  },

  async detail(request: Request, response: Response) {
    const { slug } = slugParamSchema.parse(request.params);
    const data = await articuloService.detail(slug);
    response.json({ data });
  },
};
