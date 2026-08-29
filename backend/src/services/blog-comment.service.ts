import { EstadoPublicacion } from "../generated/prisma/enums";
import { prisma } from "../config/prisma";
import { HttpError, notFound } from "../utils/http-error";

type PublicCommentPayload = {
  nombre: string;
  contenido: string;
};

type AdminReplyPayload = {
  contenido: string;
};

function toPublicComment(comment: any) {
  return {
    id: comment.id,
    nombre: comment.nombreVisitante,
    contenido: comment.contenido,
    fecha: comment.creadoEn,
    respuesta: comment.respuestas?.[0]
      ? {
          id: comment.respuestas[0].id,
          contenido: comment.respuestas[0].contenido,
          fecha: comment.respuestas[0].creadoEn,
          autor: {
            nombreCompleto: comment.respuestas[0].usuarioAdmin?.profesional
              ? `${comment.respuestas[0].usuarioAdmin.profesional.nombres} ${comment.respuestas[0].usuarioAdmin.profesional.apellidos}`
              : comment.respuestas[0].usuarioAdmin?.nombre ?? "Equipo De Mora",
            cargo: comment.respuestas[0].usuarioAdmin?.profesional?.cargo ?? "Abogado",
          },
        }
      : null,
  };
}

function toAdminComment(comment: any) {
  return {
    id: comment.id,
    nombre: comment.nombreVisitante,
    contenido: comment.contenido,
    fecha: comment.creadoEn,
    articulo: {
      id: comment.articulo.id,
      titulo: comment.articulo.titulo,
      slug: comment.articulo.slug,
    },
    respuesta: comment.respuestas?.[0] ? toPublicComment(comment).respuesta : null,
  };
}

export const blogCommentService = {
  async listForArticle(slug: string, params: { page: number; limit: number }) {
    const article = await prisma.articuloBlog.findFirst({
      where: {
        slug,
        estado: EstadoPublicacion.PUBLICADO,
        publicadoEn: { not: null },
      },
      select: { id: true, comentariosHabilitados: true },
    });

    if (!article) {
      throw notFound("Articulo no encontrado");
    }

    if (!article.comentariosHabilitados) {
      return { data: [], pagination: { page: params.page, limit: params.limit, total: 0, totalPages: 0 } };
    }

    const skip = (params.page - 1) * params.limit;
    const where = { articuloId: article.id, parentId: null };
    const [data, total] = await prisma.$transaction([
      prisma.comentarioBlog.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { creadoEn: "desc" },
        include: {
          respuestas: {
            take: 1,
            orderBy: { creadoEn: "asc" },
            include: { usuarioAdmin: { include: { profesional: true } } },
          },
        },
      }),
      prisma.comentarioBlog.count({ where }),
    ]);

    return {
      data: data.map(toPublicComment),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / params.limit),
      },
    };
  },

  async createForArticle(slug: string, payload: PublicCommentPayload) {
    const article = await prisma.articuloBlog.findFirst({
      where: {
        slug,
        estado: EstadoPublicacion.PUBLICADO,
        publicadoEn: { not: null },
      },
      select: { id: true, comentariosHabilitados: true },
    });

    if (!article) {
      throw notFound("Articulo no encontrado");
    }

    if (!article.comentariosHabilitados) {
      throw new HttpError(403, "Los comentarios no están habilitados para este artículo.");
    }

    const comment = await prisma.comentarioBlog.create({
      data: {
        articuloId: article.id,
        nombreVisitante: payload.nombre.trim(),
        contenido: payload.contenido.trim(),
      },
      include: { respuestas: true },
    });

    return toPublicComment(comment);
  },

  async listForAdmin(professionalId: string) {
    const comments = await prisma.comentarioBlog.findMany({
      where: {
        parentId: null,
        articulo: {
          OR: [{ autorProfesionalId: professionalId }, { autores: { some: { profesionalId: professionalId } } }],
        },
      },
      take: 50,
      orderBy: { creadoEn: "desc" },
      include: {
        articulo: true,
        respuestas: {
          take: 1,
          orderBy: { creadoEn: "asc" },
          include: { usuarioAdmin: { include: { profesional: true } } },
        },
      },
    });

    return comments.map(toAdminComment);
  },

  async reply(professionalId: string, userId: string, commentId: string, payload: AdminReplyPayload) {
    const comment = await prisma.comentarioBlog.findFirst({
      where: {
        id: commentId,
        parentId: null,
        articulo: {
          OR: [{ autorProfesionalId: professionalId }, { autores: { some: { profesionalId: professionalId } } }],
        },
      },
      include: { respuestas: true },
    });

    if (!comment) {
      throw notFound("Comentario no encontrado.");
    }

    await prisma.comentarioBlog.deleteMany({ where: { parentId: comment.id } });
    const reply = await prisma.comentarioBlog.create({
      data: {
        articuloId: comment.articuloId,
        parentId: comment.id,
        usuarioAdminId: userId,
        contenido: payload.contenido.trim(),
      },
      include: { usuarioAdmin: { include: { profesional: true } } },
    });

    return toPublicComment({ ...comment, respuestas: [reply] }).respuesta;
  },

  async remove(professionalId: string, commentId: string) {
    const comment = await prisma.comentarioBlog.findFirst({
      where: {
        id: commentId,
        parentId: null,
        articulo: {
          OR: [{ autorProfesionalId: professionalId }, { autores: { some: { profesionalId: professionalId } } }],
        },
      },
    });

    if (!comment) {
      throw notFound("Comentario no encontrado.");
    }

    await prisma.comentarioBlog.delete({ where: { id: comment.id } });
  },
};
