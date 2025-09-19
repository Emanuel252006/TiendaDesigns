import axios from './axios.js';

export const checkoutApi = {
  // Procesar checkout
  processCheckout: async (checkoutData) => {
    try {
      const response = await axios.post('/checkout/process', checkoutData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error al procesar el checkout' };
    }
  },

  // Obtener órdenes del usuario
  getUserOrders: async () => {
    try {
      const response = await axios.get('/checkout/orders');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error al obtener las órdenes' };
    }
  },

  // Obtener detalles de una orden específica
  getOrderDetails: async (orderId) => {
    try {
      const response = await axios.get(`/checkout/orders/${orderId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error al obtener los detalles de la orden' };
    }
  },

  // Procesar orden después del pago exitoso de MercadoPago
  processOrderAfterPayment: async (orderData) => {
    try {
      const response = await axios.post('/checkout/process-after-payment', orderData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error al procesar la orden después del pago' };
    }
  },

  // Obtener pedidos activos (solo para administradores)
  getActiveOrders: async () => {
    try {
      const response = await axios.get('/checkout/active-orders');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error al obtener pedidos activos' };
    }
  },

  // Marcar pedido como entregado (solo para administradores)
  markAsDelivered: async (orderId) => {
    try {
      const response = await axios.put(`/checkout/mark-delivered/${orderId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error al marcar pedido como entregado' };
    }
  },

  // (Eliminado) Limpiar pedidos entregados

  // Obtener estadísticas de ventas (solo para administradores)
  getSalesStats: async () => {
    try {
      const response = await axios.get('/checkout/sales-stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error al obtener estadísticas de ventas' };
    }
  },

  // Procesar pago exitoso
  processSuccessfulPayment: async (paymentData) => {
    try {
      const response = await axios.post('/payments/process-success', paymentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error al procesar el pago exitoso' };
    }
  },

  // Simular checkout completo con pago (para testing)
  simulateCheckoutAndPayment: async (checkoutData) => {
    try {
      const response = await axios.post('/checkout/simulate-payment', checkoutData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error en la simulación de checkout' };
    }
  }
}; 