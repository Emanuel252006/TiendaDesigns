import bcrypt from 'bcryptjs';
import { createTokenAccesss } from '../libs/jwt.js'; // Asegúrate de que esta ruta sea correcta
import jwt from 'jsonwebtoken';
import { TOKEN_SECRET } from "../config.js"; // Asegúrate de que esta ruta sea correcta y TOKEN_SECRET esté definido

import {
    // Hemos reemplazado 'insertUser' por 'insertUserWithAddress'
    insertUserWithAddress, 
    getAllUsers,
    getUserById as getUserByIdModel, // Renombramos para evitar conflicto de nombres con el export del controller
    updateUserById,
    deleteUserById,
    findUserByUsername, // Aunque no se usa directamente en este controlador, se mantiene por si acaso.
    findUserByEmail
} from '../models/userModel.js';


/**
 * Crea un nuevo usuario y su dirección asociada.
 * Espera los datos del usuario y de la dirección en el cuerpo de la solicitud.
 */
export const createUser = async (req, res) => {
    // Desestructuramos los campos del usuario y de la dirección del req.body
    const { 
        NombreUsuario, 
        Contrasena, 
        Correo, 
        Rol,
        Direccion, // Campos de la dirección
        Ciudad,
        Pais,
        CodigoPostal
    } = req.body;

    // Preparamos los objetos para el modelo
    const userData = { NombreUsuario, Contrasena, Correo, Rol };
    const addressData = { Direccion, Ciudad, Pais, CodigoPostal };

    try {
        // Llamamos a la nueva función del modelo que maneja ambas inserciones en una transacción
        const newUserAndAddress = await insertUserWithAddress(userData, addressData);

        console.log("📩 Usuario y Dirección registrados en createUser:", newUserAndAddress);

        if (!newUserAndAddress || !newUserAndAddress.UsuarioID) {
            return res.status(500).json({ message: "Error al crear el usuario y/o dirección: No se insertaron filas." });
        }

        res.status(201).json({ 
            message: "Usuario y dirección creados exitosamente", 
            UsuarioID: newUserAndAddress.UsuarioID,
            DireccionID: newUserAndAddress.DireccionID 
        });
    } catch (error) {
        console.error("Error en createUser:", error.message);
      
        res.status(500).json({ message: "Error interno en el servidor al registrar usuario y dirección" });
    }
};


export const getUsers = async (req, res) => {
    try {
        const result = await getAllUsers(); 
        res.status(200).json(result);
    } catch (error) {
        console.error("Error en getUsers:", error);
        res.status(500).json({ message: "Error al obtener los usuarios", error: error.message });
    }
};

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await getUserByIdModel(id); 
        if (result.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        res.status(200).json(result[0]); 
    } catch (error) {
        console.error("Error en getUserById:", error);
        res.status(500).json({ message: "Error al obtener el usuario", error: error.message });
    }
};


export const updateUser = async (req, res) => {
    const { id } = req.params;
    
    const { NombreUsuario, Correo, Contrasena, Rol, Direccion, Ciudad, Pais, CodigoPostal } = req.body;

    const userFields = {};
    if (NombreUsuario !== undefined) userFields.NombreUsuario = NombreUsuario;
    if (Correo !== undefined) userFields.Correo = Correo;
    if (Rol !== undefined) userFields.Rol = Rol;

    const addressFields = {};
    if (Direccion !== undefined) addressFields.Direccion = Direccion;
    if (Ciudad !== undefined) addressFields.Ciudad = Ciudad;
    if (Pais !== undefined) addressFields.Pais = Pais;
    if (CodigoPostal !== undefined) addressFields.CodigoPostal = CodigoPostal;

    try {
        
        const result = await updateUserById(id, userFields, addressFields, Contrasena);

      
        if (result && (result.rowsAffectedUser > 0 || result.rowsAffectedAddress > 0)) {
            res.status(200).json({ message: "Usuario y/o dirección actualizados exitosamente" });
        } else {
            res.status(404).json({ message: "Usuario no encontrado o no se realizaron cambios." });
        }
    } catch (error) {
        console.error("Error en updateUser:", error);
        res.status(500).json({ message: "Error al actualizar el usuario y/o dirección", error: error.message });
    }
};


