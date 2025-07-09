// src/schemas/userSchemas.ts
import { z, ZodIssueCode } from "zod";

// No acepta tildes, espacios ni ciertos caracteres
const noAccents     = /[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ]/;
const noSpaces      = /\s/;
const forbiddenChars = /[<>&"'/]/;
// Regex más rígida para email
// Regex mejorado: no permite "@.", ni dominios que empiecen o terminen en punto,
// ni dobles puntos seguidos en todo el string
const strictEmailRegex =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Para validar contraseña
const hasUpper   = /[A-Z]/;
const hasLower   = /[a-z]/;
const hasDigit   = /\d/;
const hasSpecial = /[-_@#*]/;

export const registerSchema = z.object({
  NombreUsuario: z.string().superRefine((val, ctx) => {
    if (forbiddenChars.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "El nombre de usuario no puede contener <, >, &, \", ' o /",
      });
      return;
    }
    if (noAccents.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "El nombre de usuario no puede contener tildes",
      });
      return;
    }
    if (noSpaces.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "El nombre de usuario no puede contener espacios",
      });
      return;
    }
    if (val.trim() === "") {
      ctx.addIssue({
        code: ZodIssueCode.too_small,
        minimum: 1,
        type: "string",
        inclusive: true,
        message: "El nombre de usuario es requerido",
      });
    }
  }),

 Correo: z.string().superRefine((val, ctx) => {
    if (noAccents.test(val)) {
      ctx.addIssue({ code: ZodIssueCode.custom, message: "El correo no puede contener tildes" });
      return;
    }
    if (noSpaces.test(val)) {
      ctx.addIssue({ code: ZodIssueCode.custom, message: "El correo no puede contener espacios" });
      return;
    }
    if (val.trim() === "") {
      ctx.addIssue({ code: ZodIssueCode.too_small, minimum: 1, type: "string", inclusive: true, message: "El correo es requerido" });
      return;
    }
    if (!strictEmailRegex.test(val)) {
      ctx.addIssue({ code: ZodIssueCode.custom, message: "Formato de correo inválido" });
    }
  }),


  Contrasena: z.string().superRefine((val, ctx) => {
    if (forbiddenChars.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "La contraseña no puede contener <, >, &, \", ' o /",
      });
      return;
    }
    if (noAccents.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "La contraseña no puede contener tildes",
      });
      return;
    }
    if (noSpaces.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "La contraseña no puede contener espacios",
      });
      return;
    }
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
    }
  }),

  Rol: z.string().optional(),

 Direccion: z
  .string()
  .superRefine((val, ctx) => {
    if (forbiddenChars.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "La dirección no puede contener <, >, &, \", ' o /",
      });
      return;
    }
    if (noAccents.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "La dirección no puede contener tildes",
      });
      return;
    }
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

  Ciudad: z.string().superRefine((val, ctx) => {
    if (forbiddenChars.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "La ciudad no puede contener <, >, &, \", ' o /",
      });
      return;
    }
    if (noAccents.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "La ciudad no puede contener tildes",
      });
      return;
    }
    if (noSpaces.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "La ciudad no puede contener espacios",
      });
      return;
    }
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

  Pais: z.string().superRefine((val, ctx) => {
    if (forbiddenChars.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "El país no puede contener <, >, &, \", ' o /",
      });
      return;
    }
    if (noAccents.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "El país no puede contener tildes",
      });
      return;
    }
    if (noSpaces.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "El país no puede contener espacios",
      });
      return;
    }
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

  CodigoPostal: z.string().superRefine((val, ctx) => {
    if (forbiddenChars.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "El código postal no puede contener <, >, &, \", ' o /",
      });
      return;
    }
    if (noAccents.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "El código postal no puede contener tildes",
      });
      return;
    }
    if (noSpaces.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "El código postal no puede contener espacios",
      });
      return;
    }
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

  // Validación de confirmación de contraseña
  confirmPassword: z.string().superRefine((val, ctx) => {
    if (val.trim() === "") {
      ctx.addIssue({
        code: ZodIssueCode.too_small,
        minimum: 1,
        type: "string",
        inclusive: true,
        message: "La confirmación de contraseña es requerida",
      });
      return;
    }
  }),
}).refine((data) => data.Contrasena === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"], // Esto hace que el error aparezca en el campo confirmPassword
});

