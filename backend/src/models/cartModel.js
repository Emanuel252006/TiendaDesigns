import { getPool } from '../db.js';

export const CartModel = {
  // Obtener el carrito completo de un usuario
  async getCartByUserId(userId) {
    const pool = await getPool();
    const [rows] = await pool.execute(`
      SELECT 
        ca.CarritoArticuloID,
        c.CarritoID,
        c.UsuarioID,
        ca.ProductoID,
        ca.TallaID,
        ca.Cantidad,
        c.FechaCreacion as FechaAgregado,
        p.NombreProducto,
        p.Descripcion,
        p.Precio,
        p.Imagen,
        COALESCE(t.NombreTalla, 'N/A') as NombreTalla,
        COALESCE(pt.Stock, p.Stock) as StockDisponible
      FROM Carritos c
      INNER JOIN CarritoArticulos ca ON c.CarritoID = ca.CarritoID
      INNER JOIN Productos p ON ca.ProductoID = p.ProductoID
      LEFT JOIN Tallas t ON ca.TallaID = t.TallaID
      LEFT JOIN ProductoTallas pt ON ca.ProductoID = pt.ProductoID AND ca.TallaID = pt.TallaID
      WHERE c.UsuarioID = ? AND ca.CarritoArticuloID IS NOT NULL
      ORDER BY c.FechaCreacion DESC
    `, [userId]);
    return rows;
  },

  // Agregar un producto al carrito
  async addToCart({ UsuarioID, ProductoID, TallaID, Cantidad }) {
    try {
      const pool = await getPool();

      // Buscar carrito existente del usuario
      const [carritoRows] = await pool.execute(
        'SELECT CarritoID FROM Carritos WHERE UsuarioID = ?',
        [UsuarioID]
      );

      let carritoId;

      if (carritoRows.length === 0) {
        // Crear nuevo carrito
        const [newCarritoResult] = await pool.execute(
          'INSERT INTO Carritos (UsuarioID) VALUES (?)',
          [UsuarioID]
        );
        carritoId = newCarritoResult.insertId;
      } else {
        carritoId = carritoRows[0].CarritoID;
      }

      // Verificar si el producto ya existe en el carrito
      const [existingItemRows] = await pool.execute(
        `SELECT CarritoArticuloID, Cantidad 
         FROM CarritoArticulos 
         WHERE CarritoID = ? AND ProductoID = ? AND (TallaID <=> ?)`,
        [carritoId, ProductoID, TallaID]
      );

      if (existingItemRows.length > 0) {
        // Actualizar cantidad existente
        const existingItem = existingItemRows[0];
        const nuevaCantidad = existingItem.Cantidad + Cantidad;

        await pool.execute(
          `UPDATE CarritoArticulos 
           SET Cantidad = ? 
           WHERE CarritoArticuloID = ?`,
          [nuevaCantidad, existingItem.CarritoArticuloID]
        );

        const [updatedRows] = await pool.execute(
          `SELECT CarritoArticuloID, ProductoID, TallaID, Cantidad 
           FROM CarritoArticulos 
           WHERE CarritoArticuloID = ?`,
          [existingItem.CarritoArticuloID]
        );
        return updatedRows[0];
      } else {
        // Crear nuevo ítem en el carrito
        const [insertResult] = await pool.execute(
          `INSERT INTO CarritoArticulos (CarritoID, ProductoID, TallaID, Cantidad)
           VALUES (?, ?, ?, ?)`,
          [carritoId, ProductoID, TallaID, Cantidad]
        );

        const [newItemRows] = await pool.execute(
          `SELECT CarritoArticuloID, ProductoID, TallaID, Cantidad 
           FROM CarritoArticulos 
           WHERE CarritoArticuloID = ?`,
          [insertResult.insertId]
        );
        return newItemRows[0];
      }
    } catch (error) {
      throw error;
    }
  },

  // Actualizar cantidad de un ítem en el carrito
  async updateCartItemQuantity(cartItemId, cantidad) {
    const pool = await getPool();
    
    try {
      // Si la cantidad es 0, eliminar el ítem
      if (cantidad <= 0) {
        return await this.removeFromCart(cartItemId);
      }
      
      // Obtener el CarritoID antes de actualizar
      const [cartItem] = await pool.execute(
        `SELECT CarritoID FROM CarritoArticulos 
         WHERE CarritoArticuloID = ?`,
        [cartItemId]
      );
      
      if (!cartItem[0]) {
        throw new Error('Ítem del carrito no encontrado');
      }
      
      const carritoId = cartItem[0].CarritoID;
      
      // Actualizar cantidad
      await pool.execute(
        `UPDATE CarritoArticulos SET Cantidad = ? WHERE CarritoArticuloID = ?`,
        [cantidad, cartItemId]
      );
      const [rows] = await pool.execute(
        `SELECT * FROM CarritoArticulos WHERE CarritoArticuloID = ?`,
        [cartItemId]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  // Eliminar un ítem del carrito
  async removeFromCart(cartItemId) {
    const pool = await getPool();
    
    try {
      // Primero obtener el CarritoID antes de eliminar
      const [cartItem] = await pool.execute(
        `SELECT CarritoID FROM CarritoArticulos 
         WHERE CarritoArticuloID = ?`,
        [cartItemId]
      );
      
      if (!cartItem[0]) {
        throw new Error('Ítem del carrito no encontrado');
      }
      
      const carritoId = cartItem[0].CarritoID;
      
      // Eliminar el ítem del carrito
      const [before] = await pool.execute(
        `SELECT * FROM CarritoArticulos WHERE CarritoArticuloID = ?`,
        [cartItemId]
      );
      await pool.execute(
        `DELETE FROM CarritoArticulos WHERE CarritoArticuloID = ?`,
        [cartItemId]
      );
      
      // Verificar si el carrito quedó vacío y eliminarlo si es necesario
      await this.removeEmptyCart(carritoId);
      
      return before[0] || null;
    } catch (error) {
      throw error;
    }
  },

  // Eliminar carrito vacío
  async removeEmptyCart(carritoId) {
    const pool = await getPool();
    
    try {
      // Verificar si el carrito tiene artículos
      const [hasItems] = await pool.execute(
        `SELECT COUNT(*) as ItemCount 
         FROM CarritoArticulos 
         WHERE CarritoID = ?`,
        [carritoId]
      );
      
      // Si no hay artículos, eliminar el carrito
      if (hasItems[0].ItemCount === 0) {
        await pool.execute(
          `DELETE FROM Carritos WHERE CarritoID = ?`,
          [carritoId]
        );
        console.log(`🗑️ Carrito ${carritoId} eliminado por estar vacío`);
      }
    } catch (error) {
      console.error('Error al verificar/eliminar carrito vacío:', error);
    }
  },

  // Vaciar el carrito de un usuario
  async clearCart(userId) {
    const pool = await getPool();
    
    try {
      console.log(`🧹 Iniciando limpieza de carrito para usuario: ${userId}`);
      
      // Obtener el CarritoID del usuario
      const [carrito] = await pool.execute(
        `SELECT CarritoID FROM Carritos WHERE UsuarioID = ?`,
        [userId]
      );
      
      console.log(`🔍 Carritos encontrados para usuario ${userId}:`, carrito);
      
      if (carrito.length > 0) {
        const carritoId = carrito[0].CarritoID;
        console.log(`🔍 CarritoID a limpiar: ${carritoId}`);
        
        // Verificar artículos antes de eliminar
        const [articulosAntes] = await pool.execute(
          `SELECT * FROM CarritoArticulos WHERE CarritoID = ?`,
          [carritoId]
        );
        console.log(`🛒 Artículos antes de limpiar:`, articulosAntes);
        
        // Eliminar todos los artículos del carrito
        const [resultArticulos] = await pool.execute(
          `DELETE FROM CarritoArticulos WHERE CarritoID = ?`,
          [carritoId]
        );
        console.log(`🗑️ Artículos eliminados: ${resultArticulos.affectedRows}`);
        
        // Eliminar el carrito vacío
        const [resultCarrito] = await pool.execute(
          `DELETE FROM Carritos WHERE CarritoID = ?`,
          [carritoId]
        );
        console.log(`🗑️ Carrito eliminado: ${resultCarrito.affectedRows}`);
        
        console.log(`✅ Carrito ${carritoId} eliminado completamente`);
      } else {
        console.log(`ℹ️ No se encontró carrito para usuario ${userId}`);
      }
      
      return [];
    } catch (error) {
      console.error(`❌ Error limpiando carrito para usuario ${userId}:`, error);
      throw error;
    }
  },

  // Verificar stock disponible para un producto y talla específica
  async checkStock(productoId, tallaId = null) {
    const pool = await getPool();
    
    if (tallaId) {
      // Verificar stock específico de la talla
      const [rows] = await pool.execute(
        `SELECT pt.Stock as Stock
         FROM ProductoTallas pt
         WHERE pt.ProductoID = ? AND pt.TallaID = ?`,
        [productoId, tallaId]
      );
      return rows[0]?.Stock || 0;
    } else {
      // Verificar stock general del producto
      const [rows] = await pool.execute(
        `SELECT Stock FROM Productos WHERE ProductoID = ?`,
        [productoId]
      );
      return rows[0]?.Stock || 0;
    }
  },

  // Obtener cantidad actual en carrito para un producto y talla específica
  async getCartItemQuantity(userId, productoId, tallaId = null) {
    const pool = await getPool();
    const [rows] = await pool.execute(
      `SELECT ca.Cantidad
       FROM Carritos c
       INNER JOIN CarritoArticulos ca ON c.CarritoID = ca.CarritoID
       WHERE c.UsuarioID = ? 
         AND ca.ProductoID = ?
         AND (ca.TallaID <=> ?)`,
      [userId, productoId, tallaId]
    );
    return rows[0]?.Cantidad || 0;
  }
}; 