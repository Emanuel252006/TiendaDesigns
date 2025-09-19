import { getPool } from '../db.js';

export const TallaModel = {
  // Obtiene todas las tallas
  async findAll() {
    const pool = await getPool();
    const [rows] = await pool.execute('SELECT TallaID, NombreTalla FROM Tallas ORDER BY NombreTalla');
    return rows;
  },

  // Obtiene una talla por ID
  async findById(id) {
    const pool = await getPool();
    const [rows] = await pool.execute('SELECT TallaID, NombreTalla FROM Tallas WHERE TallaID = ?', [id]);
    return rows[0] || null;
  },

  // Crea una nueva talla
  async create({ NombreTalla }) {
    const pool = await getPool();
    const [result] = await pool.execute(
      'INSERT INTO Tallas (NombreTalla) VALUES (?)',
      [NombreTalla]
    );
    const [rows] = await pool.execute('SELECT TallaID, NombreTalla FROM Tallas WHERE TallaID = ?', [result.insertId]);
    return rows[0] || null;
  },

  // Actualiza una talla existente
  async update(id, { NombreTalla }) {
    const pool = await getPool();
    await pool.execute('UPDATE Tallas SET NombreTalla = ? WHERE TallaID = ?', [NombreTalla, id]);
    const [rows] = await pool.execute('SELECT TallaID, NombreTalla FROM Tallas WHERE TallaID = ?', [id]);
    return rows[0] || null;
  },

  // Elimina una talla
  async remove(id) {
    const pool = await getPool();
    const [before] = await pool.execute('SELECT TallaID, NombreTalla FROM Tallas WHERE TallaID = ?', [id]);
    await pool.execute('DELETE FROM Tallas WHERE TallaID = ?', [id]);
    return before[0] || null;
  }
};