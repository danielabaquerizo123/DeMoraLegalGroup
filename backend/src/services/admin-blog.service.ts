import { EstadoPublicacion } from "../generated/prisma/enums";
import { prisma } from "../config/prisma";
import { HttpError, notFound } from "../utils/http-error";

type PostPayload = {
  titulo: string;
  extracto?: string | null;
  contenido: string;
  imagenPortadaUrl?: string | null;
  estado: "BORRADOR" | "PUBLICADO";
};

type VideoBlock = {
  provider: "youtube" | "instagram";
  url: string;
  embedUrl: string;
  videoId?: string;
  shortcode?: string;
};

const postInclude = {
  autorProfesional: true,
  autores: {
    include: { profesional: true },
    orderBy: [{ esPrincipal: "desc" as const }, { orden: "asc" as const }],
  },
};

const allowedTags = new Set(["p", "br", "strong", "b", "em", "i", "h1", "h2", "ul", "ol", "li", "blockquote", "a", "img", "figure", "figcaption", "div", "span"]);
const allowedAttributes = new Map<string, Set<string>>([
  ["a", new Set(["href", "target", "rel"])],
  ["img", new Set(["src", "alt"])],
  ["figure", new Set(["data-content-block", "data-provider", "data-video-id", "data-shortcode", "data-url", "data-embed-url"])],
]);

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 220);
}

