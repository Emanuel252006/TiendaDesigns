import { z, ZodIssueCode } from "zod";

// Expresiones regulares
const hasUpper = /[A-Z]/;
const hasLower = /[a-z]/;
const hasDigit = /\d/;
const hasSpecial = /[-_@#*]/;

export const registerSchema = z.object({
  NombreUsuario: z
    .string()
    .superRefine((val, ctx) => {
      if (val.trim() === "") {
        ctx.addIssue({
          code: ZodIssueCode.too_small,
          minimum: 1,
          type: "string",
          inclusive: true,
          message: "El nombre de usuario es requerido",
        });
        return;
      }
      if (/\s/.test(val)) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          message: "El nombre de usuario no puede contener espacios",
        });
      }
    }),

  Correo: z
    .string()
    .superRefine((val, ctx) => {
      if (val.trim() === "") {
        ctx.addIssue({
          code: ZodIssueCode.too_small,
          minimum: 1,
          type: "string",
          inclusive: true,
          message: "El correo es requerido",
        });
        return;
      }
      if (/\s/.test(val)) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          message: "El correo no puede contener espacios",
        });
        return;
      }
      // validación de formato
      // puedes ajustar la regex o usar .email() pero aquí lo hacemos manual
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          message: "Formato de correo inválido",
        });
      }
    }),

  Contrasena: z
    .string()
    .superRefine((val, ctx) => {
      if (val === "") {
        ctx.addIssue({
          code: ZodIssueCode.too_small,
          minimum: 8,
          type: "string",
          inclusive: true,
          message: "La contraseña es requerida",
        });
        return;
      }
      if (val.length < 8) {
        ctx.addIssue({
          code: ZodIssueCode.too_small,
          minimum: 8,
          type: "string",
          inclusive: true,
          message: "La contraseña debe tener al menos 8 caracteres",
        });
        return;
      }
      if (!hasUpper.test(val)) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          message: "La contraseña debe incluir al menos una letra mayúscula",
        });
        return;
      }
      if (!hasLower.test(val)) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          message: "La contraseña debe incluir al menos una letra minúscula",
        });
        return;
      }
      if (!hasDigit.test(val)) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          message: "La contraseña debe incluir al menos un número",
        });
        return;
      }
      if (!hasSpecial.test(val)) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          message: "La contraseña debe incluir al menos un caracter como -_@#*",
        });
        return;
      }
      if (/\s/.test(val)) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          message: "La contraseña no puede contener espacios",
        });
      }
    }),

  Rol: z.string().optional(),

  Direccion: z
    .string()
    .superRefine((val, ctx) => {
      if (val.trim() === "") {
        ctx.addIssue({
          code: ZodIssueCode.too_small,
          minimum: 1,
          type: "string",
          inclusive: true,
          message: "La dirección es requerida",
        });
      }
    }),

  Ciudad: z
    .string()
    .superRefine((val, ctx) => {
      if (val.trim() === "") {
        ctx.addIssue({
          code: ZodIssueCode.too_small,
          minimum: 1,
          type: "string",
          inclusive: true,
          message: "La ciudad es requerida",
        });
      }
    }),

  Pais: z
    .string()
    .superRefine((val, ctx) => {
      if (val.trim() === "") {
        ctx.addIssue({
          code: ZodIssueCode.too_small,
          minimum: 1,
          type: "string",
          inclusive: true,
          message: "El país es requerido",
        });
      }
    }),

  CodigoPostal: z
    .string()
    .superRefine((val, ctx) => {
      if (val.trim() === "") {
        ctx.addIssue({
          code: ZodIssueCode.too_small,
          minimum: 1,
          type: "string",
          inclusive: true,
          message: "El código postal es requerido",
        });
      }
    }),
});

export const loginSchema = z.object({
  Correo: z
    .string()
    .superRefine((val, ctx) => {
      if (val.trim() === "") {
        ctx.addIssue({
          code: ZodIssueCode.too_small,
          minimum: 1,
          type: "string",
          inclusive: true,
          message: "El correo es requerido",
        });
        return;
      }
      if (/\s/.test(val)) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          message: "El correo no puede contener espacios",
        });
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          message: "Formato de correo inválido",
        });
      }
    }),

  Contrasena: z
    .string()
    .superRefine((val, ctx) => {
      if (val === "") {
        ctx.addIssue({
          code: ZodIssueCode.too_small,
          minimum: 8,
          type: "string",
          inclusive: true,
          message: "La contraseña es requerida",
        });
        return;
      }
      if (val.length < 8) {
        ctx.addIssue({
          code: ZodIssueCode.too_small,
          minimum: 8,
          type: "string",
          inclusive: true,
          message: "La contraseña debe tener al menos 8 caracteres",
        });
        return;
      }
      if (!hasUpper.test(val)) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          message: "La contraseña debe incluir al menos una letra mayúscula",
        });
        return;
      }
      if (!hasLower.test(val)) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          message: "La contraseña debe incluir al menos una letra minúscula",
        });
        return;
      }
      if (!hasDigit.test(val)) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          message: "La contraseña debe incluir al menos un número",
        });
        return;
      }
      if (!hasSpecial.test(val)) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          message: "La contraseña debe incluir al menos un carácter especial",
        });
        return;
      }
      if (/\s/.test(val)) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          message: "La contraseña no puede contener espacios",
        });
      }
    }),
});
