import { Router } from "express";
import { adminRoutes } from "./admin.routes";
import { articuloRoutes } from "./articulo.routes";
import { categoriaRoutes } from "./categoria.routes";
import { configuracionRoutes } from "./configuracion.routes";
import { profesionalRoutes } from "./profesional.routes";
import { servicioRoutes } from "./servicio.routes";

export const apiRoutes = Router();

apiRoutes.use("/admin", adminRoutes);
apiRoutes.use("/profesionales", profesionalRoutes);
apiRoutes.use("/servicios", servicioRoutes);
apiRoutes.use("/articulos", articuloRoutes);
apiRoutes.use("/categorias", categoriaRoutes);
apiRoutes.use("/configuracion", configuracionRoutes);
