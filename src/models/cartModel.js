import sql from 'mssql';
import { getPool } from '../db.js';

export const CartModel = {
  // Obtener el carrito completo de un usuario
  async getCartByUserId(userId) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
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
          ISNULL(t.NombreTalla, 'N/A') as NombreTalla,
          ISNULL(pt.Stock, p.Stock) as StockDisponible
        FROM Carritos c
        LEFT JOIN CarritoArticulos ca ON c.CarritoID = ca.CarritoID
        LEFT JOIN Productos p ON ca.ProductoID = p.ProductoID
        LEFT JOIN Tallas t ON ca.TallaID = t.TallaID
        LEFT JOIN ProductoTallas pt ON ca.ProductoID = pt.ProductoID AND ca.TallaID = pt.TallaID
        WHERE c.UsuarioID = @userId
        ORDER BY c.FechaCreacion DESC
      `);
    return result.recordset;
  },

  // Agregar un producto al carrito
  async addToCart({ UsuarioID, ProductoID, TallaID, Cantidad }) {
    try {
      const pool = await getPool();
      
      // Buscar carrito existente del usuario
      const carritoResult = await pool.request()
        .input('UsuarioID', sql.Int, UsuarioID)
        .query('SELECT CarritoID FROM Carritos WHERE UsuarioID = @UsuarioID');
      
      let carritoId;
      
      if (carritoResult.recordset.length === 0) {
        // Crear nuevo carrito
        const newCarritoResult = await pool.request()
          .input('UsuarioID', sql.Int, UsuarioID)
          .query('INSERT INTO Carritos (UsuarioID) OUTPUT INSERTED.CarritoID VALUES (@UsuarioID)');
        
        carritoId = newCarritoResult.recordset[0].CarritoID;
      } else {
        carritoId = carritoResult.recordset[0].CarritoID;
      }
      
      // Verificar si el producto ya existe en el carrito
      const existingItemResult = await pool.request()
        .input('CarritoID', sql.Int, carritoId)
        .input('ProductoID', sql.Int, ProductoID)
        .input('TallaID', sql.Int, TallaID)
        .query(`
          SELECT CarritoArticuloID, Cantidad 
          FROM CarritoArticulos 
          WHERE CarritoID = @CarritoID AND ProductoID = @ProductoID AND TallaID = @TallaID
        `);
      
      if (existingItemResult.recordset.length > 0) {
        // Actualizar cantidad existente
        const existingItem = existingItemResult.recordset[0];
        const nuevaCantidad = existingItem.Cantidad + Cantidad;
        
        const updateResult = await pool.request()
          .input('CarritoArticuloID', sql.Int, existingItem.CarritoArticuloID)
          .input('Cantidad', sql.Int, nuevaCantidad)
          .query(`
            UPDATE CarritoArticulos 
            SET Cantidad = @Cantidad 
            WHERE CarritoArticuloID = @CarritoArticuloID;
            
            SELECT CarritoArticuloID, ProductoID, TallaID, Cantidad 
            FROM CarritoArticulos 
            WHERE CarritoArticuloID = @CarritoArticuloID
          `);
        
        return updateResult.recordset[0];
      } else {
        // Crear nuevo ítem en el carrito
        const insertResult = await pool.request()
          .input('CarritoID', sql.Int, carritoId)
          .input('ProductoID', sql.Int, ProductoID)
          .input('TallaID', sql.Int, TallaID)
          .input('Cantidad', sql.Int, Cantidad)
          .query(`
            INSERT INTO CarritoArticulos (CarritoID, ProductoID, TallaID, Cantidad)
            OUTPUT INSERTED.CarritoArticuloID, INSERTED.ProductoID, INSERTED.TallaID, INSERTED.Cantidad
            VALUES (@CarritoID, @ProductoID, @TallaID, @Cantidad)
          `);
        
        return insertResult.recordset[0];
      }
    } catch (error) {
      throw error;
    }
  },

  // Actualizar cantidad de un ítem en el carrito
  async updateCartItemQuantity(cartItemId, cantidad) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('CarritoArticuloID', sql.Int, cartItemId)
      .input('Cantidad', sql.Int, cantidad)
      .query(`
        UPDATE CarritoArticulos
        SET Cantidad = @Cantidad
        OUTPUT inserted.*
        WHERE CarritoArticuloID = @CarritoArticuloID
      `);
    return result.recordset[0] || null;
  },

  // Eliminar un ítem del carrito
  async removeFromCart(cartItemId) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('CarritoArticuloID', sql.Int, cartItemId)
      .query(`
        DELETE FROM CarritoArticulos
        OUTPUT deleted.*
        WHERE CarritoArticuloID = @CarritoArticuloID
      `);
    return result.recordset[0] || null;
  },

  // Vaciar el carrito de un usuario
  async clearCart(userId) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('UsuarioID', sql.Int, userId)
      .query(`
        DELETE FROM CarritoArticulos
        WHERE CarritoID IN (
          SELECT CarritoID FROM Carritos WHERE UsuarioID = @UsuarioID
        )
      `);
    return result.recordset;
  },

  // Verificar stock disponible para un producto y talla específica
  async checkStock(productoId, tallaId = null) {
    const pool = await getPool();
    
    if (tallaId) {
      // Verificar stock específico de la talla
      const result = await pool
        .request()
        .input('ProductoID', sql.Int, productoId)
        .input('TallaID', sql.Int, tallaId)
        .query(`
          SELECT pt.Stock as Stock
          FROM ProductoTallas pt
          WHERE pt.ProductoID = @ProductoID AND pt.TallaID = @TallaID
        `);
      return result.recordset[0]?.Stock || 0;
    } else {
      // Verificar stock general del producto
      const result = await pool
        .request()
        .input('ProductoID', sql.Int, productoId)
        .query(`
          SELECT Stock
          FROM Productos
          WHERE ProductoID = @ProductoID
        `);
      return result.recordset[0]?.Stock || 0;
    }
  },

  // Obtener cantidad actual en carrito para un producto y talla específica
  async getCartItemQuantity(userId, productoId, tallaId = null) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('UsuarioID', sql.Int, userId)
      .input('ProductoID', sql.Int, productoId)
      .input('TallaID', sql.Int, tallaId)
      .query(`
        SELECT ca.Cantidad
        FROM Carritos c
        INNER JOIN CarritoArticulos ca ON c.CarritoID = ca.CarritoID
        WHERE c.UsuarioID = @UsuarioID 
          AND ca.ProductoID = @ProductoID
          AND ca.TallaID = @TallaID
      `);
    return result.recordset[0]?.Cantidad || 0;
  }
}; 