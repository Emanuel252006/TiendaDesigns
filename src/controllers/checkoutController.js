import { OrderModel } from '../models/orderModel.js';
import { OrderModelMySQL } from '../models/orderModelMySQL.js';
import { CartModel } from '../models/cartModel.js';
import { PDFService } from '../services/pdfService.js';
import { sendPurchaseConfirmationEmail } from '../services/emailService.js';

export const CheckoutController = {
  // Endpoint de prueba
  async testCheckout(req, res) {
    try {
      res.json({
        success: true,
        message: 'Checkout endpoint funcionando',
        user: req.user
      });
    } catch (error) {
      console.error('Error en test checkout:', error);
      res.status(500).json({
        success: false,
        message: 'Error en test checkout',
        error: error.message
      });
    }
  },

  // Procesar checkout y crear orden
  async processCheckout(req, res) {
    try {
      const userId = req.user.UsuarioID;
      const { nombre, email, telefono, direccion, ciudad, codigoPostal, pais, metodoPago, items, paymentId } = req.body;

      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      if (!nombre || !email || !direccion || !ciudad || !codigoPostal) {
        return res.status(400).json({ message: "Datos incompletos para el checkout" });
      }

      if (!items || items.length === 0) {
        return res.status(400).json({ message: "No hay productos en el carrito" });
      }

      // Crear la orden
      const order = await OrderModel.createOrder({
        UsuarioID: userId,
        NombreCliente: nombre,
        EmailCliente: email,
        TelefonoCliente: telefono || '',
        DireccionEnvio: direccion,
        CiudadEnvio: ciudad,
        CodigoPostalEnvio: codigoPostal,
        MetodoPago: metodoPago
      });

      if (!order || !order.OrdenID) {
        return res.status(500).json({ message: "Error al crear la orden" });
      }

      // Agregar items a la orden
      const itemsToAdd = items.map(item => ({
        ProductoID: item.ProductoID,
        TallaID: item.TallaID,
        Cantidad: item.Cantidad,
        Precio: item.Precio
      }));
      await OrderModel.addOrderItems(order.OrdenID, itemsToAdd);

      // Obtener la orden completa con items
      const orderData = await OrderModel.getOrderById(order.OrdenID);
      
      if (!orderData || orderData.length === 0) {
        return res.status(500).json({ message: "Error al obtener los datos de la orden" });
      }

      // Calcular subtotal y total (con envío gratis)
      const subtotal = orderData.reduce((sum, item) => sum + (item.Precio * item.Cantidad), 0);
      const shipping = 0; // Envío gratis
      const total = subtotal + shipping; // Total incluye envío (que es 0)

      // Preparar datos para el PDF
      const pdfOrderData = {
        ...orderData[0],
        items: orderData
      };

      // Generar PDF
      const pdfResult = await PDFService.generateInvoice(pdfOrderData);
      if (!pdfResult.url) {
        return res.status(500).json({ message: "Error al generar la factura" });
      }

      // Vaciar carrito
      await CartModel.clearCart(userId);

      res.status(200).json({
        message: "Checkout procesado exitosamente",
        orderId: order.OrdenID,
        pdfUrl: pdfResult.url
      });
    } catch (error) {
      console.error("Error en processCheckout:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  // Obtener órdenes del usuario
  async getUserOrders(req, res) {
    try {
      const userId = req.user.UsuarioID;
      const orders = await OrderModel.getOrdersByUserId(userId);

      res.json({
        success: true,
        data: orders
      });

    } catch (error) {
      console.error('Error al obtener órdenes:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener órdenes'
      });
    }
  },

  // Obtener detalles de una orden
  async getOrderDetails(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.UsuarioID;

      const orderData = await OrderModel.getOrderById(orderId);
      
      if (orderData.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Orden no encontrada'
        });
      }

      // Verificar que la orden pertenece al usuario
      if (orderData[0].UsuarioID !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver esta orden'
        });
      }

      res.json({
        success: true,
        data: orderData
      });

    } catch (error) {
      console.error('Error al obtener detalles de orden:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener detalles de orden'
      });
    }
  },

  // Procesar orden después del pago exitoso
  async processOrderAfterPayment(req, res) {
    try {
      const userId = req.user.UsuarioID;
      const { nombre, email, telefono, direccion, ciudad, codigoPostal, pais, items, paymentId, preferenceId } = req.body;

      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      if (!nombre || !email || !direccion || !ciudad || !codigoPostal) {
        return res.status(400).json({ message: "Datos incompletos para el checkout" });
      }

      if (!items || items.length === 0) {
        return res.status(400).json({ message: "No hay productos en el carrito" });
      }

      // Crear la orden con información del pago
      const order = await OrderModel.createOrder({
        UsuarioID: userId,
        NombreCliente: nombre,
        EmailCliente: email,
        TelefonoCliente: telefono || '',
        DireccionEnvio: direccion,
        CiudadEnvio: ciudad,
        CodigoPostalEnvio: codigoPostal,
        MetodoPago: 'PayU',
        PaymentId: paymentId,
        PreferenceId: preferenceId
      });

      if (!order || !order.OrdenID) {
        return res.status(500).json({ message: "Error al crear la orden" });
      }

      // Agregar items a la orden
      const itemsToAdd = items.map(item => ({
        ProductoID: item.ProductoID,
        TallaID: item.TallaID,
        Cantidad: item.Cantidad,
        Precio: item.Precio
      }));
      await OrderModel.addOrderItems(order.OrdenID, itemsToAdd);

      // Obtener la orden completa con items
      const orderData = await OrderModel.getOrderById(order.OrdenID);
      
      if (!orderData || orderData.length === 0) {
        return res.status(500).json({ message: "Error al obtener los datos de la orden" });
      }

      // Calcular total
      const total = orderData.reduce((sum, item) => sum + (item.Precio * item.Cantidad), 0);

      // Preparar datos para el PDF
      const pdfOrderData = {
        ...orderData[0],
        items: orderData
      };

      // Generar PDF
      const pdfResult = await PDFService.generateInvoice(pdfOrderData);
      if (!pdfResult.url) {
        return res.status(500).json({ message: "Error al generar la factura" });
      }

      // Vaciar carrito
      await CartModel.clearCart(userId);

      // El pago se procesa automáticamente

      res.status(200).json({
        message: "Orden procesada exitosamente después del pago",
        orderId: order.OrdenID,
        pdfUrl: pdfResult.url
      });
    } catch (error) {
      console.error("Error en processOrderAfterPayment:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  // Marcar pedido como entregado
  async markAsDelivered(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.UsuarioID;

      // Verificar que el usuario sea administrador
      if (!req.user || req.user.Rol !== 'Admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores pueden marcar pedidos como entregados.'
        });
      }

      const order = await OrderModel.markAsDelivered(orderId, userId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Orden no encontrada o no autorizada para marcar como entregada.'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Pedido marcado como entregado exitosamente.',
        order
      });
    } catch (error) {
      console.error('Error al marcar pedido como entregado:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al marcar pedido como entregado'
      });
    }
  },

  // Obtener pedidos activos (solo para administradores)
  async getActiveOrders(req, res) {
    try {
      console.log('🔍 Debug - Usuario en getActiveOrders:', req.user);
      console.log('🔍 Debug - Rol del usuario:', req.user?.Rol);
      console.log('🔍 Debug - Tipo de req.user:', typeof req.user);
      console.log('🔍 Debug - Keys de req.user:', req.user ? Object.keys(req.user) : 'req.user es null');
      
      // Verificar que el usuario sea administrador
      if (!req.user || req.user.Rol !== 'Admin') {
        console.log('❌ Acceso denegado - Usuario no es admin');
        console.log('❌ req.user existe:', !!req.user);
        console.log('❌ req.user.Rol:', req.user?.Rol);
        console.log('❌ req.user.Rol === "Admin":', req.user?.Rol === 'Admin');
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores pueden ver pedidos activos.'
        });
      }

      console.log('✅ Usuario es admin, obteniendo pedidos activos...');
      const activeOrders = await OrderModel.getActiveOrders();
      console.log('🔍 Debug - Pedidos activos encontrados:', activeOrders.length);
      console.log('🔍 Debug - Primeros pedidos:', activeOrders.slice(0, 2));
      
      // Para cada orden, obtener sus items
      const ordersWithItems = await Promise.all(
        activeOrders.map(async (order) => {
          const items = await OrderModel.getOrderItems(order.OrdenID);
          return {
            ...order,
            items
          };
        })
      );

      console.log('✅ Enviando respuesta con', ordersWithItems.length, 'pedidos');
      res.json({
        success: true,
        orders: ordersWithItems
      });
    } catch (error) {
      console.error('Error al obtener pedidos activos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener pedidos activos'
      });
    }
  },


  // Obtener estadísticas de ventas (solo para administradores)
  async getSalesStats(req, res) {
    try {
      // Verificar que el usuario sea administrador
      if (!req.user || req.user.Rol !== 'Admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores pueden ver estadísticas de ventas.'
        });
      }

      console.log('🔍 Usuario solicitando estadísticas:', req.user.NombreUsuario);
      const stats = await OrderModelMySQL.getSalesStats();
      console.log('📊 Estadísticas obtenidas:', stats);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error al obtener estadísticas de ventas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener estadísticas de ventas',
        error: error.message
      });
    }
  },

  // Simular proceso completo de checkout y pago (para testing)
  async simulateCheckoutAndPayment(req, res) {
    try {
      const userId = req.user.UsuarioID;
      const { nombre, email, telefono, direccion, ciudad, codigoPostal, pais, items } = req.body;

      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      if (!nombre || !email || !direccion || !ciudad || !codigoPostal) {
        return res.status(400).json({ message: "Datos incompletos para el checkout" });
      }

      if (!items || items.length === 0) {
        return res.status(400).json({ message: "No hay productos en el carrito" });
      }

      console.log('🎭 MODO SIMULACIÓN: Procesando checkout completo...');

      // 1. Crear la orden usando el modelo MySQL
      const order = await OrderModelMySQL.createOrder({
        UsuarioID: userId,
        NombreCliente: nombre,
        EmailCliente: email,
        TelefonoCliente: telefono || '',
        DireccionEnvio: direccion,
        CiudadEnvio: ciudad,
        CodigoPostalEnvio: codigoPostal,
        MetodoPago: 'simulacion',
        Estado: 'Pagado'
      });

      console.log('✅ Orden creada:', order.OrdenID);

      // 2. Agregar items a la orden
      const itemsToAdd = items.map(item => ({
        ProductoID: item.ProductoID,
        TallaID: item.TallaID,
        Cantidad: item.Cantidad,
        Precio: item.Precio
      }));
      
      await OrderModelMySQL.addOrderItems(order.OrdenID, itemsToAdd);
      console.log('✅ Items agregados a la orden');

      // 3. Calcular total
      const total = items.reduce((sum, item) => sum + (parseFloat(item.Precio) * item.Cantidad), 0);

      // 4. Crear pago simulado
      const { PaymentModel } = await import('../models/paymentModel.js');
      const simulatedPaymentId = `sim_${Date.now()}`;
      const simulatedPreferenceId = `pref_${order.OrdenID}`;
      
      const paymentId = await PaymentModel.createPayment({
        OrdenID: order.OrdenID,
        Monto: total,
        MetodoPago: 'simulacion',
        PaymentId: simulatedPaymentId,
        PreferenceId: simulatedPreferenceId,
        Estado: 'Aprobado'
      });

      console.log('✅ Pago simulado creado:', paymentId);

      // 5. Actualizar la orden con PaymentId y PreferenceId
      await OrderModelMySQL.updateOrderStatus(order.OrdenID, 'Pagado', simulatedPaymentId, simulatedPreferenceId);
      console.log('✅ Orden actualizada con PaymentId y PreferenceId');

      // 6. Limpiar carrito
      await CartModel.clearCart(userId);
      console.log('✅ Carrito limpiado');

      // 7. Intentar generar PDF de la orden (opcional)
      let pdfUrl = null;
      try {
        const orderData = await OrderModelMySQL.getOrderById(order.OrdenID);
        if (orderData && orderData.length > 0) {
          pdfUrl = await PDFService.generateInvoice(orderData[0]);
          console.log('✅ PDF generado:', pdfUrl);
        }
      } catch (pdfError) {
        console.log('⚠️ Error generando PDF (continuando sin PDF):', pdfError.message);
      }

      // 8. Enviar email de confirmación para simulación
      try {
        // Obtener datos del carrito para el email (antes de limpiarlo)
        const cart = await CartModel.getCartByUserId(userId);
        
        const emailOrderData = {
          orderId: order.OrdenID,
          customerName: nombre,
          customerEmail: email,
          items: items.map(item => ({
            productName: item.NombreProducto || 'Producto',
            size: item.NombreTalla || 'N/A',
            quantity: item.Cantidad,
            unitPrice: parseFloat(item.Precio)
          })),
          total: total,
          shippingAddress: {
            address: direccion,
            city: ciudad,
            postalCode: codigoPostal,
            country: pais || 'Colombia'
          }
        };

        const emailPaymentData = {
          transactionId: simulatedPaymentId,
          paymentMethod: 'Simulación',
          paymentStatus: 'APPROVED',
          paymentDate: new Date()
        };

        // Enviar email de confirmación
        await sendPurchaseConfirmationEmail(emailOrderData, emailPaymentData);
        console.log('📧 Email de confirmación enviado para simulación');
      } catch (emailError) {
        console.error('❌ Error enviando email de confirmación (simulación):', emailError);
        // No fallar la simulación por error en email, solo logear
      }

      res.json({
        success: true,
        message: 'Checkout y pago simulado completado exitosamente',
        data: {
          orderId: order.OrdenID,
          paymentId: paymentId,
          total: total,
          pdfUrl: pdfUrl,
          simulation: true
        }
      });

    } catch (error) {
      console.error('❌ Error en simulación de checkout:', error);
      res.status(500).json({
        success: false,
        message: 'Error en la simulación de checkout',
        error: error.message
      });
    }
  },

  // Endpoint temporal para verificar datos en las tablas
  async debugSalesData(req, res) {
    try {
      if (!req.user || req.user.Rol !== 'Admin') {
        return res.status(403).json({ message: 'Solo admin' });
      }

      const pool = await (await import('../db.js')).getPool();
      
      // Verificar órdenes
      const [ordenes] = await pool.execute('SELECT COUNT(*) as total FROM Ordenes');
      
      // Verificar pagos
      const [pagos] = await pool.execute('SELECT COUNT(*) as total FROM Pagos');
      
      // Verificar órdenes con pagos
      const [ordenesConPago] = await pool.execute(`
        SELECT COUNT(*) as total 
        FROM Ordenes o 
        INNER JOIN Pagos p ON o.OrdenID = p.OrdenID
      `);

      // Verificar algunos datos de ejemplo
      const [ejemploOrdenes] = await pool.execute(`
        SELECT o.OrdenID, o.Estado, o.FechaOrden, p.Monto, p.MetodoPago
        FROM Ordenes o 
        LEFT JOIN Pagos p ON o.OrdenID = p.OrdenID
        LIMIT 5
      `);

      res.json({
        success: true,
        debug: {
          totalOrdenes: ordenes[0].total,
          totalPagos: pagos[0].total,
          ordenesConPago: ordenesConPago[0].total,
          ejemploOrdenes
        }
      });
    } catch (error) {
      console.error('Error en debug:', error);
      res.status(500).json({ error: error.message });
    }
  }
}; 