export const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await deleteUserById(id); 
        if (result && result.rowsAffected && result.rowsAffected[0] > 0) {
            res.status(200).json({ message: "Usuario y datos asociados eliminados exitosamente" });
        } else {
            res.status(404).json({ message: "Usuario no encontrado para eliminar." });
        }
    } catch (error) {
        console.error("Error en deleteUser:", error);
        res.status(500).json({ message: "Error al eliminar el usuario y sus datos asociados", error: error.message });
    }
};


export const login = async (req, res) => {
    const { Correo, Contrasena } = req.body;

    if (!Correo || !Contrasena) {
        return res.status(400).json({ message: "Se requieren tanto el Correo Electrónico como la Contraseña." });
    }

    try {
        const rows = await findUserByEmail(Correo); 

        if (rows.length === 0) {
            return res.status(400).json({ message: "Credenciales inválidas." });
        }

        const userFound = rows[0];

        if (!userFound.Contrasena) {
            return res.status(500).json({ message: "Error interno: La contraseña del usuario está ausente en la base de datos." });
        }

        const isMatch = await bcrypt.compare(Contrasena, userFound.Contrasena);

        if (!isMatch) {
            return res.status(400).json({ message: "Credenciales inválidas." });
        }

        const token = await createTokenAccesss({ id: userFound.UsuarioID }); 

        if (!token) {
            return res.status(500).json({ message: "Error al generar el token." });
        }

        res.cookie('token', token, {
            httpOnly: process.env.NODE_ENV === 'production', 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'Lax', 
        });

        res.status(200).json({ 
            UsuarioID: userFound.UsuarioID,
            NombreUsuario: userFound.NombreUsuario,
            Correo: userFound.Correo,
            Rol: userFound.Rol,
            
        });
    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ message: "Error interno del servidor durante el inicio de sesión." });
    }
};


export const logao = (req, res) => {
    res.cookie('token', '', {
        expires: new Date(0),
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax'
    });
    return res.sendStatus(200);
};


export const profile = async (req, res) => {
    try {
        
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "No autenticado. ID de usuario no disponible." });
        }

       
        const result = await getUserByIdModel(req.user.id); 

        if (result.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        const userFound = result[0];

        res.status(200).json({ 
            UsuarioID: userFound.UsuarioID,
            NombreUsuario: userFound.NombreUsuario,
            Correo: userFound.Correo,
            Rol: userFound.Rol,
            FechaRegistro: userFound.FechaRegistro, 
           
            DireccionID: userFound.DireccionID,
            Direccion: userFound.Direccion,
            Ciudad: userFound.Ciudad,
            Pais: userFound.Pais,
            CodigoPostal: userFound.CodigoPostal
        });
    } catch (error) {
        console.error("Error en profile:", error);
        res.status(500).json({ message: "Error interno del servidor al obtener el perfil", error: error.message });
    }
};


export const verifyToken = async (req, res) => {
    const { token } = req.cookies;

    if (!token) {
        return res.status(401).json({ message: "No autorizado: No se proporcionó token." });
    }

    try {
        jwt.verify(token, TOKEN_SECRET, async (err, user) => {
            if (err) {
              
                return res.status(403).json({ message: "No autorizado: Token inválido o expirado." });
            }

            
            const result = await getUserByIdModel(user.id); 

            if (result.length === 0) {
                return res.status(401).json({ message: "No autorizado: Usuario asociado al token no encontrado." });
            }

            const userFound = result[0];

           
            return res.json({
                valid: true, 
                UsuarioID: userFound.UsuarioID,
                NombreUsuario: userFound.NombreUsuario,
                Correo: userFound.Correo,
                Rol: userFound.Rol,
               
                DireccionID: userFound.DireccionID,
                Direccion: userFound.Direccion,
                Ciudad: userFound.Ciudad,
                Pais: userFound.Pais,
                CodigoPostal: userFound.CodigoPostal,
            });
        });
    } catch (error) {
        console.error("Error en verifyToken:", error);
        res.status(500).json({ message: "Error interno del servidor al verificar el token.", error: error.message });
    }
};