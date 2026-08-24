import { configuracionRepository } from "../repositories/configuracion.repository";

export const configuracionService = {
  async listPublic() {
    const configuraciones = await configuracionRepository.findPublicAll();

    return configuraciones.reduce<Record<string, unknown>>((accumulator, configuracion) => {
      accumulator[configuracion.clave] = configuracion.valor;
      return accumulator;
    }, {});
  },
};
