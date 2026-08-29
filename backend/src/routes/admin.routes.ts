import { Router } from "express";
import {
  createAdminPost,
  deleteAdminPost,
  getAdminBlogSummary,
  getAdminPost,
  listAdminPosts,
  updateAdminPost,
  updateAdminPostStatus,
} from "../controllers/admin-blog.controller";
import { deleteAdminComment, listAdminComments, replyAdminComment } from "../controllers/blog-comment.controller";
import { requireAdminAuth } from "../middlewares/admin-auth.middleware";
import { adminAuthRoutes } from "./admin-auth.routes";

export const adminRoutes = Router();

adminRoutes.use("/auth", adminAuthRoutes);
adminRoutes.use("/blog", requireAdminAuth);
adminRoutes.get("/blog", getAdminBlogSummary);
adminRoutes.get("/blog/comentarios", listAdminComments);
adminRoutes.post("/blog/comentarios/:id/respuesta", replyAdminComment);
adminRoutes.delete("/blog/comentarios/:id", deleteAdminComment);
adminRoutes.get("/blog/publicaciones", listAdminPosts);
adminRoutes.post("/blog/publicaciones", createAdminPost);
adminRoutes.get("/blog/publicaciones/:id", getAdminPost);
adminRoutes.put("/blog/publicaciones/:id", updateAdminPost);
adminRoutes.patch("/blog/publicaciones/:id/estado", updateAdminPostStatus);
adminRoutes.delete("/blog/publicaciones/:id", deleteAdminPost);
