import { PaymentModel } from '../models/paymentModel.js';
import { OrderModelMySQL } from '../models/orderModelMySQL.js';
import { StockModel } from '../models/stockModel.js';
import { CartModel } from '../models/cartModel.js';

export const PaymentController = {
  // Procesar pago exitoso completo
  async processSuccessfulPayment(req, res) {
    try {
      const { 
        paymentId, 
        preferenceId, 
        items, 
        userData,
        userId 
      } = req.body;

      console.log('🚀 Procesando pago exitoso:', { paymentId, preferenceId, userId });

      if (!paymentId || !items || !userData || !userId) {
        return res.status(400).json({
          error: 'Datos incompletos para procesar el pago',
          required: ['paymentId', 'items', 'userData', 'userId']
        });
      }

      // 1. Verificar stock disponible
      const stockIssues = await StockModel.checkStockAvailability(items);
      if (stockIssues.length > 0) {
        return res.status(400).json({
          error: 'Stock insuficiente',
          stockIssues
        });
      }

      // 2. Buscar la orden existente por external_reference
      // La orden ya debe existir con external_reference = order_{OrdenID}
      const externalRef = `order_${preferenceId}`; // Asumiendo que preferenceId contiene el OrdenID
      const orderId = preferenceId; // O extraer de preferenceId si es necesario
      
      const existingOrder = await OrderModelMySQL.getOrderById(orderId);
      if (!existingOrder || existingOrder.length === 0) {
        return res.status(404).json({
          error: 'Orden no encontrada. Debe existir antes del pago.'
        });
      }

      // 3. Calcular total
      const total = items.reduce((sum, item) => sum + (item.Precio * item.Cantidad), 0);

      // 4. Crear el pago
      const paymentRecord = await PaymentModel.createPayment({
        OrdenID: orderId,
        Monto: total,
        MetodoPago: 'PayU',
        PaymentId: paymentId,
        PreferenceId: preferenceId,
        Estado: 'Aprobado'
      });

      // 5. Actualizar estado de la orden a 'Pagado'
      await OrderModelMySQL.updateOrderStatus(orderId, 'Pagado');

      // 6. Limpiar carrito
      console.log('🧹 Limpiando carrito del usuario:', userId);
      await CartModel.clearCart(userId);
      console.log('✅ Carrito limpiado exitosamente');

      // 7. Obtener datos completos de la orden
      const orderData = await OrderModelMySQL.getOrderById(orderId);

      console.log('✅ Pago procesado exitosamente:', {
        orderId: orderId,
        paymentId: paymentRecord,
        total
      });

      res.json({
        success: true,
        orderId: orderId,
        paymentId: paymentRecord,
        total,
        orderData: orderData[0],
        message: 'Pago procesado exitosamente'
      });

    } catch (error) {
      console.error('❌ Error procesando pago exitoso:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        detalle: error.message
      });
    }
  },

  // Obtener historial de pagos de un usuario
  async getUserPayments(req, res) {
    try {
      const userId = req.user.UsuarioID;
      
      const orders = await OrderModelMySQL.getOrdersByUserId(userId);
      
      res.json({
        success: true,
        orders
      });
    } catch (error) {
      console.error('Error obteniendo pagos del usuario:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        detalle: error.message
      });
    }
  },

  // Obtener detalles de un pago específico
  async getPaymentDetails(req, res) {
    try {
      const { paymentId } = req.params;
      
      const payment = await PaymentModel.getPaymentByTransactionId(paymentId);
      
      if (!payment) {
        return res.status(404).json({
          error: 'Pago no encontrado'
        });
      }
      
      res.json({
        success: true,
        payment
      });
    } catch (error) {
      console.error('Error obteniendo detalles del pago:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        detalle: error.message
      });
    }
  }
};
