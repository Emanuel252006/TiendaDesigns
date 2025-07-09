import { OrderModel } from '../models/orderModel.js';
import { CartModel } from '../models/cartModel.js';
import { PDFService } from '../services/pdfService.js';

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
      const userId = req.user.id;
      const { nombre, email, telefono, direccion, ciudad, codigoPostal, pais, metodoPago, items } = req.body;

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

      // Preparar mensaje para WhatsApp
      const subtotal = orderData.reduce((sum, item) => sum + (item.Precio * item.Cantidad), 0);
      const shipping = 20000; // Envío fijo
      const whatsappMessage = encodeURIComponent(
        `🛒 *NUEVA ORDEN #${order.OrdenID}*\n\n` +
        `👤 *Cliente:* ${orderData[0].NombreUsuario}\n` +
        `📧 *Email:* ${orderData[0].Correo}\n` +
        `📍 *Dirección:* ${orderData[0].Direccion}, ${orderData[0].Ciudad}\n` +
        `📦 *Productos:*\n${orderData.map(item => `• ${item.NombreProducto} (${item.NombreTalla || 'N/A'}) - ${item.Cantidad} x $${item.Precio.toLocaleString()}`).join('\n')}\n\n` +
        `💰 *Subtotal:* $${subtotal.toLocaleString()}\n` +
        `🚚 *Envío:* $${shipping.toLocaleString()}\n` +
        `💳 *Total:* $${total.toLocaleString()}\n\n` +
        `¿Puedes procesar esta orden? 📋`
      );

      const whatsappUrl = `https://wa.me/573133702459?text=${whatsappMessage}`;

      res.status(200).json({
        message: "Checkout procesado exitosamente",
        orderId: order.OrdenID,
        pdfUrl: pdfResult.url,
        whatsappLink: whatsappUrl
      });
    } catch (error) {
      console.error("Error en processCheckout:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  // Obtener órdenes del usuario
  async getUserOrders(req, res) {
    try {
      const userId = req.user.id;
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
      const userId = req.user.id;

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
  }
}; 