import bcrypt from 'bcryptjs';
import { createTokenAccesss } from '../libs/jwt.js';
import jwt from 'jsonwebtoken';
import { TOKEN_SECRET } from "../config.js";
import { findUserByEmail, getUserById, updateUserById, insertUserWithAddress, updateUserActivity, setUserInactive } from '../models/userModel.js'; // Asegúrate de importar getUserById para verifyToken
import { changePasswordSchema } from '../schemas/authSchemas.js';
import { sendVerificationCode } from '../services/emailService.js';
import { registerSchema } from '../schemas/authSchemas.js';
import { resetPasswordSchema } from '../schemas/authSchemas.js';

// Almacenamiento temporal en memoria para códigos de verificación y datos de usuario
const pendingVerifications = new Map(); // key: correo, value: { code, userData, expiresAt }
// Almacenamiento temporal en memoria para recuperación de contraseña
const passwordResetCodes = {}; // { correo: { codigo, timestamp, usado } }

export const login = async (req, res) => {
    // CAMBIO: Usar los nombres de campos correctos del frontend/esquema Zod
    

   const { Correo, Contrasena } = req.body; // <--- This is the crucial part

    if (!Correo || !Contrasena) { // <--- This validation needs to check Correo
        // The message here should be updated to reflect Correo
        return res.status(400).json({ message: "Se requieren tanto el Correo Electrónico como la Contraseña." });
    }

    try {
       const rows = await findUserByEmail(Correo);

        if (rows.length === 0) {
            return res.status(400).json({ message: "Usuario no encontrado." });
        }

        const userFound = rows[0];

        // CAMBIO: Comparar con el nombre de columna correcto
        const isMatch = await bcrypt.compare(Contrasena, userFound.Contrasena);
        


        if (!isMatch) {
            return res.status(400).json({ message: "Credenciales inválidas." });
        }

        // CAMBIO: Usar userFound.UsuarioID y 'id' como clave en el payload del token
        const token = await createTokenAccesss({ id: userFound.UsuarioID });

        if (!token) {
            return res.status(500).json({ message: "Error al generar el token." });
        }

        // Actualizar última actividad del usuario
        await updateUserActivity(userFound.UsuarioID);

        // Configuración de la cookie (importante para seguridad en producción)
        res.cookie('token', token, {
            httpOnly: process.env.NODE_ENV === 'production', // Solo accesible por el servidor en producción
            secure: process.env.NODE_ENV === 'production', // Solo enviar por HTTPS en producción
            sameSite: 'Lax', // Protección CSRF básica. Considera 'None' si necesitas llamadas cross-site con credenciales y HTTPS.
            // domain: 'tudominiofrontend.com' // Descomentar y configurar si tu API y frontend están en diferentes subdominios
        });

        // CAMBIO: Retornar los nombres de campos consistentes con la DB
        res.status(200).json({ // Cambiado a 200 OK, ya que no es una creación sino un login exitoso
            UsuarioID: userFound.UsuarioID,
            NombreUsuario: userFound.NombreUsuario,
            Correo: userFound.Correo, // Incluir otros datos relevantes que pueda tener el usuario
            Rol: userFound.Rol
        });
    } catch (error) {
        res.status(500).json({ message: "Error interno del servidor durante el inicio de sesión." });
    }
};

export const logout = async (req, res) => {
    console.log('🚨 PRUEBA - Controlador logout ejecutándose');
    try {
        console.log('🔍 Logout ejecutándose...');
        console.log('👤 Usuario en req.user:', req.user);
        
        if (req.user && req.user.UsuarioID) {
            console.log('✅ Marcando usuario inactivo:', req.user.UsuarioID);
            const result = await setUserInactive(req.user.UsuarioID);
            console.log('✅ Resultado setUserInactive:', result);
        } else {
            console.log('❌ No hay usuario en req.user o no tiene ID');
        }
    } catch (e) {
        console.error('❌ Error marcando inactivo en logout:', e);
    } finally {
        res.cookie('token', '', {
            expires: new Date(0), // Expira la cookie inmediatamente
            httpOnly: process.env.NODE_ENV === 'production',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
        });
        return res.sendStatus(200);
    }
};

