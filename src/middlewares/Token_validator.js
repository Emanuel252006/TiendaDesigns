import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";
import { updateUserActivity, getUserById } from "../models/userModel.js";

export const requiredAuth = async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({ message: "No autorizado" });
  }

  jwt.verify(token, TOKEN_SECRET, async (err, decodedTokenPayload) => {
    if (err) {
      return res.status(401).json({ message: "No autorizado" });
    }

    console.log('🔍 Debug - Token decodificado:', decodedTokenPayload);
    
    // Validar que el ID del token no sea undefined
    if (!decodedTokenPayload.id) {
      console.error('Error: Token payload no contiene ID válido');
      return res.status(401).json({ message: "Token inválido" });
    }
    
    try {
      // Obtener datos completos del usuario desde la base de datos
      const userData = await getUserById(decodedTokenPayload.id);
      
      if (!userData || userData.length === 0) {
        return res.status(401).json({ message: "Usuario no encontrado" });
      }
      
      // Asignar los datos completos del usuario a req.user
      req.user = userData[0];
      
      console.log('🔍 Debug - req.user después de obtener de BD:', req.user);
      console.log('🔍 Debug - req.user.Rol:', req.user?.Rol);
      
      // Actualizar actividad del usuario
      await updateUserActivity(decodedTokenPayload.id);
    } catch (error) {
      console.error('Error obteniendo datos del usuario:', error);
      return res.status(500).json({ message: "Error interno del servidor" });
    }
    
    next();
  });
};