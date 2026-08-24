import type { getAdminSession } from "../services/admin-auth.service";

declare global {
  namespace Express {
    interface Request {
      admin?: NonNullable<Awaited<ReturnType<typeof getAdminSession>>>;
    }
  }
}

export {};