async function uniqueSlug(title: string, currentId?: string) {
  const base = slugify(title) || "publicacion";
  let candidate = base;
  let suffix = 2;

  while (await prisma.articuloBlog.findFirst({ where: { slug: candidate, ...(currentId ? { id: { not: currentId } } : {}) }, select: { id: true } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

async function defaultCategoryId() {
  const category = await prisma.categoriaBlog.findFirst({
    where: { activa: true },
    orderBy: [{ orden: "asc" }, { creadoEn: "asc" }],
    select: { id: true },
  });

  return category?.id ?? null;
}

function youtubeVideo(rawUrl: string): VideoBlock | null {
  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.replace(/^www\./, "");
    let videoId: string | null = null;

    if (hostname === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
    }

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      videoId = url.searchParams.get("v");
      if (!videoId && url.pathname.startsWith("/shorts/")) {
        videoId = url.pathname.split("/")[2] ?? null;
      }
      if (!videoId && url.pathname.startsWith("/embed/")) {
        videoId = url.pathname.split("/")[2] ?? null;
      }
    }

    if (!videoId || !/^[A-Za-z0-9_-]{6,20}$/.test(videoId)) {
      return null;
    }

    return {
      provider: "youtube",
      url: url.href,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      videoId,
    };
  } catch {
    return null;
  }
}

function instagramVideo(rawUrl: string): VideoBlock | null {
  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.replace(/^www\./, "");

    if (hostname !== "instagram.com") {
      return null;
    }

    const [kind, shortcode] = url.pathname.split("/").filter(Boolean);

    if ((kind !== "p" && kind !== "reel") || !shortcode || !/^[A-Za-z0-9_-]+$/.test(shortcode)) {
      return null;
    }

    return {
      provider: "instagram",
      url: url.href,
      embedUrl: `https://www.instagram.com/${kind}/${shortcode}/embed`,
      shortcode,
    };
  } catch {
    return null;
  }
}

function videoFromUrl(rawUrl: string) {
  return youtubeVideo(rawUrl) ?? instagramVideo(rawUrl);
}

function readAttribute(attributes: string, name: string) {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*(\"([^\"]*)\"|'([^']*)')`, "i");
  const match = attributes.match(pattern);

  return match?.[2] ?? match?.[3] ?? "";
}

function videoFigure(attributes: string) {
  if (readAttribute(attributes, "data-content-block") !== "video") {
    return null;
  }

  const provider = readAttribute(attributes, "data-provider");
  const url = readAttribute(attributes, "data-url");
  const embedUrl = readAttribute(attributes, "data-embed-url");
  const videoId = readAttribute(attributes, "data-video-id");
  const shortcode = readAttribute(attributes, "data-shortcode");

  if (provider === "youtube" && videoId && /^[A-Za-z0-9_-]{6,20}$/.test(videoId)) {
    return `<figure data-content-block="video" data-provider="youtube" data-video-id="${videoId}" data-url="${url || `https://www.youtube.com/watch?v=${videoId}`}" data-embed-url="https://www.youtube.com/embed/${videoId}"></figure>`;
  }

  if (provider === "instagram" && shortcode && /^[A-Za-z0-9_-]+$/.test(shortcode) && isAllowedVideoUrl(url || embedUrl)) {
    const sourceUrl = url || `https://www.instagram.com/p/${shortcode}/`;
    const embed = embedUrl && isAllowedVideoUrl(embedUrl) ? embedUrl : `${sourceUrl.replace(/\/$/, "")}/embed`;

    return `<figure data-content-block="video" data-provider="instagram" data-shortcode="${shortcode}" data-url="${sourceUrl}" data-embed-url="${embed}"></figure>`;
  }

  return null;
}

function sanitizeAttributes(tag: string, attributes: string) {
  const allowed = allowedAttributes.get(tag);

  if (!allowed) {
    return "";
  }

  const cleaned: string[] = [];
  const attributePattern = /([a-zA-Z-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
  let match: RegExpExecArray | null;

  while ((match = attributePattern.exec(attributes))) {
    const name = match[1].toLowerCase();
    const value = match[3] ?? match[4] ?? "";

    if (!allowed.has(name)) {
      continue;
    }

    if ((name === "href" || name === "src") && !isSafeUrl(value)) {
      continue;
    }

    if ((name === "data-url" || name === "data-embed-url") && !isAllowedVideoUrl(value)) {
      continue;
    }

    if (name === "data-content-block" && value !== "video") {
      continue;
    }

    if (name === "data-provider" && value !== "youtube" && value !== "instagram") {
      continue;
    }

    if (name === "data-video-id" && !/^[A-Za-z0-9_-]{6,20}$/.test(value)) {
      continue;
    }

    if (name === "data-shortcode" && !/^[A-Za-z0-9_-]+$/.test(value)) {
      continue;
    }

    cleaned.push(`${name}="${value.replace(/"/g, "&quot;")}"`);
  }

  if (tag === "a") {
    cleaned.push('target="_blank"', 'rel="noreferrer"');
  }

  return cleaned.length ? ` ${Array.from(new Set(cleaned)).join(" ")}` : "";
}

function isSafeUrl(value: string) {
  if (value.startsWith("data:image/")) {
    return true;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function isAllowedVideoUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, "");

    return ["youtube.com", "m.youtube.com", "youtu.be", "instagram.com"].includes(hostname) && ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

export function sanitizeHtml(html: string) {
  let sanitized = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "").replace(/\son[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "");

  sanitized = sanitized.replace(/<figure\b([^>]*)>[\s\S]*?<\/figure>/gi, (match, attributes: string) => videoFigure(attributes) ?? match);

  sanitized = sanitized.replace(/<iframe\b([^>]*)><\/iframe>/gi, (_match, attributes: string) => {
    const src = attributes.match(/\bsrc\s*=\s*("([^"]*)"|'([^']*)')/i);
    const rawSrc = src?.[2] ?? src?.[3] ?? "";
    const video = videoFromUrl(rawSrc);

    if (!video) {
      return "";
    }

    const videoId = video.videoId ? ` data-video-id="${video.videoId}"` : "";
    const shortcode = video.shortcode ? ` data-shortcode="${video.shortcode}"` : "";

    return `<figure data-content-block="video" data-provider="${video.provider}"${videoId}${shortcode} data-url="${video.url}" data-embed-url="${video.embedUrl}"></figure>`;
  });

  sanitized = sanitized.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (match, rawTag: string, attributes: string) => {
    const tag = rawTag.toLowerCase();

    if (!allowedTags.has(tag)) {
      return "";
    }

    if (match.startsWith("</")) {
      return `</${tag}>`;
    }

    return `<${tag}${sanitizeAttributes(tag, attributes)}>`;
  });

  return sanitized.trim();
}

function primaryAuthor(post: any) {
  const direct = post.autorProfesional;
  const relation = post.autores?.find((author: any) => author.esPrincipal)?.profesional ?? post.autores?.[0]?.profesional;
  const professional = direct ?? relation;

  if (!professional) {
    return null;
  }

  return {
    id: professional.id,
    nombres: professional.nombres,
    apellidos: professional.apellidos,
    nombreCompleto: `${professional.nombres} ${professional.apellidos}`,
    slug: professional.slug,
    cargo: professional.cargo,
    fotoUrl: professional.fotoUrl,
  };
}

function toAdminPost(post: any) {
  return {
    id: post.id,
    titulo: post.titulo,
    slug: post.slug,
    extracto: post.extracto,
    contenido: post.contenido,
    imagen: post.imagenPortadaUrl,
    estado: post.estado,
    fecha: post.publicadoEn,
    actualizadoEn: post.actualizadoEn,
    autor: primaryAuthor(post),
  };
}

function normalizedPostPayload(payload: PostPayload) {
  const isPublished = payload.estado === EstadoPublicacion.PUBLICADO;
  const titulo = payload.titulo.trim() || "Borrador sin titulo";
  const contenido = payload.contenido.trim();
  const sanitizedContent = sanitizeHtml(contenido);

  if (isPublished && (!payload.titulo.trim() || sanitizedContent.length === 0)) {
    throw new HttpError(400, "El título y el contenido son obligatorios para publicar.");
  }

  return {
    titulo,
    extracto: payload.extracto?.trim() || null,
    contenido: sanitizedContent,
    imagenPortadaUrl: payload.imagenPortadaUrl || null,
    isPublished,
  };
}

async function findOwnedPost(professionalId: string, id: string) {
  const post = await prisma.articuloBlog.findFirst({
    where: {
      id,
      OR: [{ autorProfesionalId: professionalId }, { autores: { some: { profesionalId: professionalId } } }],
    },
    include: postInclude,
  });

  if (!post) {
    throw notFound("Publicación no encontrada.");
  }

  return post;
}

export const adminBlogService = {
  async summary(professionalId: string) {
    const where = { OR: [{ autorProfesionalId: professionalId }, { autores: { some: { profesionalId: professionalId } } }] };
    const [published, drafts, recent] = await prisma.$transaction([
      prisma.articuloBlog.count({ where: { ...where, estado: EstadoPublicacion.PUBLICADO } }),
      prisma.articuloBlog.count({ where: { ...where, estado: EstadoPublicacion.BORRADOR } }),
      prisma.articuloBlog.findMany({
        where,
        take: 3,
        orderBy: { actualizadoEn: "desc" },
        include: postInclude,
      }),
    ]);

    return {
      conteos: {
        publicadas: published,
        borradores: drafts,
        total: published + drafts,
      },
      recientes: recent.map(toAdminPost),
    };
  },

  async list(professionalId: string, estado: "TODAS" | "PUBLICADO" | "BORRADOR") {
    const posts = await prisma.articuloBlog.findMany({
      where: {
        OR: [{ autorProfesionalId: professionalId }, { autores: { some: { profesionalId: professionalId } } }],
        ...(estado === "TODAS" ? {} : { estado: estado === "PUBLICADO" ? EstadoPublicacion.PUBLICADO : EstadoPublicacion.BORRADOR }),
      },
      orderBy: { actualizadoEn: "desc" },
      include: postInclude,
    });

    return posts.map(toAdminPost);
  },

  async detail(professionalId: string, id: string) {
    return toAdminPost(await findOwnedPost(professionalId, id));
  },

  async create(professionalId: string, payload: PostPayload) {
    const categoryId = await defaultCategoryId();
    const normalized = normalizedPostPayload(payload);
    const slug = await uniqueSlug(normalized.titulo);

    const post = await prisma.articuloBlog.create({
      data: {
        titulo: normalized.titulo,
        slug,
        extracto: normalized.extracto,
        contenido: normalized.contenido,
        imagenPortadaUrl: normalized.imagenPortadaUrl,
        estado: payload.estado,
        publicadoEn: normalized.isPublished ? new Date() : null,
        categoriaId: categoryId,
        autorProfesionalId: professionalId,
        autores: {
          create: {
            profesionalId: professionalId,
            esPrincipal: true,
            orden: 1,
          },
        },
      },
      include: postInclude,
    });

    return toAdminPost(post);
  },

  async update(professionalId: string, id: string, payload: PostPayload) {
    const existingPost = await findOwnedPost(professionalId, id);
    const normalized = normalizedPostPayload(payload);

    const post = await prisma.articuloBlog.update({
      where: { id },
      data: {
        titulo: normalized.titulo,
        slug: await uniqueSlug(normalized.titulo, id),
        extracto: normalized.extracto,
        contenido: normalized.contenido,
        imagenPortadaUrl: normalized.imagenPortadaUrl,
        estado: payload.estado,
        publicadoEn: normalized.isPublished ? (existingPost.publicadoEn ?? new Date()) : null,
        autorProfesionalId: professionalId,
        autores: {
          upsert: {
            where: {
              articuloId_profesionalId: {
                articuloId: id,
                profesionalId: professionalId,
              },
            },
            create: {
              profesionalId: professionalId,
              esPrincipal: true,
              orden: 1,
            },
            update: {
              esPrincipal: true,
              orden: 1,
            },
          },
        },
      },
      include: postInclude,
    });

    return toAdminPost(post);
  },

  async updateStatus(professionalId: string, id: string, estado: "BORRADOR" | "PUBLICADO") {
    const post = await findOwnedPost(professionalId, id);

    const updated = await prisma.articuloBlog.update({
      where: { id: post.id },
      data: {
        estado,
        publicadoEn: estado === EstadoPublicacion.PUBLICADO ? (post.publicadoEn ?? new Date()) : null,
      },
      include: postInclude,
    });

    return toAdminPost(updated);
  },

  async remove(professionalId: string, id: string) {
    const post = await findOwnedPost(professionalId, id);
    await prisma.articuloBlog.delete({ where: { id: post.id } });
  },
};
