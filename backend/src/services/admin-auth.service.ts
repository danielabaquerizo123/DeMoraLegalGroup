import { EstadoUsuarioAdmin } from "../generated/prisma/enums";
import { prisma } from "../config/prisma";
import { HttpError } from "../utils/http-error";
import { hashPassword, verifyPassword } from "./password.service";
import { addDays, createPlainToken, hashToken } from "./token.service";

type RequestMeta = {
  ip?: string;
  userAgent?: string;
};

type LoginInput = {
  username: string;
  password: string;
};

type ChangePasswordInput = {
  currentPassword: string;
  password: string;
  confirmPassword: string;
};

const sessionCookieName = process.env.AUTH_COOKIE_NAME || "demora_admin_session";
const sessionDays = Number(process.env.AUTH_SESSION_DAYS || 30);
const configuredSameSite = process.env.AUTH_COOKIE_SAME_SITE?.trim().toLowerCase();
const maxLoginAttempts = 5;
const loginWindowMinutes = 15;

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function toProfessional(profesional: {
  id: string;
  nombres: string;
  apellidos: string;
  slug: string;
  cargo: string | null;
  fotoUrl: string | null;
} | null) {
  if (!profesional) {
    return null;
  }

  return {
    id: profesional.id,
    nombres: profesional.nombres,
    apellidos: profesional.apellidos,
    nombreCompleto: `${profesional.nombres} ${profesional.apellidos}`,
    slug: profesional.slug,
    cargo: profesional.cargo,
    fotoUrl: profesional.fotoUrl,
  };
}

function publicAdminUser(user: {
  id: string;
  nombre: string;
  username: string | null;
  email: string | null;
  estado: EstadoUsuarioAdmin;
  profesional: Parameters<typeof toProfessional>[0];
}) {
  return {
    id: user.id,
    nombre: user.nombre,
    username: user.username,
    email: user.email,
    estado: user.estado,
    profesional: toProfessional(user.profesional),
  };
}

export function getSessionCookieName() {
  return sessionCookieName;
}

export function buildSessionCookie(token: string, expiresAt: Date) {
  const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  const sameSite = configuredSameSite || (process.env.NODE_ENV === "production" ? "none" : "lax");
  const parts = [`${sessionCookieName}=${token}`, "HttpOnly", "Path=/", `SameSite=${sameSite === "none" ? "None" : "Lax"}`, `Max-Age=${maxAge}`];

  if (process.env.NODE_ENV === "production" || sameSite === "none") {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function buildClearSessionCookie() {
  const sameSite = configuredSameSite || (process.env.NODE_ENV === "production" ? "none" : "lax");
  const parts = [`${sessionCookieName}=`, "HttpOnly", "Path=/", `SameSite=${sameSite === "none" ? "None" : "Lax"}`, "Max-Age=0"];

  if (process.env.NODE_ENV === "production" || sameSite === "none") {
    parts.push("Secure");
  }

  return parts.join("; ");
}

async function assertLoginAllowed(username: string, ip?: string) {
  const since = new Date(Date.now() - loginWindowMinutes * 60 * 1000);
  const attempts = await prisma.intentoLoginAdmin.count({
    where: {
      username,
      exitoso: false,
      creadoEn: { gte: since },
      ...(ip ? { ip } : {}),
    },
  });

  if (attempts >= maxLoginAttempts) {
    throw new HttpError(429, "Demasiados intentos. Inténtalo nuevamente en unos minutos.");
  }
}

export async function loginAdmin(input: LoginInput, meta: RequestMeta) {
  const username = normalizeUsername(input.username);
  await assertLoginAllowed(username, meta.ip);

  const user = await prisma.usuarioAdmin.findUnique({
    where: { username },
    include: { profesional: true },
  });
  const isValidPassword = user ? await verifyPassword(input.password, user.passwordHash) : false;

  if (!user || !isValidPassword) {
    await prisma.intentoLoginAdmin.create({ data: { email: username, username, ip: meta.ip, exitoso: false, motivo: "INVALID_CREDENTIALS" } });
    throw new HttpError(401, "Usuario o contraseña incorrectos.");
  }

  if (user.estado !== EstadoUsuarioAdmin.ACTIVO) {
    await prisma.intentoLoginAdmin.create({ data: { email: username, username, ip: meta.ip, exitoso: false, motivo: "INACTIVE" } });
    throw new HttpError(403, "Esta cuenta administrativa no está activa.");
  }

  if (!user.profesional) {
    await prisma.intentoLoginAdmin.create({ data: { email: username, username, ip: meta.ip, exitoso: false, motivo: "NO_PROFESSIONAL" } });
    throw new HttpError(403, "Esta cuenta no está vinculada a un profesional.");
  }

  const plainSessionToken = createPlainToken();
  const expiresAt = addDays(new Date(), sessionDays);
  await prisma.$transaction([
    prisma.sesionAdmin.create({
      data: {
        usuarioId: user.id,
        tokenHash: hashToken(plainSessionToken),
        expiraEn: expiresAt,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    }),
    prisma.usuarioAdmin.update({ where: { id: user.id }, data: { ultimoAccesoEn: new Date() } }),
    prisma.intentoLoginAdmin.create({ data: { email: username, username, ip: meta.ip, exitoso: true } }),
  ]);

  return {
    user: publicAdminUser(user),
    sessionToken: plainSessionToken,
    expiresAt,
  };
}

export async function getAdminSession(token: string) {
  const session = await prisma.sesionAdmin.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { usuario: { include: { profesional: true } } },
  });

  if (!session || session.revocadaEn || session.expiraEn < new Date() || session.usuario.estado !== EstadoUsuarioAdmin.ACTIVO || !session.usuario.profesional) {
    return null;
  }

  await prisma.sesionAdmin.update({
    where: { id: session.id },
    data: { ultimoUsoEn: new Date() },
  });

  return {
    sessionId: session.id,
    user: publicAdminUser(session.usuario),
  };
}

export async function logoutAdmin(token: string | null) {
  if (!token) {
    return;
  }

  await prisma.sesionAdmin.updateMany({
    where: {
      tokenHash: hashToken(token),
      revocadaEn: null,
    },
    data: {
      revocadaEn: new Date(),
    },
  });
}

export async function changeAdminPassword(userId: string, input: ChangePasswordInput) {
  if (input.password !== input.confirmPassword) {
    throw new HttpError(400, "Las contraseñas no coinciden.");
  }

  const user = await prisma.usuarioAdmin.findUnique({ where: { id: userId } });
  const isValidPassword = user ? await verifyPassword(input.currentPassword, user.passwordHash) : false;

  if (!user || !isValidPassword) {
    throw new HttpError(401, "La contraseña actual no es correcta.");
  }

  const passwordHashed = await hashPassword(input.password);
  await prisma.usuarioAdmin.update({
    where: { id: userId },
    data: { passwordHash: passwordHashed },
  });
}
