import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/http-error";

export const notFoundMiddleware: RequestHandler = (_request, response) => {
  response.status(404).json({
    error: {
      message: "Recurso no encontrado",
    },
  });
};

export const errorMiddleware: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        message: "Parametros invalidos",
      },
    });
    return;
  }

  if (error instanceof HttpError) {
    response.status(error.statusCode).json({
      error: {
        message: error.message,
      },
    });
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(error);
  }

  response.status(500).json({
    error: {
      message: "Error interno del servidor",
    },
  });
};
