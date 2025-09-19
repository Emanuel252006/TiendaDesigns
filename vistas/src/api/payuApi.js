import axiosInstance from './axios.js';

const payuApi = {
  // Crear pago con PayU (API directa)
  createPayment: async (paymentData) => {
    try {
      const response = await axiosInstance.post('/payu/create-payment', paymentData);
      return response.data;
    } catch (error) {
      console.error('Error creando pago PayU:', error);
      throw error.response?.data || error.message;
    }
  },

  // Crear URL de redirección para PayU
  createRedirectPayment: async (paymentData) => {
    try {
      const response = await axiosInstance.post('/payu/create-redirect', paymentData);
      return response.data;
    } catch (error) {
      console.error('Error creando redirección PayU:', error);
      throw error.response?.data || error.message;
    }
  },

  // Verificar estado de transacción
  getTransactionStatus: async (referenceCode) => {
    try {
      const response = await axiosInstance.get(`/payu/status/${referenceCode}`);
      return response.data;
    } catch (error) {
      console.error('Error verificando estado PayU:', error);
      throw error.response?.data || error.message;
    }
  },

  // Simular pago para pruebas
  simulatePayment: async () => {
    try {
      const response = await axiosInstance.post('/payu/simulate');
      return response.data;
    } catch (error) {
      console.error('Error simulando pago PayU:', error);
      throw error.response?.data || error.message;
    }
  }
};

export default payuApi;

