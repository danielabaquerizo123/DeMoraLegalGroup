import type { RequestHandler } from "express";
import type { ZodType } from "zod";

export const validateParams =
  (schema: ZodType): RequestHandler =>
  (request, _response, next) => {
    schema.parse(request.params);
    next();
  };

export const validateBody =
  (schema: ZodType): RequestHandler =>
  (request, _response, next) => {
    schema.parse(request.body);
    next();
  };

export const validateQuery =
  (schema: ZodType): RequestHandler =>
  (request, _response, next) => {
    schema.parse(request.query);
    next();
  };
