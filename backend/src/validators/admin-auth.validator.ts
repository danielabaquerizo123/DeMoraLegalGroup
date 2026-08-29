import { z } from "zod";

const usernameSchema = z
  .string()
  .trim()
  .min(3, "El usuario debe tener al menos 3 caracteres.")
  .max(80, "El usuario es demasiado largo.")
  .regex(/^[a-z0-9._-]+$/i, "El usuario solo puede incluir letras, números, punto, guion y guion bajo.")
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(120, "La contraseña es demasiado larga.")
  .regex(/[A-Za-z]/, "La contraseña debe incluir al menos una letra.")
  .regex(/[0-9]/, "La contraseña debe incluir al menos un número.");

export const adminLoginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, "La contraseña es obligatoria."),
});

export const adminChangePasswordSchema = z.object({
  password: passwordSchema,
});
