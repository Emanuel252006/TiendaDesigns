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
    Estado = 'Pendiente',
    PaymentId = null,
    PreferenceId = null
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
      .input('PaymentId', sql.NVarChar(100), PaymentId)
      .input('PreferenceId', sql.NVarChar(100), PreferenceId)
      .query(`
        INSERT INTO Ordenes (UsuarioID, DireccionID, Estado, PaymentId, PreferenceId)
        OUTPUT inserted.OrdenID, inserted.FechaOrden
        VALUES (@UsuarioID, @DireccionID, @Estado, @PaymentId, @PreferenceId)
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
  },

  // Obtener pedidos activos (pendientes de entrega)
  async getActiveOrders() {
    const pool = await getPool();
    const [rows] = await pool.execute(`
      SELECT 
        o.OrdenID,
        o.FechaOrden,
        o.Estado,
        u.NombreUsuario as NombreCliente,
        u.Correo as EmailCliente,
        u.Telefono as TelefonoCliente,
        d.Direccion as DireccionEnvio,
        d.Ciudad as CiudadEnvio,
        d.CodigoPostal as CodigoPostalEnvio,
        SUM(oa.Cantidad * oa.Precio) as Total
      FROM Ordenes o
      INNER JOIN Usuarios u ON o.UsuarioID = u.UsuarioID
      INNER JOIN Direcciones d ON o.DireccionID = d.DireccionID
      INNER JOIN OrdenArticulos oa ON o.OrdenID = oa.OrdenID
      WHERE o.Estado = 'Pagado'
      GROUP BY o.OrdenID, o.FechaOrden, o.Estado, u.NombreUsuario, u.Correo, u.Telefono, d.Direccion, d.Ciudad, d.CodigoPostal
      ORDER BY o.FechaOrden ASC
    `);
    return rows;
  },

  // Obtener detalles de productos de una orden
  async getOrderItems(ordenId) {
    const pool = await getPool();
    const [rows] = await pool.execute(`
      SELECT 
        oa.ProductoID,
        oa.TallaID,
        oa.Cantidad,
        oa.Precio,
        p.NombreProducto,
        p.Imagen,
        t.NombreTalla
      FROM OrdenArticulos oa
      INNER JOIN Productos p ON oa.ProductoID = p.ProductoID
      LEFT JOIN Tallas t ON oa.TallaID = t.TallaID
      WHERE oa.OrdenID = ?
      ORDER BY p.NombreProducto
    `, [ordenId]);
    return rows;
  },

  // Marcar pedido como entregado
  async markAsDelivered(ordenId) {
    const pool = await getPool();
    
    try {
      // Solo cambiar el estado a 'Entregado' sin eliminar
      const [result] = await pool.execute(`
        UPDATE Ordenes
        SET Estado = 'Entregado'
        WHERE OrdenID = ? AND Estado IN ('Pagado', 'Procesando', 'Pendiente')
      `, [ordenId]);
      
      if (result.affectedRows > 0) {
        return { OrdenID: ordenId, Estado: 'Entregado' };
      }
      return null;
    } catch (error) {
      console.error('Error marcando pedido como entregado:', error);
      throw error;
    }
  },

  // Limpiar todos los pedidos entregados existentes (eliminación permanente)
  async cleanDeliveredOrders() {
    const pool = await getPool();
    
    try {
      // Primero obtener todos los IDs de pedidos entregados
      const [deliveredOrders] = await pool.execute(`
        SELECT OrdenID FROM Ordenes WHERE Estado = 'Entregado'
      `);
      
      if (deliveredOrders.length === 0) {
        return { message: 'No hay pedidos entregados para limpiar', count: 0 };
      }
      
      const orderIds = deliveredOrders.map(order => order.OrdenID);
      
      // Eliminar artículos de todos los pedidos entregados
      await pool.execute(`
        DELETE FROM OrdenArticulos
        WHERE OrdenID IN (${orderIds.map(() => '?').join(',')})
      `, orderIds);
      
      // Eliminar los pedidos entregados
      const [result] = await pool.execute(`
        DELETE FROM Ordenes
        WHERE Estado = 'Entregado'
      `);
      
      return { 
        message: 'Pedidos entregados eliminados permanentemente', 
        count: result.affectedRows 
      };
    } catch (error) {
      console.error('Error limpiando pedidos entregados:', error);
      throw error;
    }
  },

  // Obtener estadísticas de ventas
  async getSalesStats() {
    const pool = await getPool();
    
    try {
      // Estadísticas por período de tiempo (temporalmente incluye todas las órdenes para mostrar datos)
      const [periodStats] = await pool.execute(`
        SELECT 
          COUNT(CASE WHEN DATE(FechaOrden) = CURDATE() THEN 1 END) as ventasHoy,
          COUNT(CASE WHEN FechaOrden >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as ventasSemana,
          COUNT(CASE WHEN FechaOrden >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as ventasMes,
          SUM(CASE WHEN DATE(FechaOrden) = CURDATE() THEN oa.Cantidad * oa.Precio ELSE 0 END) as totalHoy,
          SUM(CASE WHEN FechaOrden >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN oa.Cantidad * oa.Precio ELSE 0 END) as totalSemana,
          SUM(CASE WHEN FechaOrden >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN oa.Cantidad * oa.Precio ELSE 0 END) as totalMes,
          SUM(oa.Cantidad * oa.Precio) as totalGeneral
        FROM Ordenes o
        INNER JOIN OrdenArticulos oa ON o.OrdenID = oa.OrdenID
        WHERE o.Estado IN ('Pendiente', 'Procesando', 'Entregado')
      `);

      // Métodos de pago más usados (por ahora basado en PaymentId)
      const [paymentMethods] = await pool.execute(`
        SELECT 
          CASE 
            WHEN PaymentId IS NOT NULL THEN 'MercadoPago'
            ELSE 'Pendiente'
          END as MetodoPago,
          COUNT(*) as Cantidad
        FROM Ordenes 
        WHERE Estado IN ('Pendiente', 'Procesando', 'Entregado')
        GROUP BY 
          CASE 
            WHEN PaymentId IS NOT NULL THEN 'MercadoPago'
            ELSE 'Pendiente'
          END
        ORDER BY Cantidad DESC
      `);

      // Ciudades con más compras
      const [topCities] = await pool.execute(`
        SELECT 
          d.Ciudad,
          COUNT(DISTINCT o.OrdenID) as CantidadCompras,
          SUM(oa.Cantidad * oa.Precio) as TotalGenerado
        FROM Ordenes o
        INNER JOIN Direcciones d ON o.DireccionID = d.DireccionID
        INNER JOIN OrdenArticulos oa ON o.OrdenID = oa.OrdenID
        WHERE o.Estado IN ('Pendiente', 'Procesando', 'Entregado')
        GROUP BY d.Ciudad
        ORDER BY TotalGenerado DESC
        LIMIT 10
      `);

      // Ventas por día de la semana
      const [salesByDay] = await pool.execute(`
        SELECT 
          DiaSemana,
          CantidadVentas,
          TotalGenerado
        FROM (
          SELECT 
            DAYNAME(FechaOrden) as DiaSemana,
            COUNT(*) as CantidadVentas,
            SUM(oa.Cantidad * oa.Precio) as TotalGenerado
          FROM Ordenes o
          INNER JOIN OrdenArticulos oa ON o.OrdenID = oa.OrdenID
          WHERE o.Estado IN ('Pendiente', 'Procesando', 'Entregado')
            AND FechaOrden >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
          GROUP BY DAYNAME(FechaOrden)
        ) as subquery
        ORDER BY 
          CASE DiaSemana
            WHEN 'Monday' THEN 1
            WHEN 'Tuesday' THEN 2
            WHEN 'Wednesday' THEN 3
            WHEN 'Thursday' THEN 4
            WHEN 'Friday' THEN 5
            WHEN 'Saturday' THEN 6
            WHEN 'Sunday' THEN 7
            ELSE 8
          END
      `);

      // Productos más vendidos
      const [topProducts] = await pool.execute(`
        SELECT 
          p.NombreProducto,
          SUM(oa.Cantidad) as CantidadVendida,
          SUM(oa.Cantidad * oa.Precio) as TotalGenerado
        FROM OrdenArticulos oa
        INNER JOIN Productos p ON oa.ProductoID = p.ProductoID
        INNER JOIN Ordenes o ON oa.OrdenID = o.OrdenID
        WHERE o.Estado IN ('Pendiente', 'Procesando', 'Entregado')
        GROUP BY p.ProductoID, p.NombreProducto
        ORDER BY CantidadVendida DESC
        LIMIT 10
      `);

      return {
        periodStats: periodStats[0] || {},
        paymentMethods: paymentMethods || [],
        topCities: topCities || [],
        salesByDay: salesByDay || [],
        topProducts: topProducts || []
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de ventas:', error);
      throw error;
    }
  }
}; 