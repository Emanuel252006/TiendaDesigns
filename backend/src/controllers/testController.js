import { getPool } from '../db.js';
import { PaymentModel } from '../models/paymentModel.js';
import { OrderModelMySQL } from '../models/orderModelMySQL.js';
import { StockModel } from '../models/stockModel.js';
import { CartModel } from '../models/cartModel.js';

export const TestController = {
  // Endpoint para probar el flujo completo
  async testPaymentFlow(req, res) {
    try {
      console.log('🧪 Iniciando prueba del flujo de pago...');
      
      const userId = req.user?.UsuarioID || 2; // Usuario por defecto para pruebas
      
      // 1. Verificar stock actual
      console.log('📊 Verificando stock actual...');
      const pool = await getPool();
      const [stock] = await pool.execute(`
        SELECT p.ProductoID, p.NombreProducto, p.Stock, 
               COALESCE(SUM(pt.Stock), 0) as StockPorTallas
        FROM Productos p
        LEFT JOIN ProductoTallas pt ON p.ProductoID = pt.ProductoID
        GROUP BY p.ProductoID, p.NombreProducto, p.Stock
        LIMIT 3
      `);
      
      console.log('📦 Stock actual:', stock);
      
      // 2. Simular items de compra
      const testItems = [
        {
          ProductoID: 1,
          TallaID: 1,
          Cantidad: 2,
          Precio: 50000
        }
      ];
      
      console.log('🛒 Items de prueba:', testItems);
      
      // 3. Verificar stock disponible
      const stockIssues = await StockModel.checkStockAvailability(testItems);
      if (stockIssues.length > 0) {
        console.log('⚠️ Problemas de stock:', stockIssues);
        return res.json({
          success: false,
          message: 'Stock insuficiente',
          stockIssues
        });
      }
      
      // 4. Crear orden de prueba
      console.log('📝 Creando orden de prueba...');
      const order = await OrderModelMySQL.createOrder({
        UsuarioID: userId,
        NombreCliente: 'Usuario Prueba',
        EmailCliente: 'prueba@test.com',
        TelefonoCliente: '123456789',
        DireccionEnvio: 'Dirección de prueba',
        CiudadEnvio: 'Medellín',
        CodigoPostalEnvio: '050001',
        MetodoPago: 'PayU',
        Estado: 'Pendiente',
        PaymentId: null,
        PreferenceId: null
      });
      
      console.log('✅ Orden creada:', order);
      
      // 5. Agregar items a la orden
      await OrderModelMySQL.addOrderItems(order.OrdenID, testItems);
      console.log('📦 Items agregados a la orden');
      
      // 6. Simular pago exitoso
      console.log('💳 Simulando pago exitoso...');
      const paymentId = await PaymentModel.createPayment({
        OrdenID: order.OrdenID,
        Monto: 100000,
        MetodoPago: 'PayU',
        PaymentId: `test_payment_${Date.now()}`,
        PreferenceId: `test_preference_${Date.now()}`,
        Estado: 'Aprobado'
      });
      
      console.log('✅ Pago registrado:', paymentId);
      
      // 7. Actualizar estado de la orden
      await OrderModelMySQL.updateOrderStatus(order.OrdenID, 'Pagado');
      console.log('📦 Orden marcada como pagada');
      
      // 8. Actualizar stock
      console.log('📊 Actualizando stock...');
      await StockModel.updateStockAfterPurchase(testItems);
      console.log('✅ Stock actualizado');
      
      // 9. Limpiar carrito
      console.log('🧹 Limpiando carrito...');
      await CartModel.clearCart(userId);
      console.log('✅ Carrito limpiado');
      
      // 10. Verificar stock final
      const [finalStock] = await pool.execute(`
        SELECT p.ProductoID, p.NombreProducto, p.Stock, 
               COALESCE(SUM(pt.Stock), 0) as StockPorTallas
        FROM Productos p
        LEFT JOIN ProductoTallas pt ON p.ProductoID = pt.ProductoID
        WHERE p.ProductoID = 1
        GROUP BY p.ProductoID, p.NombreProducto, p.Stock
      `);
      
      console.log('📊 Stock final:', finalStock);
      
      res.json({
        success: true,
        message: 'Flujo de pago probado exitosamente',
        data: {
          orderId: order.OrdenID,
          paymentId: paymentId,
          stockBefore: stock,
          stockAfter: finalStock,
          items: testItems
        }
      });
      
    } catch (error) {
      console.error('❌ Error en prueba de flujo:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        detalle: error.stack
      });
    }
  },
  
  // Endpoint para verificar estado actual
  async checkStatus(req, res) {
    try {
      const pool = await getPool();
      
      // Verificar conexión básica
      const [connection] = await pool.execute('SELECT 1 as test');
      
      // Verificar stock básico
      const [stock] = await pool.execute(`
        SELECT ProductoID, NombreProducto, Stock
        FROM Productos
        ORDER BY ProductoID
        LIMIT 3
      `);
      
      // Verificar estructura de tablas
      const [tables] = await pool.execute(`
        SHOW TABLES LIKE 'Pagos'
      `);
      
      // Si existe la tabla Pagos, verificar su estructura y agregar columna Estado si falta
      let pagosStructure = null;
      if (tables.length > 0) {
        const [structure] = await pool.execute('DESCRIBE Pagos');
        pagosStructure = structure;
        
        // Verificar y agregar columnas que faltan
        const hasEstado = structure.some(col => col.Field === 'Estado');
        const hasPaymentId = structure.some(col => col.Field === 'PaymentId');
        const hasPreferenceId = structure.some(col => col.Field === 'PreferenceId');
        
        if (!hasEstado) {
          console.log('🔧 Agregando columna Estado a la tabla Pagos...');
          await pool.execute('ALTER TABLE Pagos ADD COLUMN Estado VARCHAR(50) DEFAULT "Pendiente"');
          console.log('✅ Columna Estado agregada exitosamente');
        }
        
        if (!hasPaymentId) {
          console.log('🔧 Agregando columna PaymentId a la tabla Pagos...');
          await pool.execute('ALTER TABLE Pagos ADD COLUMN PaymentId VARCHAR(100) NULL');
          console.log('✅ Columna PaymentId agregada exitosamente');
        }
        
        if (!hasPreferenceId) {
          console.log('🔧 Agregando columna PreferenceId a la tabla Pagos...');
          await pool.execute('ALTER TABLE Pagos ADD COLUMN PreferenceId VARCHAR(100) NULL');
          console.log('✅ Columna PreferenceId agregada exitosamente');
        }
        
        // Obtener la estructura actualizada
        const [updatedStructure] = await pool.execute('DESCRIBE Pagos');
        pagosStructure = updatedStructure;
      }
      
      res.json({
        success: true,
        message: 'Estado del sistema verificado',
        data: {
          connection: connection[0],
          stock,
          tables,
          pagosStructure,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('❌ Error verificando estado:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        sql: error.sql || 'No SQL disponible'
      });
    }
  }
};
