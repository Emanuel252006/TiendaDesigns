// src/models/productTallaModel.js
import { getPool } from '../db.js';

export const productTallaModel = {
  // Listar todas o filtrar por productoId
  async findAll(productoId) {
    const pool = await getPool();
    let query = `
      SELECT pt.ProductoID,
             pt.TallaID,
             pt.Stock,
             t.NombreTalla
        FROM ProductoTallas pt
   LEFT JOIN Tallas t ON pt.TallaID = t.TallaID
    `;
    let params = [];
    if (productoId) {
      query += ' WHERE pt.ProductoID = ?';
      params.push(productoId);
    }
    const [rows] = await pool.execute(query, params);
    return rows;
  },

  // Obtener una única combinación
  async findOne(productoId, tallaId) {
    const pool = await getPool();
    const [rows] = await pool.execute(`
      SELECT ProductoID, TallaID, Stock
        FROM ProductoTallas
       WHERE ProductoID = ?
         AND TallaID    = ?
    `, [productoId, tallaId]);
    return rows[0] || null;
  },

  // Crear nueva relación producto–talla
  async create({ ProductoID, TallaID, Stock }) {
    console.log('=== DEBUG: productTallaModel.create ===');
    console.log('Datos recibidos:', { ProductoID, TallaID, Stock });
    
    const pool = await getPool();

    // 1) Insertar
    await pool.execute(`
      INSERT INTO ProductoTallas (ProductoID, TallaID, Stock)
      VALUES (?, ?, ?)
    `, [ProductoID, TallaID, Stock]);

    // 2) Consultar el registro insertado
    const [rows] = await pool.execute(`
      SELECT ProductoID, TallaID, Stock
        FROM ProductoTallas
       WHERE ProductoID = ?
         AND TallaID    = ?
    `, [ProductoID, TallaID]);

    console.log('Registro insertado:', rows[0]);
    return rows[0];
  },

  // Actualizar stock de la combinación
  async update(productoId, tallaId, Stock) {
    const pool = await getPool();

    // 1) UPDATE
    await pool.execute(`
      UPDATE ProductoTallas
         SET Stock = ?
       WHERE ProductoID = ?
         AND TallaID    = ?
    `, [Stock, productoId, tallaId]);

    // 2) Consultar el registro actualizado
    const [rows] = await pool.execute(`
      SELECT ProductoID, TallaID, Stock
        FROM ProductoTallas
       WHERE ProductoID = ?
         AND TallaID    = ?
    `, [productoId, tallaId]);

    return rows[0] || null;
  },

  // Eliminar la relación
  async remove(productoId, tallaId) {
    const pool = await getPool();

    // 1) Obtener antes de borrar
    const [rows] = await pool.execute(`
      SELECT ProductoID, TallaID, Stock
        FROM ProductoTallas
       WHERE ProductoID = ?
         AND TallaID    = ?
    `, [productoId, tallaId]);
    const toDelete = rows[0];
    if (!toDelete) return null;

    // 2) Borrar
    await pool.execute(`
      DELETE FROM ProductoTallas
       WHERE ProductoID = ?
         AND TallaID    = ?
    `, [productoId, tallaId]);

    return toDelete;
  }
};