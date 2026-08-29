export type ApiCollectionResponse<T> = {
  data: T[];
};

export type ApiDetailResponse<T> = {
  data: T;
};

export type ApiMessageResponse<T = Record<string, never>> = {
  data: T & {
    message?: string;
    previewUrl?: string;
    emailSent?: boolean;
  };
};

export type AdminUser = {
  id: string;
  nombre: string;
  username: string | null;
  email: string | null;
  estado: "PENDIENTE" | "ACTIVO" | "BLOQUEADO";
  profesional: {
    id: string;
    nombres: string;
    apellidos: string;
    nombreCompleto: string;
    slug: string;
    cargo: string | null;
    fotoUrl: string | null;
  };
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type SiteConfiguration = {
  nombre_estudio?: {
    nombre: string;
  };
  contacto_whatsapp_principal?: {
    numero: string;
    display: string;
    url: string;
  };
};

export type Professional = {
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  slug: string;
  cargo: string | null;
  resumenProfesional: string | null;
  biografia: string | null;
  fotoUrl: string | null;
  destacado: boolean;
  orden: number;
  sedes: Array<{
    nombre: string;
    ciudad: string;
    provincia: string | null;
    direccion: string | null;
    principal: boolean;
    orden: number;
  }>;
  canales: Array<{
    tipo: string;
    etiqueta: string | null;
    valor: string;
    url: string | null;
    esPrincipal: boolean;
    orden: number;
  }>;
  servicios: Array<{
    nombre: string;
    slug: string;
    resumen: string | null;
    esPrincipal: boolean;
    orden: number;
  }>;
};

export type LegalService = {
  nombre: string;
  slug: string;
  resumen: string | null;
  descripcion: string | null;
  preguntaColoquial: string | null;
  icono: string | null;
  imagenUrl: string | null;
  destacado: boolean;
  orden: number;
  metaTitulo: string | null;
  metaDescripcion: string | null;
  profesionales?: Array<{
    nombres: string;
    apellidos: string;
    nombreCompleto: string;
    slug: string;
    cargo: string | null;
    destacado: boolean;
    esPrincipal: boolean;
    orden: number;
  }>;
};

export type Article = {
  titulo: string;
  slug: string;
  extracto: string | null;
  contenido?: string;
  imagen: string | null;
  fecha: string | null;
  categoria: {
    nombre: string;
    slug: string;
  } | null;
  autores: Array<{
    nombres: string;
    apellidos: string;
    nombreCompleto: string;
    slug: string;
    fotoUrl?: string | null;
    esPrincipal: boolean;
    orden: number;
  }>;
  servicios?: Array<{
    nombre: string;
    slug: string;
  }>;
  etiquetas?: Array<{
    nombre: string;
    slug: string;
  }>;
  metaTitulo?: string | null;
  metaDescripcion?: string | null;
};

export type AdminPostStatus = "PUBLICADO" | "BORRADOR";

export type AdminBlogAuthor = {
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  slug: string;
  cargo: string | null;
  fotoUrl: string | null;
};

export type AdminBlogPost = {
  id: string;
  titulo: string;
  slug: string;
  extracto: string | null;
  contenido: string;
  imagen: string | null;
  estado: AdminPostStatus;
  fecha: string | null;
  actualizadoEn: string;
  autor: AdminBlogAuthor | null;
};

export type AdminBlogSummary = {
  recientes: AdminBlogPost[];
  conteos: {
    publicadas: number;
    borradores: number;
    total: number;
  };
};

export type Category = {
  nombre: string;
  slug: string;
  descripcion: string | null;
  orden: number;
  articulosPublicados: number;
};