export const profile = async (req, res) => {
    try {
        const result = await getUserById(req.user.UsuarioID);

        if (result.length === 0) {
            return res.status(400).json({ message: "Usuario no encontrado." });
        }

        const userFound = result[0];

        res.status(200).json({
            UsuarioID: userFound.UsuarioID,
            NombreUsuario: userFound.NombreUsuario,
            Correo: userFound.Correo,
            Telefono: userFound.Telefono,
            Rol: userFound.Rol,
            FechaRegistro: userFound.FechaRegistro,
            // Datos de dirección
            DireccionID: userFound.DireccionID,
            Direccion: userFound.Direccion,
            Ciudad: userFound.Ciudad,
            Pais: userFound.Pais,
            CodigoPostal: userFound.CodigoPostal
        });
    } catch (error) {
        res.status(500).json({ message: "Error interno del servidor." });
    }
};

export const verifyToken = async (req, res) => {
    const { token } = req.cookies;

    if (!token) {
        return res.status(401).json({ message: "No se proporcionó token de autenticación." });
    }

    try {
        jwt.verify(token, TOKEN_SECRET, async (err, decodedTokenPayload) => {
            if (err) {
                return res.status(403).json({ message: "Token de autenticación inválido o expirado." });
            }

            const userFound = await getUserById(decodedTokenPayload.id);

            if (!userFound || userFound.length === 0) {
                return res.status(401).json({ message: "Usuario asociado al token no encontrado." });
            }

            // Aquí devolvemos los datos completos del usuario
            const userData = userFound[0];
            return res.json({
                valid: true,
                UsuarioID: userData.UsuarioID,
                NombreUsuario: userData.NombreUsuario,
                Correo: userData.Correo,
                Telefono: userData.Telefono,
                Rol: userData.Rol,
                FechaRegistro: userData.FechaRegistro,
                // Datos de dirección
                DireccionID: userData.DireccionID,
                Direccion: userData.Direccion,
                Ciudad: userData.Ciudad,
                Pais: userData.Pais,
                CodigoPostal: userData.CodigoPostal
            });
        });
    } catch (error) {
        res.status(500).json({ message: "Error interno del servidor al verificar el token." });
    }
};

export const updateProfile = async (req, res) => {
    const userId = req.user.UsuarioID;
    const { NombreUsuario, Correo, Telefono, Direccion, Ciudad, Pais, CodigoPostal } = req.body;

    try {
        // Preparar los campos a actualizar
        const userFields = {};
        if (NombreUsuario !== undefined) userFields.NombreUsuario = NombreUsuario;
        if (Correo !== undefined) userFields.Correo = Correo;
        if (Telefono !== undefined) userFields.Telefono = Telefono;

        const addressFields = {};
        if (Direccion !== undefined) addressFields.Direccion = Direccion;
        if (Ciudad !== undefined) addressFields.Ciudad = Ciudad;
        if (Pais !== undefined) addressFields.Pais = Pais;
        if (CodigoPostal !== undefined) addressFields.CodigoPostal = CodigoPostal;

        // Verificar si hay campos para actualizar
        if (Object.keys(userFields).length === 0 && Object.keys(addressFields).length === 0) {
            return res.status(400).json({ message: "No se proporcionaron campos para actualizar." });
        }

        // Actualizar usuario y dirección
        const result = await updateUserById(userId, userFields, addressFields);

        if (result && (result.rowsAffectedUser > 0 || result.rowsAffectedAddress > 0)) {
            // Obtener los datos actualizados
            const updatedUser = await getUserById(userId);
            
            res.status(200).json({ 
                message: "Perfil actualizado exitosamente.",
                user: updatedUser[0]
            });
        } else {
            res.status(404).json({ message: "Usuario no encontrado o no se realizaron cambios." });
        }
    } catch (error) {
        res.status(500).json({ message: "Error interno del servidor al actualizar el perfil." });
    }
};

