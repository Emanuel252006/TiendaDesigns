import { getPool } from '../db.js';

const ALLOWED_FIELDS = [
  'NombreProducto',
  'Descripcion',
  'Precio',
  'Stock',
  'Imagen'
];

export const ProductModel = {
  async create({ NombreProducto, Descripcion, Precio, Imagen }) {
    const pool = await getPool();
    const [result] = await pool.execute(`
      INSERT INTO Productos
        (NombreProducto, Descripcion, Precio, Imagen)
      VALUES
        (?, ?, ?, ?)
    `, [NombreProducto, Descripcion ?? null, Precio, Imagen ?? null]);

    // Obtener el registro insertado
    const [rows] = await pool.execute("SELECT * FROM Productos WHERE ProductoID = ?", [result.insertId]);
    return rows[0] || null;
  },

  async findAll() {
    const pool = await getPool();
    const [rows] = await pool.execute(`
      SELECT ProductoID,
             NombreProducto,
             Descripcion,
             Precio,
             COALESCE(Stock, 0) as Stock,
             Imagen
        FROM Productos
    `);
    return rows;
  },

  async findById(id) {
    const pool = await getPool();
    const [rows] = await pool.execute(`
      SELECT ProductoID,
             NombreProducto,
             Descripcion,
             Precio,
             COALESCE(Stock, 0) as Stock,
             Imagen
        FROM Productos
       WHERE ProductoID = ?
    `, [id]);
    return rows[0] || null;
  },

  async update(id, fields) {
    // Build SET clause dynamically
    const keys = Object.keys(fields).filter(k => ALLOWED_FIELDS.includes(k));
    if (keys.length === 0) return null;

    const setClause = keys.map((k, i) => `${k} = ?`).join(', ');
    const pool = await getPool();
    const params = keys.map(key => fields[key]);
    params.push(id);

    await pool.execute(`
      UPDATE Productos
         SET ${setClause}
       WHERE ProductoID = ?
    `, params);

    // Obtener el registro actualizado
    const [rows] = await pool.execute("SELECT * FROM Productos WHERE ProductoID = ?", [id]);
    return rows[0] || null;
  },

  async remove(id) {
    const pool = await getPool();
    
    // Primero eliminar las relaciones ProductoTallas
    await pool.execute(`
      DELETE FROM ProductoTallas
       WHERE ProductoID = ?
    `, [id]);
    
    // Luego eliminar el producto
    const [result] = await pool.execute(`
      DELETE FROM Productos
       WHERE ProductoID = ?
    `, [id]);
    
    // Como MySQL no tiene OUTPUT, necesitamos obtener el registro antes de eliminarlo
    const [rows] = await pool.execute("SELECT * FROM Productos WHERE ProductoID = ?", [id]);
    return rows[0] || null;
  },

  // Actualizar stock total de un producto
  async updateStock(productoId) {
    const pool = await getPool();
    await pool.execute(`
      UPDATE Productos
      SET Stock = (
        SELECT COALESCE(SUM(Stock), 0)
        FROM ProductoTallas
        WHERE ProductoTallas.ProductoID = Productos.ProductoID
      )
      WHERE ProductoID = ?
    `, [productoId]);
    
    const [rows] = await pool.execute(`
      SELECT ProductoID, Stock
      FROM Productos
      WHERE ProductoID = ?
    `, [productoId]);
    return rows[0] || null;
  },

  // Obtener productos aleatorios
  async getProductosAleatorios(limit = 4) {
    const pool = await getPool();
    const [rows] = await pool.query(`
      SELECT ProductoID,
             NombreProducto,
             Descripcion,
             Precio,
             COALESCE(Stock, 0) as Stock,
             Imagen
        FROM Productos
       ORDER BY RAND()
       LIMIT ?
    `, [limit]);
    return rows;
  },

  // Obtener productos más vendidos
  async getProductosMasVendidos(limit = 4) {
    const pool = await getPool();
    const [rows] = await pool.execute(`
      SELECT p.ProductoID,
             p.NombreProducto,
             p.Descripcion,
             p.Precio,
             COALESCE(p.Stock, 0) as Stock,
             p.Imagen,
             COALESCE(SUM(oa.Cantidad), 0) as totalVendido
        FROM Productos p
        LEFT JOIN OrdenArticulos oa ON p.ProductoID = oa.ProductoID
        LEFT JOIN Ordenes o ON oa.OrdenID = o.OrdenID
       WHERE o.Estado = 'Completada' OR o.Estado IS NULL
       GROUP BY p.ProductoID, p.NombreProducto, p.Descripcion, p.Precio, p.Stock, p.Imagen
       ORDER BY totalVendido DESC
       LIMIT ?
    `, [limit]);
    return rows;
  },


  // Obtener productos por IDs específicos
  async getProductosPorIds(ids) {
    if (!ids || ids.length === 0) {
      return [];
    }
    
    const pool = await getPool();
    const placeholders = ids.map(() => '?').join(',');
    const [rows] = await pool.execute(`
      SELECT ProductoID,
             NombreProducto,
             Descripcion,
             Precio,
             COALESCE(Stock, 0) as Stock,
             Imagen
        FROM Productos
       WHERE ProductoID IN (${placeholders})
       ORDER BY FIELD(ProductoID, ${placeholders})
    `, [...ids, ...ids]);
    return rows;
  },

  // Obtener stock por tallas de todos los productos
  async getStockPorTallas() {
    const pool = await getPool();
    const [rows] = await pool.execute(`
      SELECT 
        p.ProductoID,
        p.NombreProducto,
        t.NombreTalla,
        COALESCE(pt.Stock, 0) as Stock,
        CASE 
          WHEN COALESCE(pt.Stock, 0) = 0 THEN 'Sin Stock'
          WHEN COALESCE(pt.Stock, 0) <= 10 THEN 'Stock Bajo'
          WHEN COALESCE(pt.Stock, 0) <= 20 THEN 'Stock Medio'
          ELSE 'Stock Alto'
        END as EstadoStock
      FROM Productos p
      CROSS JOIN Tallas t
      LEFT JOIN ProductoTallas pt ON p.ProductoID = pt.ProductoID AND t.TallaID = pt.TallaID
      ORDER BY p.NombreProducto, t.NombreTalla
    `);
    return rows;
  },

  // Obtener productos más y menos vendidos
  async getProductosVendidos() {
    const pool = await getPool();
    const [rows] = await pool.execute(`
      SELECT 
        p.ProductoID,
        p.NombreProducto,
        COALESCE(SUM(CASE WHEN o.Estado = 'Completada' THEN oa.Cantidad ELSE 0 END), 0) as TotalVendido,
        COALESCE(p.Stock, 0) as StockActual,
        CASE 
          WHEN COALESCE(SUM(CASE WHEN o.Estado = 'Completada' THEN oa.Cantidad ELSE 0 END), 0) = 0 THEN 'Sin Ventas'
          WHEN COALESCE(SUM(CASE WHEN o.Estado = 'Completada' THEN oa.Cantidad ELSE 0 END), 0) <= 5 THEN 'Pocas Ventas'
          WHEN COALESCE(SUM(CASE WHEN o.Estado = 'Completada' THEN oa.Cantidad ELSE 0 END), 0) <= 20 THEN 'Ventas Medias'
          ELSE 'Muchas Ventas'
        END as CategoriaVentas
      FROM Productos p
      LEFT JOIN OrdenArticulos oa ON p.ProductoID = oa.ProductoID
      LEFT JOIN Ordenes o ON oa.OrdenID = o.OrdenID
      GROUP BY p.ProductoID, p.NombreProducto, p.Stock
      ORDER BY TotalVendido DESC
    `);
    return rows;
  },

  // Obtener estadísticas generales de productos
  async getEstadisticasProductos() {
    const pool = await getPool();
    
    // Obtener estadísticas basadas en el stock INDIVIDUAL de cada talla (como en el gráfico)
    const [stockStats] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT p.ProductoID) as TotalProductos,
        COUNT(CASE WHEN pt.Stock = 0 THEN 1 END) as ProductosSinStock,
        COUNT(CASE WHEN pt.Stock > 0 AND pt.Stock <= 10 THEN 1 END) as ProductosStockBajo,
        COUNT(CASE WHEN pt.Stock > 10 AND pt.Stock <= 20 THEN 1 END) as ProductosStockMedio,
        COUNT(CASE WHEN pt.Stock > 20 THEN 1 END) as ProductosStockAlto,
        SUM(pt.Stock) as StockTotal
      FROM Productos p
      LEFT JOIN ProductoTallas pt ON p.ProductoID = pt.ProductoID
    `);
    
    const result = stockStats[0];
    
    // Si no hay productos con tallas, usar estadísticas básicas
    if (!result.TotalProductos) {
      const [basicStats] = await pool.execute(`
        SELECT 
          COUNT(*) as TotalProductos,
          COUNT(CASE WHEN COALESCE(Stock, 0) = 0 THEN 1 END) as ProductosSinStock,
          COUNT(CASE WHEN COALESCE(Stock, 0) <= 10 AND COALESCE(Stock, 0) > 0 THEN 1 END) as ProductosStockBajo,
          COUNT(CASE WHEN COALESCE(Stock, 0) > 10 THEN 1 END) as ProductosStockAlto,
          SUM(COALESCE(Stock, 0)) as StockTotal
        FROM Productos
      `);
      return basicStats[0];
    }
    
    return result;
  }
};