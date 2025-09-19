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
  const {
    NombreUsuario,
    Contrasena,
    Correo,
    Rol,
    Direccion,
    Ciudad,
    Pais,
    CodigoPostal
  } = req.body;

  // 1) Validar duplicado de correo
  const existing = await findUserByEmail(Correo);
  if (existing.length > 0) {
    return res.status(400).json({
      Correo: 'Ya existe un usuario registrado con ese correo.'
    });
  }

  // 2) Preparar datos y hashear la contraseña
  const hash = await bcrypt.hash(Contrasena, 10);
  const userData = { NombreUsuario, Contrasena: hash, Correo, Rol };
  const addressData = { Direccion, Ciudad, Pais, CodigoPostal };

  // 3) Insertar en transacción
  try {
    const newUserAndAddress = await insertUserWithAddress(userData, addressData);

    if (!newUserAndAddress?.UsuarioID) {
      return res.status(500).json({
        message: 'Error al crear el usuario y la dirección.'
      });
    }

    res.status(201).json({
      message: 'Usuario y dirección creados exitosamente.',
      UsuarioID: newUserAndAddress.UsuarioID,
      DireccionID: newUserAndAddress.DireccionID
    });
  } catch (error) {
    console.error('Error en createUser:', error);
    res.status(500).json({
      message: 'Error interno al registrar usuario y dirección.'
    });
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





export const profile = async (req, res) => {
    try {
        
        if (!req.user || !req.user.UsuarioID) {
            return res.status(401).json({ message: "No autenticado. ID de usuario no disponible." });
        }

       
        const result = await getUserByIdModel(req.user.UsuarioID); 

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

// Obtener datos básicos del usuario para checkout
export const getUserForCheckout = async (req, res) => {
  try {
    const userId = req.user.UsuarioID;
    
    const checkoutData = await getUserByIdModel(userId);
    
    if (checkoutData.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const user = checkoutData[0];
    
    res.status(200).json({
      success: true,
      data: {
        nombre: user.NombreUsuario,
        email: user.Correo,
        telefono: user.Telefono,
        direccion: user.Direccion,
        ciudad: user.Ciudad,
        pais: user.Pais,
        codigoPostal: user.CodigoPostal
      }
    });
  } catch (error) {
    console.error("Error en getUserForCheckout:", error);
    res.status(500).json({ message: "Error al obtener datos del usuario" });
  }
};

/**
 * Cambia la contraseña del usuario autenticado.
 * Espera la contraseña actual y la nueva en el cuerpo de la solicitud.
 */
export const changePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;

        // Obtener el usuario actual
        const currentUser = await getUserByIdModel(id);
        if (currentUser.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Verificar la contraseña actual
        const isPasswordValid = await bcrypt.compare(currentPassword, currentUser[0].Contrasena);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "La contraseña actual es incorrecta" });
        }

        // Hashear la nueva contraseña
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // Actualizar la contraseña
        const result = await updateUserById(id, { Contrasena: newPasswordHash }, {}, newPassword);
        
        if (result.rowsAffected[0] > 0) {
            res.status(200).json({ message: "Contraseña actualizada exitosamente" });
        } else {
            res.status(500).json({ message: "No se pudo actualizar la contraseña" });
        }
    } catch (error) {
        console.error("Error en changePassword:", error);
        res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

// Controlador para obtener estadísticas generales de usuarios
export const getUserStatistics = async (req, res) => {
    try {
        const { getActiveUsers, getUsersWithActiveCarts, getUsersByCountry, getUserStats } = await import('../models/userModel.js');
        
        const [activeUsers, usersWithCarts, usersByCountry, generalStats] = await Promise.all([
            getActiveUsers(),
            getUsersWithActiveCarts(),
            getUsersByCountry(),
            getUserStats()
        ]);

        res.status(200).json({
            success: true,
            data: {
                activeUsers,
                usersWithCarts,
                usersByCountry,
                generalStats
            }
        });
    } catch (error) {
        console.error("Error en getUserStatistics:", error);
        res.status(500).json({ 
            success: false,
            message: "Error al obtener estadísticas de usuarios", 
            error: error.message 
        });
    }
};

// Controlador para obtener solo usuarios con carritos activos
export const getActiveCartUsers = async (req, res) => {
    try {
        const { getUsersWithActiveCarts } = await import('../models/userModel.js');
        const usersWithCarts = await getUsersWithActiveCarts();
        
        res.status(200).json({
            success: true,
            data: usersWithCarts
        });
    } catch (error) {
        console.error("Error en getActiveCartUsers:", error);
        res.status(500).json({ 
            success: false,
            message: "Error al obtener usuarios con carritos activos", 
            error: error.message 
        });
    }
};

// Controlador para obtener solo distribución por países
export const getCountryDistribution = async (req, res) => {
    try {
        const { getUsersByCountry } = await import('../models/userModel.js');
        const usersByCountry = await getUsersByCountry();
        
        res.status(200).json({
            success: true,
            data: usersByCountry
        });
    } catch (error) {
        console.error("Error en getCountryDistribution:", error);
        res.status(500).json({ 
            success: false,
            message: "Error al obtener distribución por países", 
            error: error.message 
        });
    }
};

// Controlador temporal para limpiar direcciones duplicadas (solo para admin)
export const cleanDuplicateAddresses = async (req, res) => {
    try {
        // Verificar que el usuario sea admin
        if (req.user.Rol !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: "No tienes permisos para realizar esta acción"
            });
        }

        const { cleanDuplicateAddresses } = await import('../models/userModel.js');
        await cleanDuplicateAddresses();
        
        res.status(200).json({
            success: true,
            message: "Direcciones duplicadas limpiadas exitosamente"
        });
    } catch (error) {
        console.error("Error en cleanDuplicateAddresses:", error);
        res.status(500).json({ 
            success: false,
            message: "Error al limpiar direcciones duplicadas", 
            error: error.message 
        });
    }
};

// Controlador para heartbeat global (marcar todos los usuarios logueados como activos)
export const globalHeartbeat = async (req, res) => {
    try {
        const { markAllLoggedUsersAsActive } = await import('../models/userModel.js');
        const result = await markAllLoggedUsersAsActive();
        
        res.status(200).json({
            success: true,
            message: "Heartbeat global ejecutado",
            usersUpdated: result
        });
    } catch (error) {
        console.error("Error en globalHeartbeat:", error);
        res.status(500).json({ 
            success: false,
            message: "Error al ejecutar heartbeat global", 
            error: error.message 
        });
    }
};