export const changePassword = async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.UsuarioID;

    // 1. Validar con Zod pero capturar los errores en vez de responder directamente
    let zodErrors = {};
    try {
        changePasswordSchema.parse(req.body);
    } catch (error) {
        if (error.errors) {
            error.errors.forEach((err) => {
                const fieldName = err.path[0];
                zodErrors[fieldName] = err.message;
            });
        }
    }

    try {
        // Obtener el usuario actual
        const userResult = await getUserById(userId);
        if (userResult.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        const user = userResult[0];

        // Verificar que la contraseña existe
        if (!user.Contrasena) {
            return res.status(400).json({ message: "Error: Usuario sin contraseña válida." });
        }

        // Solo si el campo currentPassword no tiene errores de Zod, verificar si es correcta
        if (!zodErrors.currentPassword) {
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.Contrasena);
            if (!isCurrentPasswordValid) {
                zodErrors.currentPassword = "La contraseña actual es incorrecta.";
            }
        }

        // Si hay errores, devolverlos todos juntos
        if (Object.keys(zodErrors).length > 0) {
            return res.status(400).json(zodErrors);
        }

        // Actualizar la contraseña en la base de datos
        await updateUserById(userId, {}, {}, newPassword);

        // Limpiar la cookie del token para forzar el logout
        res.cookie('token', '', {
            expires: new Date(0),
            httpOnly: process.env.NODE_ENV === 'production',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
        });

        res.status(200).json({ 
            message: "Contraseña actualizada exitosamente. Por favor, inicia sesión nuevamente.",
            logout: true
        });
    } catch (error) {
        res.status(500).json({ message: "Error interno del servidor al cambiar la contraseña." });
    }
};

// Endpoint para iniciar registro y enviar código
export const startRegister = async (req, res) => {
  // 1. Validar con Zod antes de cualquier otra cosa
  try {
    registerSchema.parse(req.body);
  } catch (error) {
    // Formatear errores igual que el middleware
    const errorObject = {};
    error.errors.forEach((err) => {
      const fieldName = err.path[0];
      if (errorObject[fieldName]) {
        errorObject[fieldName] = Array.isArray(errorObject[fieldName])
          ? [...errorObject[fieldName], err.message]
          : [errorObject[fieldName], err.message];
      } else {
        errorObject[fieldName] = err.message;
      }
    });
    return res.status(400).json(errorObject);
  }

  const { NombreUsuario, Contrasena, Correo, Telefono, Rol, Direccion, Ciudad, Pais, CodigoPostal } = req.body;

  // Validar que el correo no esté ya registrado
  const existing = await findUserByEmail(Correo);
  if (existing && existing.length > 0) {
    return res.status(400).json({ Correo: 'Este correo ya está registrado.' });
  }

  // Generar código de 6 dígitos
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutos

  // Guardar temporalmente los datos y el código
  pendingVerifications.set(Correo, {
    code,
    userData: { NombreUsuario, Contrasena, Correo, Telefono, Rol, Direccion, Ciudad, Pais, CodigoPostal },
    expiresAt
  });

  // Modo pruebas/desarrollo: permitir saltar envío de email y devolver el código
  if (process.env.SKIP_EMAIL_VERIFICATION === 'true') {
    return res.json({ success: true, message: 'Código generado (modo pruebas).', testCode: code });
  }

  // Enviar el código por email
  try {
    await sendVerificationCode(Correo, code);
    res.json({ success: true, message: 'Código de verificación enviado a tu correo.' });
  } catch (err) {
    console.error('Error enviando correo de verificación:', err);
    pendingVerifications.delete(Correo);
    res.status(500).json({ message: 'No se pudo enviar el correo de verificación.' });
  }
};

