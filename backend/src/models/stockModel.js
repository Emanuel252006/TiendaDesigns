import { getPool } from '../db.js';

export const StockModel = {
  // Actualizar stock después de una compra
  // NOTA: Los triggers de la BD ya manejan esto automáticamente al insertar OrdenArticulos
  async updateStockAfterPurchase(items) {
    const pool = await getPool();
    
    try {
      console.log('📦 Actualizando stock para items:', items);
      
      await pool.query('START TRANSACTION');
      
      for (const item of items) {
        console.log(`🔄 Procesando item: ProductoID=${item.ProductoID}, TallaID=${item.TallaID}, Cantidad=${item.Cantidad}`);
        
        // Verificar stock actual antes de la compra
        const [stockBefore] = await pool.execute(`
          SELECT COALESCE(pt.Stock, p.Stock) as StockActual
          FROM Productos p
          LEFT JOIN ProductoTallas pt ON p.ProductoID = pt.ProductoID AND pt.TallaID = ?
          WHERE p.ProductoID = ?
        `, [item.TallaID, item.ProductoID]);
        
        const stockActual = stockBefore[0]?.StockActual || 0;
        console.log(`📊 Stock actual: ${stockActual}`);
        
        // Verificar si existe stock específico por talla
        const [stockRows] = await pool.execute(`
          SELECT Stock FROM ProductoTallas 
          WHERE ProductoID = ? AND TallaID = ?
        `, [item.ProductoID, item.TallaID]);
        
        if (stockRows.length > 0) {
          // Actualizar stock específico por talla
          const newStock = stockRows[0].Stock - item.Cantidad;
          console.log(`📉 Actualizando ProductoTallas: ${stockRows[0].Stock} - ${item.Cantidad} = ${newStock}`);
          
          await pool.execute(`
            UPDATE ProductoTallas 
            SET Stock = ?
            WHERE ProductoID = ? AND TallaID = ?
          `, [newStock, item.ProductoID, item.TallaID]);
        } else {
          // Actualizar stock general del producto
          const [productStock] = await pool.execute(`
            SELECT Stock FROM Productos WHERE ProductoID = ?
          `, [item.ProductoID]);
          
          if (productStock.length > 0) {
            const newStock = productStock[0].Stock - item.Cantidad;
            console.log(`📉 Actualizando Productos: ${productStock[0].Stock} - ${item.Cantidad} = ${newStock}`);
            
            await pool.execute(`
              UPDATE Productos 
              SET Stock = ?
              WHERE ProductoID = ?
            `, [newStock, item.ProductoID]);
          }
        }
        
        // Verificar stock después de la actualización
        const [stockAfter] = await pool.execute(`
          SELECT COALESCE(pt.Stock, p.Stock) as StockFinal
          FROM Productos p
          LEFT JOIN ProductoTallas pt ON p.ProductoID = pt.ProductoID AND pt.TallaID = ?
          WHERE p.ProductoID = ?
        `, [item.TallaID, item.ProductoID]);
        
        const stockFinal = stockAfter[0]?.StockFinal || 0;
        console.log(`✅ Stock final: ${stockFinal}`);
      }
      
      await pool.query('COMMIT');
      console.log('✅ Stock actualizado exitosamente');
      return true;
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('❌ Error actualizando stock:', error);
      throw error;
    }
  },

  // Verificar stock disponible
  async checkStockAvailability(items) {
    const pool = await getPool();
    const stockIssues = [];
    
    for (const item of items) {
      // Verificar stock específico por talla
      const [stockRows] = await pool.execute(`
        SELECT Stock FROM ProductoTallas 
        WHERE ProductoID = ? AND TallaID = ?
      `, [item.ProductoID, item.TallaID]);
      
      let availableStock = 0;
      
      if (stockRows.length > 0) {
        availableStock = stockRows[0].Stock;
      } else {
        // Verificar stock general del producto
        const [productRows] = await pool.execute(`
          SELECT Stock FROM Productos WHERE ProductoID = ?
        `, [item.ProductoID]);
        
        if (productRows.length > 0) {
          availableStock = productRows[0].Stock;
        }
      }
      
      if (availableStock < item.Cantidad) {
        stockIssues.push({
          ProductoID: item.ProductoID,
          TallaID: item.TallaID,
          CantidadSolicitada: item.Cantidad,
          StockDisponible: availableStock
        });
      }
    }
    
    return stockIssues;
  },

  // Restaurar stock (para cancelaciones)
  async restoreStock(items) {
    const pool = await getPool();
    
    try {
      await pool.query('START TRANSACTION');
      
      for (const item of items) {
        // Verificar si existe stock específico por talla
        const [stockRows] = await pool.execute(`
          SELECT Stock FROM ProductoTallas 
          WHERE ProductoID = ? AND TallaID = ?
        `, [item.ProductoID, item.TallaID]);
        
        if (stockRows.length > 0) {
          // Restaurar stock específico por talla
          await pool.execute(`
            UPDATE ProductoTallas 
            SET Stock = Stock + ?
            WHERE ProductoID = ? AND TallaID = ?
          `, [item.Cantidad, item.ProductoID, item.TallaID]);
        } else {
          // Restaurar stock general del producto
          await pool.execute(`
            UPDATE Productos 
            SET Stock = Stock + ?
            WHERE ProductoID = ?
          `, [item.Cantidad, item.ProductoID]);
        }
      }
      
      await pool.query('COMMIT');
      return true;
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  }
};
