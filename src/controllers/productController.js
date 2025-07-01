// src/controllers/productController.js
import sql from 'mssql';
import { getPool } from '../db.js';

// POST /api/products
export const createProduct = async (req, res, next) => {
  console.log(' Body recibido:', req.body);
  try {
    const pool = await getPool();
    const { NombreProducto, Descripcion, Precio, Stock, Imagen } = req.body;

    const result = await pool
      .request()
      .input('NombreProducto', sql.NVarChar(100), NombreProducto)
      .input('Descripcion',    sql.NVarChar(255), Descripcion ?? null)
      .input('Precio',         sql.Decimal(10, 2),  Precio)
      .input('Stock',          sql.Int,            Stock)
      .input('Imagen',         sql.NVarChar(255),  Imagen ?? null)
      .query(`
        INSERT INTO Productos
          (NombreProducto, Descripcion, Precio, Stock, Imagen)
        OUTPUT inserted.*
        VALUES
          (@NombreProducto, @Descripcion, @Precio, @Stock, @Imagen)
      `);

    console.log(' Resultados del INSERT:', result.recordset);

    if (!result.recordset.length) {
      console.warn(' No se devolvieron filas con OUTPUT inserted.*');
      return res.status(500).json({ error: 'Fallo al crear producto' });
    }

    return res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error(' Error en createProduct:', err);
    next(err);
  }
};

// GET /api/products
export const getProducts = async (_req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(
      'SELECT ProductoID, NombreProducto, Descripcion, Precio, Stock, Imagen FROM Productos'
    );
    res.json(result.recordset);
  } catch (err) {
    console.error(' Error en getProducts:', err);
    next(err);
  }
};

// GET /api/products/:id
export const getProductById = async (req, res, next) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT ProductoID, NombreProducto, Descripcion, Precio, Stock, Imagen
        FROM Productos
        WHERE ProductoID = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error(' Error en getProductById:', err);
    next(err);
  }
};

// PUT /api/products/:id
export const updateProduct = async (req, res, next) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const fields = req.body;

    // Sólo permitimos actualizar estos campos
    const allowed = ['NombreProducto','Descripcion','Precio','Stock','Imagen'];
    const updates = Object.keys(fields)
      .filter(key => allowed.includes(key))
      .map((key, i) => `${key} = @v${i}`)
      .join(', ');

    const builder = pool.request();
    Object.entries(fields).forEach(([key, val], i) => {
      if (!allowed.includes(key)) return;
      const type = (key === 'Precio')
        ? sql.Decimal(10, 2)
        : (key === 'Stock')
          ? sql.Int
          : sql.NVarChar(sql.MAX);
      builder.input(`v${i}`, type, val);
    });
    builder.input('id', sql.Int, id);

    const result = await builder.query(`
      UPDATE Productos
      SET ${updates}
      OUTPUT inserted.*
      WHERE ProductoID = @id
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error(' Error en updateProduct:', err);
    next(err);
  }
};

// DELETE /api/products/:id
export const deleteProduct = async (req, res, next) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        DELETE FROM Productos
        OUTPUT deleted.*
        WHERE ProductoID = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json({
      message: 'Producto eliminado',
      deleted: result.recordset[0]
    });
  } catch (err) {
    console.error(' Error en deleteProduct:', err);
    next(err);
  }
};