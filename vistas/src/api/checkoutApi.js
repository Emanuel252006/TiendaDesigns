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
  }
}; 