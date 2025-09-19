import { getPool } from '../db.js';
import { StockModel } from '../models/stockModel.js';

// Script para probar la actualización de stock
async function testStockUpdate() {
  const pool = await getPool();
  
  try {
    console.log('🧪 Probando actualización de stock...');
    
    // 1. Verificar stock actual de un producto
    const [products] = await pool.execute(`
      SELECT 
        p.ProductoID,
        p.NombreProducto,
        p.Stock as StockGeneral,
        COALESCE(SUM(pt.Stock), 0) as StockPorTallas
      FROM Productos p
      LEFT JOIN ProductoTallas pt ON p.ProductoID = pt.ProductoID
      GROUP BY p.ProductoID, p.NombreProducto, p.Stock
      LIMIT 1
    `);
    
    if (products.length === 0) {
      console.log('❌ No hay productos en la base de datos');
      return;
    }
    
    const product = products[0];
    console.log(`\n📦 Producto seleccionado: ${product.NombreProducto} (ID: ${product.ProductoID})`);
    console.log(`📊 Stock general: ${product.StockGeneral}`);
    console.log(`📊 Stock por tallas: ${product.StockPorTallas}`);
    
    // 2. Obtener una talla específica
    const [tallas] = await pool.execute(`
      SELECT t.TallaID, t.NombreTalla, COALESCE(pt.Stock, 0) as Stock
      FROM Tallas t
      LEFT JOIN ProductoTallas pt ON t.TallaID = pt.TallaID AND pt.ProductoID = ?
      ORDER BY t.TallaID
      LIMIT 1
    `, [product.ProductoID]);
    
    if (tallas.length === 0) {
      console.log('❌ No hay tallas disponibles');
      return;
    }
    
    const talla = tallas[0];
    console.log(`\n👕 Talla seleccionada: ${talla.NombreTalla} (ID: ${talla.TallaID})`);
    console.log(`📊 Stock actual: ${talla.Stock}`);
    
    // 3. Simular compra de 5 unidades cuando hay 4
    const cantidadCompra = 5;
    const stockActual = talla.Stock;
    
    console.log(`\n🛒 Simulando compra de ${cantidadCompra} unidades...`);
    console.log(`📊 Stock antes: ${stockActual}`);
    
    if (stockActual < cantidadCompra) {
      console.log(`⚠️ Stock insuficiente: ${stockActual} < ${cantidadCompra}`);
      
      // Verificar si el sistema detecta esto
      const items = [{
        ProductoID: product.ProductoID,
        TallaID: talla.TallaID,
        Cantidad: cantidadCompra
      }];
      
      const stockIssues = await StockModel.checkStockAvailability(items);
      console.log('🔍 Verificación de stock:', stockIssues);
      
      if (stockIssues.length > 0) {
        console.log('✅ Sistema detecta correctamente stock insuficiente');
      } else {
        console.log('❌ Sistema NO detecta stock insuficiente');
      }
    } else {
      console.log(`✅ Stock suficiente: ${stockActual} >= ${cantidadCompra}`);
      
      // Simular la compra exitosa
      const items = [{
        ProductoID: product.ProductoID,
        TallaID: talla.TallaID,
        Cantidad: cantidadCompra
      }];
      
      console.log('🔄 Actualizando stock...');
      await StockModel.updateStockAfterPurchase(items);
      
      // Verificar stock después
      const [stockAfter] = await pool.execute(`
        SELECT COALESCE(pt.Stock, p.Stock) as StockFinal
        FROM Productos p
        LEFT JOIN ProductoTallas pt ON p.ProductoID = pt.ProductoID AND pt.TallaID = ?
        WHERE p.ProductoID = ?
      `, [talla.TallaID, product.ProductoID]);
      
      const stockFinal = stockAfter[0]?.StockFinal || 0;
      console.log(`📊 Stock después: ${stockFinal}`);
      console.log(`✅ Diferencia: ${stockActual} - ${cantidadCompra} = ${stockActual - cantidadCompra}`);
      
      if (stockFinal === (stockActual - cantidadCompra)) {
        console.log('✅ Stock actualizado correctamente');
      } else {
        console.log('❌ Error en la actualización del stock');
      }
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testStockUpdate();
}

export { testStockUpdate };

