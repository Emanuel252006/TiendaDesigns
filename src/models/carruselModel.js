// src/models/carruselModel.js
import sql from "mssql";
import { getPool } from "../db.js";

export async function getAllCarrusel() {
  const pool = await getPool();
  const result = await pool.request()
    .query("SELECT * FROM Carrusel ORDER BY Orden");
  return result.recordset;
}

export async function getCarruselById(id) {
  const pool = await getPool();
  const result = await pool.request()
    .input("id", sql.Int, id)
    .query("SELECT * FROM Carrusel WHERE CarruselID = @id");
  return result.recordset[0];
}

export async function createCarrusel({ ImagenPath, Orden }) {
  const pool = await getPool();
  const result = await pool.request()
    .input("imagen", sql.NVarChar(255), ImagenPath)
    .input("orden",  sql.Int,          Orden)
    .query(`
      INSERT INTO Carrusel (ImagenPath, Orden)
      OUTPUT inserted.*
      VALUES (@imagen, @orden)
    `);
  return result.recordset[0];
}

export async function updateCarrusel(id, { ImagenPath, Orden }) {
  const pool = await getPool();
  const req = pool.request().input("id", sql.Int, id);
  if (ImagenPath != null) req.input("imagen", sql.NVarChar(255), ImagenPath);
  if (Orden       != null) req.input("orden",  sql.Int,          Orden);
  const result = await req.query(`
    UPDATE Carrusel
       SET ImagenPath = COALESCE(@imagen, ImagenPath),
           Orden       = COALESCE(@orden,   Orden)
     OUTPUT inserted.*
     WHERE CarruselID = @id
  `);
  return result.recordset[0];
}

export async function deleteCarrusel(id) {
  const pool = await getPool();
  await pool.request()
    .input("id", sql.Int, id)
    .query("DELETE FROM Carrusel WHERE CarruselID = @id");
}