import type { Request, Response } from "express";
import { profesionalService } from "../services/profesional.service";
import { slugParamSchema } from "../validators/slug.validator";

export const profesionalController = {
  async list(_request: Request, response: Response) {
    const data = await profesionalService.list();
    response.json({ data });
  },

  async detail(request: Request, response: Response) {
    const { slug } = slugParamSchema.parse(request.params);
    const data = await profesionalService.detail(slug);
    response.json({ data });
  },
};
