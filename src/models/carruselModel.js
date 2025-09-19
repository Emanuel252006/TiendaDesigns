// src/models/carruselModel.js
import { getPool } from "../db.js";

export async function getAllCarrusel() {
  const pool = await getPool();
  const [rows] = await pool.execute("SELECT * FROM Carrusel ORDER BY Orden");
  return rows;
}

export async function getCarruselById(id) {
  const pool = await getPool();
  const [rows] = await pool.execute("SELECT * FROM Carrusel WHERE CarruselID = ?", [id]);
  return rows[0];
}

export async function createCarrusel({ ImagenPath, Orden }) {
  const pool = await getPool();
  
  // Comenzar transacción para asegurar consistencia
  await pool.query("START TRANSACTION");
  
  try {
    // Desplazar todos los elementos con orden mayor o igual al nuevo orden
    await pool.execute(`
      UPDATE Carrusel 
      SET Orden = Orden + 1 
      WHERE Orden >= ?
    `, [Orden]);
    
    // Insertar el nuevo elemento en la posición deseada
    const [result] = await pool.execute(`
      INSERT INTO Carrusel (ImagenPath, Orden)
      VALUES (?, ?)
    `, [ImagenPath, Orden]);
    
    // Confirmar transacción
    await pool.query("COMMIT");
    
    // Obtener el registro insertado
    const [rows] = await pool.execute("SELECT * FROM Carrusel WHERE CarruselID = ?", [result.insertId]);
    return rows[0];
  } catch (error) {
    // Revertir transacción en caso de error
    await pool.query("ROLLBACK");
    throw error;
  }
}

export async function updateCarrusel(id, { ImagenPath, Orden }) {
  const pool = await getPool();
  
  // Si solo se actualiza la imagen, no hay cambios de orden
  if (Orden == null) {
    await pool.execute("UPDATE Carrusel SET ImagenPath = ? WHERE CarruselID = ?", [ImagenPath, id]);
    const [rows] = await pool.execute("SELECT * FROM Carrusel WHERE CarruselID = ?", [id]);
    return rows[0];
  }
  
  // Comenzar transacción para manejar cambios de orden
  await pool.query("START TRANSACTION");
  
  try {
    // Obtener el orden actual del elemento
    const [currentItem] = await pool.execute("SELECT Orden FROM Carrusel WHERE CarruselID = ?", [id]);
    if (!currentItem.length) {
      await pool.query("ROLLBACK");
      throw new Error("Elemento del carrusel no encontrado");
    }
    
    const currentOrder = currentItem[0].Orden;
    const newOrder = parseInt(Orden);
    
    // Si el orden no cambia, solo actualizar la imagen si es necesaria
    if (currentOrder === newOrder) {
      if (ImagenPath != null) {
        await pool.execute("UPDATE Carrusel SET ImagenPath = ? WHERE CarruselID = ?", [ImagenPath, id]);
      }
    } else {
      // Manejar reordenamiento
      if (newOrder < currentOrder) {
        // Mover hacia arriba: desplazar elementos hacia abajo
        await pool.execute(`
          UPDATE Carrusel 
          SET Orden = Orden + 1 
          WHERE Orden >= ? AND Orden < ? AND CarruselID != ?
        `, [newOrder, currentOrder, id]);
      } else {
        // Mover hacia abajo: desplazar elementos hacia arriba
        await pool.execute(`
          UPDATE Carrusel 
          SET Orden = Orden - 1 
          WHERE Orden > ? AND Orden <= ? AND CarruselID != ?
        `, [currentOrder, newOrder, id]);
      }
      
      // Actualizar el elemento actual
      let updateQuery = "UPDATE Carrusel SET Orden = ?";
      let updateParams = [newOrder];
      
      if (ImagenPath != null) {
        updateQuery += ", ImagenPath = ?";
        updateParams.push(ImagenPath);
      }
      
      updateQuery += " WHERE CarruselID = ?";
      updateParams.push(id);
      
      await pool.execute(updateQuery, updateParams);
    }
    
    // Confirmar transacción
    await pool.query("COMMIT");
    
    // Obtener el registro actualizado
    const [rows] = await pool.execute("SELECT * FROM Carrusel WHERE CarruselID = ?", [id]);
    return rows[0];
  } catch (error) {
    // Revertir transacción en caso de error
    await pool.query("ROLLBACK");
    throw error;
  }
}

export async function deleteCarrusel(id) {
  const pool = await getPool();
  
  // Comenzar transacción
  await pool.query("START TRANSACTION");
  
  try {
    // Obtener el orden del elemento a eliminar
    const [currentItem] = await pool.execute("SELECT Orden FROM Carrusel WHERE CarruselID = ?", [id]);
    if (!currentItem.length) {
      await pool.query("ROLLBACK");
      throw new Error("Elemento del carrusel no encontrado");
    }
    
    const deletedOrder = currentItem[0].Orden;
    
    // Eliminar el elemento
    await pool.execute("DELETE FROM Carrusel WHERE CarruselID = ?", [id]);
    
    // Reorganizar los elementos posteriores
    await pool.execute(`
      UPDATE Carrusel 
      SET Orden = Orden - 1 
      WHERE Orden > ?
    `, [deletedOrder]);
    
    // Confirmar transacción
    await pool.query("COMMIT");
  } catch (error) {
    // Revertir transacción en caso de error
    await pool.query("ROLLBACK");
    throw error;
  }
}