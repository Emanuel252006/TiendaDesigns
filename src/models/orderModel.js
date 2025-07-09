import sql from 'mssql';
import { getPool } from '../db.js';

export const OrderModel = {
  // Crear una nueva orden
  async createOrder({ 
    UsuarioID, 
    NombreCliente, 
    EmailCliente, 
    TelefonoCliente, 
    DireccionEnvio, 
    CiudadEnvio, 
    CodigoPostalEnvio, 
    MetodoPago, 
    Estado = 'Pendiente' 
  }) {
    const pool = await getPool();
    
    // Primero, crear o actualizar la dirección del usuario
    const direccionResult = await pool
      .request()
      .input('UsuarioID', sql.Int, UsuarioID)
      .input('Direccion', sql.NVarChar(255), DireccionEnvio)
      .input('Ciudad', sql.NVarChar(100), CiudadEnvio)
      .input('Pais', sql.NVarChar(100), 'Colombia')
      .input('CodigoPostal', sql.NVarChar(20), CodigoPostalEnvio)
      .query(`
        MERGE Direcciones AS target
        USING (SELECT @UsuarioID as UsuarioID) AS source
        ON target.UsuarioID = source.UsuarioID
        WHEN MATCHED THEN
          UPDATE SET 
            Direccion = @Direccion,
            Ciudad = @Ciudad,
            Pais = @Pais,
            CodigoPostal = @CodigoPostal
        WHEN NOT MATCHED THEN
          INSERT (UsuarioID, Direccion, Ciudad, Pais, CodigoPostal)
          VALUES (@UsuarioID, @Direccion, @Ciudad, @Pais, @CodigoPostal)
        OUTPUT inserted.DireccionID;
      `);
    
    const DireccionID = direccionResult.recordset[0].DireccionID;
    
    // Luego, crear la orden usando la estructura existente
    const result = await pool
      .request()
      .input('UsuarioID', sql.Int, UsuarioID)
      .input('DireccionID', sql.Int, DireccionID)
      .input('Estado', sql.NVarChar(50), Estado)
      .query(`
        INSERT INTO Ordenes (UsuarioID, DireccionID, Estado)
        OUTPUT inserted.OrdenID, inserted.FechaOrden
        VALUES (@UsuarioID, @DireccionID, @Estado)
      `);
    
    return result.recordset[0];
  },

  // Agregar artículos a la orden
  async addOrderItems(ordenId, items) {
    const pool = await getPool();
    
    for (const item of items) {
      await pool
        .request()
        .input('OrdenID', sql.Int, ordenId)
        .input('ProductoID', sql.Int, item.ProductoID)
        .input('TallaID', sql.Int, item.TallaID || 1) // Por defecto talla 1
        .input('Cantidad', sql.Int, item.Cantidad)
        .input('Precio', sql.Decimal(10, 2), item.Precio)
        .query(`
          INSERT INTO OrdenArticulos (OrdenID, ProductoID, TallaID, Cantidad, Precio)
          VALUES (@OrdenID, @ProductoID, @TallaID, @Cantidad, @Precio)
        `);
    }
  },

  // Obtener orden completa con detalles
  async getOrderById(ordenId) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('OrdenID', sql.Int, ordenId)
      .query(`
        SELECT 
          o.OrdenID,
          o.UsuarioID,
          o.FechaOrden,
          o.Estado,
          u.NombreUsuario,
          u.Correo,
          d.Direccion,
          d.Ciudad,
          d.Pais,
          d.CodigoPostal,
          oa.ProductoID,
          oa.TallaID,
          oa.Cantidad,
          oa.Precio,
          p.NombreProducto,
          p.Imagen,
          t.NombreTalla
        FROM Ordenes o
        INNER JOIN Usuarios u ON o.UsuarioID = u.UsuarioID
        INNER JOIN Direcciones d ON o.DireccionID = d.DireccionID
        INNER JOIN OrdenArticulos oa ON o.OrdenID = oa.OrdenID
        INNER JOIN Productos p ON oa.ProductoID = p.ProductoID
        LEFT JOIN Tallas t ON oa.TallaID = t.TallaID
        WHERE o.OrdenID = @OrdenID
        ORDER BY oa.ProductoID
      `);
    return result.recordset;
  },

  // Obtener todas las órdenes de un usuario
  async getOrdersByUserId(userId) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('UsuarioID', sql.Int, userId)
      .query(`
        SELECT 
          o.OrdenID,
          o.FechaOrden,
          o.Estado,
          COUNT(oa.ProductoID) as TotalProductos,
          SUM(oa.Cantidad * oa.Precio) as Total
        FROM Ordenes o
        LEFT JOIN OrdenArticulos oa ON o.OrdenID = oa.OrdenID
        WHERE o.UsuarioID = @UsuarioID
        GROUP BY o.OrdenID, o.FechaOrden, o.Estado
        ORDER BY o.FechaOrden DESC
      `);
    return result.recordset;
  },

  // Actualizar estado de la orden
  async updateOrderStatus(ordenId, estado) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('OrdenID', sql.Int, ordenId)
      .input('Estado', sql.NVarChar(50), estado)
      .query(`
        UPDATE Ordenes
        SET Estado = @Estado
        OUTPUT inserted.OrdenID, inserted.Estado
        WHERE OrdenID = @OrdenID
      `);
    return result.recordset[0];
  }
}; 