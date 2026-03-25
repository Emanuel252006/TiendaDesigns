import api from './axios.js';

export const getUserOrders = async () => {
  try {
    const response = await api.get('/orders/user-orders');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo pedidos del usuario:', error);
    throw error;
  }
};

export const getOrderDetails = async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo detalles de orden:', error);
    throw error;
  }
};
