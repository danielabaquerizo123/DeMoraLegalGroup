import { adminBlogService } from "../services/admin-blog.service";
import { asyncHandler } from "../utils/async-handler";
import { adminPostIdParamSchema, adminPostPayloadSchema, adminPostStatusQuerySchema, adminPostStatusSchema } from "../validators/admin-blog.validator";

function professionalIdFromSession(admin: NonNullable<Express.Request["admin"]>) {
  const professionalId = admin.user.profesional?.id;

  if (!professionalId) {
    throw new Error("La sesión administrativa no tiene profesional asociado.");
  }

  return professionalId;
}

export const getAdminBlogSummary = asyncHandler(async (request, response) => {
  const professionalId = professionalIdFromSession(request.admin!);
  const data = await adminBlogService.summary(professionalId);

  response.status(200).json({ data });
});

export const listAdminPosts = asyncHandler(async (request, response) => {
  const professionalId = professionalIdFromSession(request.admin!);
  const query = adminPostStatusQuerySchema.parse(request.query);
  const data = await adminBlogService.list(professionalId, query.estado);

  response.status(200).json({ data });
});

export const getAdminPost = asyncHandler(async (request, response) => {
  const professionalId = professionalIdFromSession(request.admin!);
  const { id } = adminPostIdParamSchema.parse(request.params);
  const data = await adminBlogService.detail(professionalId, id);

  response.status(200).json({ data });
});

export const createAdminPost = asyncHandler(async (request, response) => {
  const professionalId = professionalIdFromSession(request.admin!);
  const payload = adminPostPayloadSchema.parse(request.body);
  const data = await adminBlogService.create(professionalId, payload);

  response.status(201).json({ data });
});

export const updateAdminPost = asyncHandler(async (request, response) => {
  const professionalId = professionalIdFromSession(request.admin!);
  const { id } = adminPostIdParamSchema.parse(request.params);
  const payload = adminPostPayloadSchema.parse(request.body);
  const data = await adminBlogService.update(professionalId, id, payload);

  response.status(200).json({ data });
});

export const updateAdminPostStatus = asyncHandler(async (request, response) => {
  const professionalId = professionalIdFromSession(request.admin!);
  const { id } = adminPostIdParamSchema.parse(request.params);
  const payload = adminPostStatusSchema.parse(request.body);
  const data = await adminBlogService.updateStatus(professionalId, id, payload.estado);

  response.status(200).json({ data });
});

export const deleteAdminPost = asyncHandler(async (request, response) => {
  const professionalId = professionalIdFromSession(request.admin!);
  const { id } = adminPostIdParamSchema.parse(request.params);
  await adminBlogService.remove(professionalId, id);

  response.status(200).json({ data: { message: "Publicación eliminada correctamente." } });
});
