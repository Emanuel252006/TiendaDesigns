import bcrypt from 'bcryptjs';
import { createTokenAccesss } from '../libs/jwt.js';
import jwt from 'jsonwebtoken';
import { TOKEN_SECRET } from "../config.js";
import { findUserByEmail, getUserById } from '../models/userModel.js'; // Asegúrate de importar getUserById para verifyToken

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
        const isMatch = bcrypt.compare(Contrasena, userFound.Contrasena);

        if (!isMatch) {
            return res.status(400).json({ message: "Credenciales inválidas." });
        }

        // CAMBIO: Usar userFound.UsuarioID y 'id' como clave en el payload del token
        const token = await createTokenAccesss({ id: userFound.UsuarioID });

        if (!token) {
            return res.status(500).json({ message: "Error al generar el token." });
        }

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
        console.error("Error en login:", error); // Añadido log para depuración
        res.status(500).json({ message: "Error interno del servidor durante el inicio de sesión." });
    }
};

export const logout = (req, res) => {
    res.cookie('token', '', {
        expires: new Date(0), // Expira la cookie inmediatamente
        httpOnly: process.env.NODE_ENV === 'production',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
    });
    return res.sendStatus(200); // 200 OK: la operación fue exitosa
};

export const profile = async (req, res) => {
    try {
        const result = await getUserById(req.user.id); // Asumiendo que req.user.id tiene el UsuarioID

        if (result.length === 0) {
            return res.status(400).json({ message: "Usuario no encontrado." });
        }

        const userFound = result[0];

        res.status(200).json({
            UsuarioID: userFound.UsuarioID,
            NombreUsuario: userFound.NombreUsuario,
            Correo: userFound.Correo,
            Rol: userFound.Rol
        });
    } catch (error) {
        console.error("Error en profile:", error);
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
                Rol: userData.Rol
            });
        });
    } catch (error) {
        console.error("Error en verifyToken:", error);
        res.status(500).json({ message: "Error interno del servidor al verificar el token." });
    }
};