import { getPool } from '../db.js';

// Script para verificar y corregir el stock
async function checkAndFixStock() {
  const pool = await getPool();
  
  try {
    console.log('🔍 Verificando stock actual...');
    
    // Obtener todos los productos con su stock
    const [products] = await pool.execute(`
      SELECT 
        p.ProductoID,
        p.NombreProducto,
        p.Stock as StockGeneral,
        COALESCE(SUM(pt.Stock), 0) as StockPorTallas
      FROM Productos p
      LEFT JOIN ProductoTallas pt ON p.ProductoID = pt.ProductoID
      GROUP BY p.ProductoID, p.NombreProducto, p.Stock
      ORDER BY p.ProductoID
    `);
    
    console.log('\n📊 Stock actual de productos:');
    console.log('ID | Nombre | Stock General | Stock por Tallas');
    console.log('---|--------|---------------|-----------------');
    
    for (const product of products) {
      console.log(`${product.ProductoID} | ${product.NombreProducto} | ${product.StockGeneral} | ${product.StockPorTallas}`);
    }
    
    // Verificar stock por tallas específicas
    console.log('\n📦 Stock por tallas:');
    const [stockBySize] = await pool.execute(`
      SELECT 
        p.ProductoID,
        p.NombreProducto,
        t.NombreTalla,
        COALESCE(pt.Stock, 0) as Stock
      FROM Productos p
      CROSS JOIN Tallas t
      LEFT JOIN ProductoTallas pt ON p.ProductoID = pt.ProductoID AND t.TallaID = pt.TallaID
      ORDER BY p.ProductoID, t.TallaID
    `);
    
    console.log('ID | Producto | Talla | Stock');
    console.log('---|----------|-------|------');
    
    for (const item of stockBySize) {
      console.log(`${item.ProductoID} | ${item.NombreProducto} | ${item.NombreTalla} | ${item.Stock}`);
    }
    
    // Verificar si hay inconsistencias
    console.log('\n⚠️ Verificando inconsistencias...');
    const [inconsistencies] = await pool.execute(`
      SELECT 
        p.ProductoID,
        p.NombreProducto,
        p.Stock as StockGeneral,
        COALESCE(SUM(pt.Stock), 0) as StockPorTallas,
        (p.Stock - COALESCE(SUM(pt.Stock), 0)) as Diferencia
      FROM Productos p
      LEFT JOIN ProductoTallas pt ON p.ProductoID = pt.ProductoID
      GROUP BY p.ProductoID, p.NombreProducto, p.Stock
      HAVING p.Stock != COALESCE(SUM(pt.Stock), 0)
    `);
    
    if (inconsistencies.length > 0) {
      console.log('❌ Inconsistencias encontradas:');
      for (const inc of inconsistencies) {
        console.log(`Producto ${inc.ProductoID} (${inc.NombreProducto}): General=${inc.StockGeneral}, PorTallas=${inc.StockPorTallas}, Diferencia=${inc.Diferencia}`);
      }
    } else {
      console.log('✅ No se encontraron inconsistencias');
    }
    
  } catch (error) {
    console.error('❌ Error verificando stock:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  checkAndFixStock();
}

export { checkAndFixStock };

