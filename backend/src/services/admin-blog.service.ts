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

const postInclude = {
  autorProfesional: true,
  autores: {
    include: { profesional: true },
    orderBy: [{ esPrincipal: "desc" as const }, { orden: "asc" as const }],
  },
};

const allowedTags = new Set(["p", "br", "strong", "b", "em", "i", "h1", "h2", "ul", "ol", "li", "blockquote", "a", "img", "figure", "figcaption", "iframe"]);
const allowedAttributes = new Map<string, Set<string>>([
  ["a", new Set(["href", "target", "rel"])],
  ["img", new Set(["src", "alt"])],
  ["iframe", new Set(["src", "title", "allow", "allowfullscreen", "loading"])],
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

function youtubeEmbedUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.replace(/^www\./, "");
    let videoId: string | null = null;

    if (hostname === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
    }

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      videoId = url.searchParams.get("v");
      if (!videoId && url.pathname.startsWith("/embed/")) {
        videoId = url.pathname.split("/")[2] ?? null;
      }
    }

    if (!videoId || !/^[A-Za-z0-9_-]{6,20}$/.test(videoId)) {
      return null;
    }

    return `https://www.youtube.com/embed/${videoId}`;
  } catch {
    return null;
  }
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

    if ((name === "href" || name === "src") && !isSafeUrl(value, tag === "iframe")) {
      continue;
    }

    cleaned.push(`${name}="${value.replace(/"/g, "&quot;")}"`);
  }

  if (tag === "a") {
    cleaned.push('target="_blank"', 'rel="noreferrer"');
  }

  if (tag === "iframe") {
    cleaned.push('loading="lazy"', 'allowfullscreen="true"', 'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"');
  }

  return cleaned.length ? ` ${Array.from(new Set(cleaned)).join(" ")}` : "";
}

function isSafeUrl(value: string, allowYoutubeEmbed = false) {
  if (value.startsWith("data:image/")) {
    return true;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return false;
    }

    if (allowYoutubeEmbed) {
      return url.hostname === "www.youtube.com" && url.pathname.startsWith("/embed/");
    }

    return true;
  } catch {
    return false;
  }
}

export function sanitizeHtml(html: string) {
  let sanitized = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "").replace(/\son[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "");

  sanitized = sanitized.replace(/<iframe\b([^>]*)><\/iframe>/gi, (_match, attributes: string) => {
    const src = attributes.match(/\bsrc\s*=\s*("([^"]*)"|'([^']*)')/i);
    const rawSrc = src?.[2] ?? src?.[3] ?? "";
    const embedUrl = youtubeEmbedUrl(rawSrc) ?? (isSafeUrl(rawSrc, true) ? rawSrc : null);

    if (!embedUrl) {
      return "";
    }

    return `<iframe src="${embedUrl}" title="Video embebido"></iframe>`;
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
    const slug = await uniqueSlug(payload.titulo);
    const isPublished = payload.estado === EstadoPublicacion.PUBLICADO;

    if (isPublished && sanitizeHtml(payload.contenido).length === 0) {
      throw new HttpError(400, "El contenido es obligatorio para publicar.");
    }

    const post = await prisma.articuloBlog.create({
      data: {
        titulo: payload.titulo,
        slug,
        extracto: payload.extracto || null,
        contenido: sanitizeHtml(payload.contenido),
        imagenPortadaUrl: payload.imagenPortadaUrl || null,
        estado: payload.estado,
        publicadoEn: isPublished ? new Date() : null,
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
    await findOwnedPost(professionalId, id);
    const isPublished = payload.estado === EstadoPublicacion.PUBLICADO;

    const post = await prisma.articuloBlog.update({
      where: { id },
      data: {
        titulo: payload.titulo,
        slug: await uniqueSlug(payload.titulo, id),
        extracto: payload.extracto || null,
        contenido: sanitizeHtml(payload.contenido),
        imagenPortadaUrl: payload.imagenPortadaUrl || null,
        estado: payload.estado,
        publicadoEn: isPublished ? new Date() : null,
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