export const loginSchema = z.object({
  Correo: z.string().superRefine((val, ctx) => {
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
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "Formato de correo inválido",
      });
    }
  }),

  Contrasena: z
    .string()
    .min(1, { message: "La contraseña es requerida" }),
});

export const profileUpdateSchema = z.object({
  NombreUsuario: z.string().optional().superRefine((val, ctx) => {
    if (val === undefined || val === null) return; // Campo opcional, no validar si no está presente
    if (forbiddenChars.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "El nombre de usuario no puede contener <, >, &, \", ' o /",
      });
      return;
    }
    if (noAccents.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "El nombre de usuario no puede contener tildes",
      });
      return;
    }
    if (noSpaces.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "El nombre de usuario no puede contener espacios",
      });
      return;
    }
    if (val.trim() === "") {
      ctx.addIssue({
        code: ZodIssueCode.too_small,
        minimum: 1,
        type: "string",
        inclusive: true,
        message: "El nombre de usuario es requerido",
      });
    }
  }),

  Correo: z.string().optional().superRefine((val, ctx) => {
    if (val === undefined || val === null) return; // Campo opcional, no validar si no está presente
    if (noAccents.test(val)) {
      ctx.addIssue({ code: ZodIssueCode.custom, message: "El correo no puede contener tildes" });
      return;
    }
    if (noSpaces.test(val)) {
      ctx.addIssue({ code: ZodIssueCode.custom, message: "El correo no puede contener espacios" });
      return;
    }
    if (val.trim() === "") {
      ctx.addIssue({ code: ZodIssueCode.too_small, minimum: 1, type: "string", inclusive: true, message: "El correo es requerido" });
      return;
    }
    if (!strictEmailRegex.test(val)) {
      ctx.addIssue({ code: ZodIssueCode.custom, message: "Formato de correo inválido" });
    }
  }),

  Direccion: z.string().optional().superRefine((val, ctx) => {
    if (val === undefined || val === null) return; // Campo opcional, no validar si no está presente
    if (forbiddenChars.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "La dirección no puede contener <, >, &, \", ' o /",
      });
      return;
    }
    if (noAccents.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "La dirección no puede contener tildes",
      });
      return;
    }
    if (noSpaces.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "La dirección no puede contener espacios",
      });
      return;
    }
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

  Ciudad: z.string().optional().superRefine((val, ctx) => {
    if (val === undefined || val === null) return; // Campo opcional, no validar si no está presente
    if (forbiddenChars.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "La ciudad no puede contener <, >, &, \", ' o /",
      });
      return;
    }
    if (noAccents.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "La ciudad no puede contener tildes",
      });
      return;
    }
    if (noSpaces.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "La ciudad no puede contener espacios",
      });
      return;
    }
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

  Pais: z.string().optional().superRefine((val, ctx) => {
    if (val === undefined || val === null) return; // Campo opcional, no validar si no está presente
    if (forbiddenChars.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "El país no puede contener <, >, &, \", ' o /",
      });
      return;
    }
    if (noAccents.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "El país no puede contener tildes",
      });
      return;
    }
    if (noSpaces.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "El país no puede contener espacios",
      });
      return;
    }
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

  CodigoPostal: z.string().optional().superRefine((val, ctx) => {
    if (val === undefined || val === null) return; // Campo opcional, no validar si no está presente
    if (forbiddenChars.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "El código postal no puede contener <, >, &, \", ' o /",
      });
      return;
    }
    if (noAccents.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "El código postal no puede contener tildes",
      });
      return;
    }
    if (noSpaces.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "El código postal no puede contener espacios",
      });
      return;
    }
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

