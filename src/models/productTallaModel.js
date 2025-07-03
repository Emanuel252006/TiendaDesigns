// src/models/productTallaModel.js
import sql from 'mssql';
import { getPool } from '../db.js';

export const productTallaModel = {
  // Listar todas o filtrar por productoId
  async findAll(productoId) {
    const pool = await getPool();
    const req = pool.request();
    let query = `
      SELECT pt.ProductoID,
             pt.TallaID,
             pt.Stock,
             t.NombreTalla
        FROM ProductoTallas pt
   LEFT JOIN Tallas t ON pt.TallaID = t.TallaID
    `;
    if (productoId) {
      req.input('productoId', sql.Int, productoId);
      query += ' WHERE pt.ProductoID = @productoId';
    }
    const result = await req.query(query);
    return result.recordset;
  },

  // Obtener una única combinación
  async findOne(productoId, tallaId) {
    const pool = await getPool();
    const result = await pool.request()
      .input('productoId', sql.Int, productoId)
      .input('tallaId',    sql.Int, tallaId)
      .query(`
        SELECT ProductoID, TallaID, Stock
          FROM ProductoTallas
         WHERE ProductoID = @productoId
           AND TallaID    = @tallaId
      `);
    return result.recordset[0] || null;
  },

  // Crear nueva relación producto–talla
  async create({ ProductoID, TallaID, Stock }) {
    const pool = await getPool();

    // 1) Insertar sin OUTPUT
    await pool.request()
      .input('ProductoID', sql.Int, ProductoID)
      .input('TallaID',    sql.Int, TallaID)
      .input('Stock',      sql.Int, Stock)
      .query(`
        INSERT INTO ProductoTallas (ProductoID, TallaID, Stock)
        VALUES (@ProductoID, @TallaID, @Stock);
      `);

    // 2) Consultar el registro insertado
    const result = await pool.request()
      .input('ProductoID', sql.Int, ProductoID)
      .input('TallaID',    sql.Int, TallaID)
      .query(`
        SELECT ProductoID, TallaID, Stock
          FROM ProductoTallas
         WHERE ProductoID = @ProductoID
           AND TallaID    = @TallaID;
      `);

    return result.recordset[0];
  },

  // Actualizar stock de la combinación
  async update(productoId, tallaId, Stock) {
    const pool = await getPool();

    // 1) UPDATE sin OUTPUT
    await pool.request()
      .input('ProductoID', sql.Int, productoId)
      .input('TallaID',    sql.Int, tallaId)
      .input('Stock',      sql.Int, Stock)
      .query(`
        UPDATE ProductoTallas
           SET Stock = @Stock
         WHERE ProductoID = @ProductoID
           AND TallaID    = @TallaID;
      `);

    // 2) Consultar el registro actualizado
    const result = await pool.request()
      .input('ProductoID', sql.Int, productoId)
      .input('TallaID',    sql.Int, tallaId)
      .query(`
        SELECT ProductoID, TallaID, Stock
          FROM ProductoTallas
         WHERE ProductoID = @ProductoID
           AND TallaID    = @TallaID;
      `);

    return result.recordset[0] || null;
  },

  // Eliminar la relación
  async remove(productoId, tallaId) {
    const pool = await getPool();

    // 1) Obtener antes de borrar
    const { recordset } = await pool.request()
      .input('ProductoID', sql.Int, productoId)
      .input('TallaID',    sql.Int, tallaId)
      .query(`
        SELECT ProductoID, TallaID, Stock
          FROM ProductoTallas
         WHERE ProductoID = @ProductoID
           AND TallaID    = @TallaID;
      `);
    const toDelete = recordset[0];
    if (!toDelete) return null;

    // 2) Borrar sin OUTPUT
    await pool.request()
      .input('ProductoID', sql.Int, productoId)
      .input('TallaID',    sql.Int, tallaId)
      .query(`
        DELETE FROM ProductoTallas
         WHERE ProductoID = @ProductoID
           AND TallaID    = @TallaID;
      `);

    return toDelete;
  }
};