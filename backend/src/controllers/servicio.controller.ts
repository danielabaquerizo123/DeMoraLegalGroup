import type { Request, Response } from "express";
import { servicioService } from "../services/servicio.service";
import { slugParamSchema } from "../validators/slug.validator";

export const servicioController = {
  async list(_request: Request, response: Response) {
    const data = await servicioService.list();
    response.json({ data });
  },

  async detail(request: Request, response: Response) {
    const { slug } = slugParamSchema.parse(request.params);
    const data = await servicioService.detail(slug);
    response.json({ data });
  },
};