// Schema para cambio de contraseña
export const changePasswordSchema = z.object({
  currentPassword: z.string().superRefine((val, ctx) => {
    if (!val || val.trim() === "") {
      ctx.addIssue({
        code: ZodIssueCode.too_small,
        minimum: 1,
        type: "string",
        inclusive: true,
        message: "La contraseña actual es requerida",
      });
      return;
    }
    if (forbiddenChars.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "La contraseña actual no puede contener <, >, &, \" ' o /",
      });
      return;
    }
    if (noAccents.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "La contraseña actual no puede contener tildes",
      });
      return;
    }
    if (noSpaces.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "La contraseña actual no puede contener espacios",
      });
      return;
    }
  }),
  newPassword: z.string().superRefine((val, ctx) => {
    if (!val || val.trim() === "") {
      ctx.addIssue({
        code: ZodIssueCode.too_small,
        minimum: 8,
        type: "string",
        inclusive: true,
        message: "La nueva contraseña es requerida",
      });
      return;
    }
    if (val.length < 8) {
      ctx.addIssue({
        code: ZodIssueCode.too_small,
        minimum: 8,
        type: "string",
        inclusive: true,
        message: "La nueva contraseña debe tener al menos 8 caracteres",
      });
      return;
    }
    if (forbiddenChars.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "La nueva contraseña no puede contener <, >, &, \" ' o /",
      });
      return;
    }
    if (noAccents.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "La nueva contraseña no puede contener tildes",
      });
      return;
    }
    if (noSpaces.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "La nueva contraseña no puede contener espacios",
      });
      return;
    }
    if (!hasUpper.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "La nueva contraseña debe incluir al menos una letra mayúscula",
      });
      return;
    }
    if (!hasLower.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "La nueva contraseña debe incluir al menos una letra minúscula",
      });
      return;
    }
    if (!hasDigit.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "La nueva contraseña debe incluir al menos un número",
      });
      return;
    }
    if (!hasSpecial.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "La nueva contraseña debe incluir al menos un carácter especial",
      });
    }
  }),
  confirmPassword: z.string().superRefine((val, ctx) => {
    if (!val || val.trim() === "") {
      ctx.addIssue({
        code: ZodIssueCode.too_small,
        minimum: 1,
        type: "string",
        inclusive: true,
        message: "La confirmación de contraseña es requerida",
      });
    }
  })
}).superRefine((data, ctx) => {
  if (data.currentPassword && data.newPassword && data.currentPassword === data.newPassword) {
    ctx.addIssue({
      code: ZodIssueCode.custom,
      message: "La nueva contraseña no puede ser igual a la actual",
      path: ["newPassword"],
    });
  }
  if (data.newPassword !== data.confirmPassword) {
    ctx.addIssue({
      code: ZodIssueCode.custom,
      message: "La confirmación no coincide con la nueva contraseña",
      path: ["confirmPassword"],
    });
  }
});

export const resetPasswordSchema = z.object({
  correo: z.string().superRefine((val, ctx) => {
    if (noAccents.test(val)) {
      ctx.addIssue({ code: ZodIssueCode.custom, message: "El correo no puede contener tildes" });
      return;
    }
    if (noSpaces.test(val)) {
      ctx.addIssue({ code: ZodIssueCode.custom, message: "El correo no puede contener espacios" });
      return;
    }
    if (val.trim() === "") {
      ctx.addIssue({ code: ZodIssueCode.too_small, minimum: 1, type: "string", inclusive: true, message: "El correo es requerido" });
      return;
    }
    if (!strictEmailRegex.test(val)) {
      ctx.addIssue({ code: ZodIssueCode.custom, message: "Formato de correo inválido" });
    }
  }),
  codigo: z.string().superRefine((val, ctx) => {
    if (!/^[0-9]{6}$/.test(val)) {
      ctx.addIssue({ code: ZodIssueCode.custom, message: "El código debe ser de 6 dígitos" });
    }
    if (val.trim() === "") {
      ctx.addIssue({ code: ZodIssueCode.too_small, minimum: 1, type: "string", inclusive: true, message: "El código es requerido" });
    }
  }),
  nuevaContrasena: z.string().superRefine((val, ctx) => {
    if (forbiddenChars.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: 'La contraseña no puede contener <, >, &, ", \' o /',
      });
      return;
    }
    if (noAccents.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "La contraseña no puede contener tildes",
      });
      return;
    }
    if (noSpaces.test(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "La contraseña no puede contener espacios",
      });
      return;
    }
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
    }
  })
});