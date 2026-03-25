import { getPool } from '../db.js';

export const OrderModelMySQL = {
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
    
    // Primero, verificar si el usuario ya tiene una dirección
    const [existingAddress] = await pool.execute(`
      SELECT DireccionID FROM Direcciones WHERE UsuarioID = ?
    `, [UsuarioID]);
    
    let DireccionID;
    
    if (existingAddress.length > 0) {
      // Actualizar dirección existente
      DireccionID = existingAddress[0].DireccionID;
      await pool.execute(`
        UPDATE Direcciones 
        SET Direccion = ?, Ciudad = ?, Pais = ?, CodigoPostal = ?
        WHERE UsuarioID = ?
      `, [DireccionEnvio, CiudadEnvio, 'Colombia', CodigoPostalEnvio, UsuarioID]);
    } else {
      // Crear nueva dirección solo si no existe
      const [direccionResult] = await pool.execute(`
        INSERT INTO Direcciones (UsuarioID, Direccion, Ciudad, Pais, CodigoPostal)
        VALUES (?, ?, ?, ?, ?)
      `, [UsuarioID, DireccionEnvio, CiudadEnvio, 'Colombia', CodigoPostalEnvio]);
      DireccionID = direccionResult.insertId;
    }
    
    // Crear la orden
    const [result] = await pool.execute(`
      INSERT INTO Ordenes (UsuarioID, DireccionID, Estado, PaymentId, PreferenceId)
      VALUES (?, ?, ?, ?, ?)
    `, [UsuarioID, DireccionID, Estado, PaymentId, PreferenceId]);
    
    return {
      OrdenID: result.insertId,
      FechaOrden: new Date()
    };
  },

  // Agregar items a una orden
  async addOrderItems(ordenId, items) {
    const pool = await getPool();
    
    console.log('📦 Agregando items a la orden:', ordenId);
    console.log('📦 Items recibidos:', JSON.stringify(items, null, 2));
    
    for (const item of items) {
      console.log('📦 Procesando item:', {
        OrdenID: ordenId,
        ProductoID: item.ProductoID,
        TallaID: item.TallaID,
        Cantidad: item.Cantidad,
        Precio: item.Precio
      });
      
      // Validar que todos los campos requeridos estén presentes
      if (item.ProductoID === undefined || item.TallaID === undefined || 
          item.Cantidad === undefined || item.Precio === undefined) {
        throw new Error(`Item inválido: ${JSON.stringify(item)}`);
      }
      
      await pool.execute(`
        INSERT INTO OrdenArticulos (OrdenID, ProductoID, TallaID, Cantidad, Precio)
        VALUES (?, ?, ?, ?, ?)
      `, [ordenId, item.ProductoID, item.TallaID, item.Cantidad, item.Precio]);
    }
    
    return true;
  },

  // Obtener orden por ID
  async getOrderById(ordenId) {
    const pool = await getPool();
    
    const [rows] = await pool.execute(`
      SELECT 
        o.OrdenID,
        o.UsuarioID,
        o.FechaOrden,
        o.Estado,
        o.PaymentId,
        o.PreferenceId,
        d.Direccion,
        d.Ciudad,
        d.Pais,
        d.CodigoPostal,
        u.NombreUsuario,
        u.Correo,
        oa.ProductoID,
        oa.TallaID,
        oa.Cantidad,
        oa.Precio,
        p.NombreProducto,
        p.Descripcion,
        p.Imagen,
        t.NombreTalla
      FROM Ordenes o
      INNER JOIN Direcciones d ON o.DireccionID = d.DireccionID
      INNER JOIN Usuarios u ON o.UsuarioID = u.UsuarioID
      INNER JOIN OrdenArticulos oa ON o.OrdenID = oa.OrdenID
      INNER JOIN Productos p ON oa.ProductoID = p.ProductoID
      LEFT JOIN Tallas t ON oa.TallaID = t.TallaID
      WHERE o.OrdenID = ?
    `, [ordenId]);
    
    return rows;
  },

  // Obtener items de una orden específica
  async getOrderItems(ordenId) {
    const pool = await getPool();
    
    const [rows] = await pool.execute(`
      SELECT 
        oa.ProductoID,
        oa.TallaID,
        oa.Cantidad,
        oa.Precio,
        p.NombreProducto,
        p.Descripcion,
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

  // Actualizar estado de la orden
  async updateOrderStatus(ordenId, estado, paymentId = null, preferenceId = null) {
    const pool = await getPool();
    
    let query = 'UPDATE Ordenes SET Estado = ?';
    let params = [estado];
    
    if (paymentId) {
      query += ', PaymentId = ?';
      params.push(paymentId);
    }
    
    if (preferenceId) {
      query += ', PreferenceId = ?';
      params.push(preferenceId);
    }
    
    query += ' WHERE OrdenID = ?';
    params.push(ordenId);
    
    const [result] = await pool.execute(query, params);
    
    return result.affectedRows > 0;
  },

  // Obtener órdenes por usuario
  async getOrdersByUserId(userId) {
    const pool = await getPool();
    
    const [rows] = await pool.execute(`
      SELECT 
        o.OrdenID,
        o.FechaOrden,
        o.Estado,
        o.PaymentId,
        o.PreferenceId,
        d.Direccion,
        d.Ciudad,
        d.Pais,
        d.CodigoPostal,
        SUM(oa.Cantidad * oa.Precio) as Total
      FROM Ordenes o
      INNER JOIN Direcciones d ON o.DireccionID = d.DireccionID
      INNER JOIN OrdenArticulos oa ON o.OrdenID = oa.OrdenID
      WHERE o.UsuarioID = ?
      GROUP BY o.OrdenID, o.FechaOrden, o.Estado, o.PaymentId, o.PreferenceId, d.Direccion, d.Ciudad, d.Pais, d.CodigoPostal
      ORDER BY o.FechaOrden DESC
    `, [userId]);
    
    return rows;
  },

  // Obtener órdenes pagadas por usuario (solo pagadas)
  async getActiveOrdersByUserId(userId) {
    const pool = await getPool();
    
    const [rows] = await pool.execute(`
      SELECT 
        o.OrdenID,
        o.FechaOrden,
        o.Estado,
        o.PaymentId,
        o.PreferenceId,
        d.Direccion,
        d.Ciudad,
        d.Pais,
        d.CodigoPostal,
        SUM(oa.Cantidad * oa.Precio) as Total
      FROM Ordenes o
      INNER JOIN Direcciones d ON o.DireccionID = d.DireccionID
      INNER JOIN OrdenArticulos oa ON o.OrdenID = oa.OrdenID
      WHERE o.UsuarioID = ? AND o.Estado = 'Pagado'
      GROUP BY o.OrdenID, o.FechaOrden, o.Estado, o.PaymentId, o.PreferenceId, d.Direccion, d.Ciudad, d.Pais, d.CodigoPostal
      ORDER BY o.FechaOrden DESC
    `, [userId]);
    
    return rows;
  },

  // Obtener estadísticas de ventas reales
  async getSalesStats() {
    const pool = await getPool();
    
    try {
      console.log('📊 Obteniendo estadísticas de ventas...');
      // Primero, obtener conteos básicos para debug
      const [debugCounts] = await pool.execute(`
        SELECT 
          (SELECT COUNT(*) FROM Ordenes) as totalOrdenes,
          (SELECT COUNT(*) FROM Pagos) as totalPagos,
          (SELECT COUNT(*) FROM Ordenes o INNER JOIN Pagos p ON o.OrdenID = p.OrdenID) as ordenesConPago
      `);
      
      console.log('🔍 Debug counts:', debugCounts[0]);

      // Estadísticas por período de tiempo - corregidas para mostrar dinero real
      const [periodStats] = await pool.execute(`
        SELECT 
          COUNT(CASE WHEN DATE(o.FechaOrden) = CURDATE() AND p.PagoID IS NOT NULL THEN 1 END) as ventasHoy,
          COUNT(CASE WHEN o.FechaOrden >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND p.PagoID IS NOT NULL THEN 1 END) as ventasSemana,
          COUNT(CASE WHEN o.FechaOrden >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND p.PagoID IS NOT NULL THEN 1 END) as ventasMes,
          COALESCE(SUM(CASE WHEN DATE(o.FechaOrden) = CURDATE() AND p.PagoID IS NOT NULL THEN p.Monto ELSE 0 END), 0) as totalHoy,
          COALESCE(SUM(CASE WHEN o.FechaOrden >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND p.PagoID IS NOT NULL THEN p.Monto ELSE 0 END), 0) as totalSemana,
          COALESCE(SUM(CASE WHEN o.FechaOrden >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND p.PagoID IS NOT NULL THEN p.Monto ELSE 0 END), 0) as totalMes,
          COALESCE(SUM(CASE WHEN p.PagoID IS NOT NULL THEN p.Monto ELSE 0 END), 0) as totalGeneral,
          COUNT(*) as totalOrdenes,
          COUNT(p.PagoID) as ordenesConPago,
          COUNT(CASE WHEN p.PagoID IS NULL THEN 1 END) as ordenesPendientes
        FROM Ordenes o
        LEFT JOIN Pagos p ON o.OrdenID = p.OrdenID
      `);

      // Métodos de pago más usados - simplificado
      const [paymentMethods] = await pool.execute(`
        SELECT 
          COALESCE(MetodoPago, 'Sin Pago') as MetodoPago,
          COUNT(*) as Cantidad,
          COALESCE(SUM(Monto), 0) as TotalMonto
        FROM Pagos
        GROUP BY MetodoPago
        ORDER BY Cantidad DESC
      `);

      // Ciudades con más compras - simplificado
      const [topCities] = await pool.execute(`
        SELECT 
          d.Ciudad,
          COUNT(DISTINCT o.OrdenID) as CantidadCompras,
          COALESCE(SUM(p.Monto), 0) as TotalGenerado
        FROM Pagos p
        INNER JOIN Ordenes o ON p.OrdenID = o.OrdenID
        INNER JOIN Direcciones d ON o.DireccionID = d.DireccionID
        GROUP BY d.Ciudad
        ORDER BY TotalGenerado DESC
        LIMIT 5
      `);

      // Productos más vendidos - simplificado
      const [topProducts] = await pool.execute(`
        SELECT 
          pr.NombreProducto,
          SUM(oa.Cantidad) as CantidadVendida,
          SUM(oa.Cantidad * oa.Precio) as TotalGenerado
        FROM Pagos p
        INNER JOIN Ordenes o ON p.OrdenID = o.OrdenID
        INNER JOIN OrdenArticulos oa ON o.OrdenID = oa.OrdenID
        INNER JOIN Productos pr ON oa.ProductoID = pr.ProductoID
        GROUP BY pr.ProductoID, pr.NombreProducto
        ORDER BY CantidadVendida DESC
        LIMIT 5
      `);

      // Ventas por día de la semana actual - usando subconsulta para evitar GROUP BY issues
      const [weeklyStatsRaw] = await pool.execute(`
        SELECT 
          day_num as NumDia,
          CASE day_num
            WHEN 1 THEN 'Domingo'
            WHEN 2 THEN 'Lunes'
            WHEN 3 THEN 'Martes'
            WHEN 4 THEN 'Miércoles'
            WHEN 5 THEN 'Jueves'
            WHEN 6 THEN 'Viernes'
            WHEN 7 THEN 'Sábado'
          END as DiaSemana,
          COALESCE(ventas_count, 0) as CantidadVentas,
          COALESCE(ventas_total, 0) as TotalVentas
        FROM (
          SELECT 1 as day_num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 
          UNION SELECT 5 UNION SELECT 6 UNION SELECT 7
        ) all_days
        LEFT JOIN (
          SELECT 
            DAYOFWEEK(o.FechaOrden) as day_of_week,
            COUNT(*) as ventas_count,
            SUM(p.Monto) as ventas_total
          FROM Pagos p
          INNER JOIN Ordenes o ON p.OrdenID = o.OrdenID
          WHERE o.FechaOrden >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
          AND o.FechaOrden < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY)
          GROUP BY DAYOFWEEK(o.FechaOrden)
        ) weekly_data ON all_days.day_num = weekly_data.day_of_week
        ORDER BY day_num
      `);
      
      const weeklyStats = weeklyStatsRaw;

      // Información del período actual
      const [currentPeriod] = await pool.execute(`
        SELECT 
          MONTHNAME(CURDATE()) as MesActual,
          YEAR(CURDATE()) as AnoActual,
          WEEK(CURDATE()) as SemanaActual,
          DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) as InicioSemana,
          DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 6 DAY) as FinSemana
      `);

      console.log('📊 Estadísticas obtenidas:', {
        periodStats: periodStats[0],
        paymentMethods: paymentMethods.length,
        topCities: topCities.length,
        topProducts: topProducts.length,
        weeklyStats: weeklyStats.length
      });

      return {
        periodStats: periodStats[0],
        paymentMethods,
        topCities,
        topProducts,
        weeklyStats,
        salesByDay: weeklyStats, // Alias para compatibilidad con frontend
        currentPeriod: currentPeriod[0]
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de ventas:', error);
      throw error;
    }
  },

  // Eliminar una orden (para órdenes rechazadas)
  async deleteOrder(orderId) {
    const pool = await getPool();
    
    try {
      // Primero eliminar los items de la orden
      await pool.execute(`
        DELETE FROM OrdenArticulos WHERE OrdenID = ?
      `, [orderId]);
      
      // Luego eliminar la orden
      const [result] = await pool.execute(`
        DELETE FROM Ordenes WHERE OrdenID = ?
      `, [orderId]);
      
      console.log(`🗑️ Orden ${orderId} eliminada. Items afectados:`, result.affectedRows);
      return result.affectedRows > 0;
      
    } catch (error) {
      console.error('Error eliminando orden:', error);
      throw error;
    }
  }
};

