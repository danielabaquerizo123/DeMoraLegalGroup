import type { Request, Response } from "express";
import { configuracionService } from "../services/configuracion.service";

export const configuracionController = {
  async list(_request: Request, response: Response) {
    const data = await configuracionService.listPublic();
    response.json({ data });
  },
};
