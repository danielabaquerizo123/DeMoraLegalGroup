import type { Request, Response } from "express";
import { categoriaService } from "../services/categoria.service";
import { slugParamSchema } from "../validators/slug.validator";

export const categoriaController = {
  async list(_request: Request, response: Response) {
    const data = await categoriaService.list();
    response.json({ data });
  },

  async detail(request: Request, response: Response) {
    const { slug } = slugParamSchema.parse(request.params);
    const data = await categoriaService.detail(slug);
    response.json({ data });
  },
};
