import sql from 'mssql';
import { getPool } from '../db.js';

export const TallaModel = {
  // Obtiene todas las tallas
  async findAll() {
    const pool = await getPool();
    const result = await pool
      .request()
      .query('SELECT TallaID, NombreTalla FROM Tallas ORDER BY NombreTalla');
    return result.recordset;
  },

  // Obtiene una talla por ID
  async findById(id) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT TallaID, NombreTalla FROM Tallas WHERE TallaID = @id');
    return result.recordset[0] || null;
  },

  // Crea una nueva talla
  async create({ NombreTalla }) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('NombreTalla', sql.NVarChar(10), NombreTalla)
      .query(`
        INSERT INTO Tallas (NombreTalla)
        OUTPUT inserted.TallaID, inserted.NombreTalla
        VALUES (@NombreTalla)
      `);
    return result.recordset[0];
  },

  // Actualiza una talla existente
  async update(id, { NombreTalla }) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .input('NombreTalla', sql.NVarChar(10), NombreTalla)
      .query(`
        UPDATE Tallas
           SET NombreTalla = @NombreTalla
         OUTPUT inserted.TallaID, inserted.NombreTalla
         WHERE TallaID = @id
      `);
    return result.recordset[0] || null;
  },

  // Elimina una talla
  async remove(id) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        DELETE FROM Tallas
        OUTPUT deleted.TallaID, deleted.NombreTalla
        WHERE TallaID = @id
      `);
    return result.recordset[0] || null;
  }
};