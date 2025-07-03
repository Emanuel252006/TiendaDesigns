import sql from 'mssql';
import { getPool } from '../db.js';

const ALLOWED_FIELDS = [
  'NombreProducto',
  'Descripcion',
  'Precio',
  'Stock',
  'Imagen'
];

export const ProductModel = {
  async create({ NombreProducto, Descripcion, Precio, Stock, Imagen }) {
    const pool = await getPool();
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

    return result.recordset[0] || null;
  },

  async findAll() {
    const pool = await getPool();
    const result = await pool
      .request()
      .query(`
        SELECT ProductoID,
               NombreProducto,
               Descripcion,
               Precio,
               Stock,
               Imagen
          FROM Productos
      `);
    return result.recordset;
  },

  async findById(id) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT ProductoID,
               NombreProducto,
               Descripcion,
               Precio,
               Stock,
               Imagen
          FROM Productos
         WHERE ProductoID = @id
      `);
    return result.recordset[0] || null;
  },

  async update(id, fields) {
    // Build SET clause dynamically
    const keys = Object.keys(fields).filter(k => ALLOWED_FIELDS.includes(k));
    if (keys.length === 0) return null;

    const setClause = keys.map((k, i) => `${k} = @v${i}`).join(', ');
    const pool = await getPool();
    const builder = pool.request();

    keys.forEach((key, i) => {
      const val = fields[key];
      let type;

      switch (key) {
        case 'Precio':
          type = sql.Decimal(10, 2);
          break;
        case 'Stock':
          type = sql.Int;
          break;
        default:
          type = sql.NVarChar(sql.MAX);
      }

      builder.input(`v${i}`, type, val);
    });

    builder.input('id', sql.Int, id);

    const result = await builder.query(`
      UPDATE Productos
         SET ${setClause}
      OUTPUT inserted.*
       WHERE ProductoID = @id
    `);

    return result.recordset[0] || null;
  },

  async remove(id) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        DELETE FROM Productos
        OUTPUT deleted.*
         WHERE ProductoID = @id
      `);
    return result.recordset[0] || null;
  }
};