// Endpoint para verificar el código y completar el registro
export const verifyRegisterCode = async (req, res) => {
  const { Correo, code } = req.body;
  const pending = pendingVerifications.get(Correo);
  if (!pending) {
    return res.status(400).json({ message: 'No hay registro pendiente para este correo.' });
  }
  if (pending.expiresAt < Date.now()) {
    pendingVerifications.delete(Correo);
    return res.status(400).json({ message: 'El código ha expirado. Intenta registrarte de nuevo.' });
  }
  if (pending.code !== code) {
    return res.status(400).json({ code: 'Código incorrecto.' });
  }

  try {
    const bcrypt = await import('bcryptjs');
    const hashed = await bcrypt.default.hash(pending.userData.Contrasena, 10);
    const userToSave = { ...pending.userData, Contrasena: hashed };
    const addressToSave = {
      Direccion: pending.userData.Direccion,
      Ciudad: pending.userData.Ciudad,
      Pais: pending.userData.Pais,
      CodigoPostal: pending.userData.CodigoPostal
    };
    await insertUserWithAddress(userToSave, addressToSave);
    pendingVerifications.delete(Correo);
    res.json({ success: true, message: 'Registro completado. Ya puedes iniciar sesión.' });
  } catch (err) {
    res.status(500).json({ message: 'Error al crear el usuario.' });
  }
};

// Solicitar código de recuperación
export const forgotPassword = async (req, res) => {
    const { correo } = req.body;
    if (!correo) return res.status(400).json({ message: "El correo es requerido." });
    try {
        const rows = await findUserByEmail(correo);
        if (!rows || rows.length === 0) {
            return res.status(400).json({ message: "No existe una cuenta con ese correo." });
        }
        // Generar código aleatorio de 6 dígitos
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
        passwordResetCodes[correo] = {
            codigo,
            timestamp: Date.now(),
            usado: false
        };
        await sendVerificationCode(correo, codigo);
        return res.status(200).json({ message: "Código de recuperación enviado al correo." });
    } catch (error) {
        return res.status(500).json({ message: "Error enviando el código de recuperación." });
    }
};

// Verificar código y cambiar contraseña
export const resetPassword = async (req, res) => {
    // Validar con Zod antes de cualquier otra cosa (antes de chequear existencia de código)
    try {
        resetPasswordSchema.parse(req.body);
    } catch (error) {
        // Formatear errores igual que el registro
        const errorObject = {};
        error.errors.forEach((err) => {
            const fieldName = err.path[0];
            if (errorObject[fieldName]) {
                errorObject[fieldName] = Array.isArray(errorObject[fieldName])
                    ? [...errorObject[fieldName], err.message]
                    : [errorObject[fieldName], err.message];
            } else {
                errorObject[fieldName] = err.message;
            }
        });
        return res.status(400).json(errorObject);
    }
    const { correo, codigo, nuevaContrasena } = req.body;
    const data = passwordResetCodes[correo];
    if (!data) {
        return res.status(400).json({ message: "Debes solicitar un código primero." });
    }
    if (data.usado) {
        return res.status(400).json({ message: "El código ya fue usado. Solicita uno nuevo." });
    }
    // Verificar expiración (5 minutos)
    const ahora = Date.now();
    if (ahora - data.timestamp > 5 * 60 * 1000) {
        delete passwordResetCodes[correo];
        return res.status(400).json({ message: "El código ha expirado. Solicita uno nuevo." });
    }
    if (data.codigo !== codigo) {
        return res.status(400).json({ message: "El código es incorrecto." });
    }
    try {
        // Buscar usuario por correo
        const rows = await findUserByEmail(correo);
        if (!rows || rows.length === 0) {
            return res.status(400).json({ message: "No existe una cuenta con ese correo." });
        }
        // Actualizar contraseña usando updateUserById con plainPassword
        await updateUserById(rows[0].UsuarioID, {}, {}, nuevaContrasena);
        data.usado = true;
        delete passwordResetCodes[correo];
        return res.status(200).json({ message: "Contraseña actualizada correctamente." });
    } catch (error) {
        return res.status(500).json({ message: "Error actualizando la contraseña." });
    }
};