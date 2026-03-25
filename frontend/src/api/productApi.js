import axios from './axios';
import Swal from 'sweetalert2';

const alertSuccess = (message) => {
  Swal.fire({ icon: 'success', title: 'Éxito', text: message });
};

const alertError = (message) => {
  Swal.fire({ icon: 'error', title: 'Error', text: message });
};

// 🔄 Obtener productos
export const getProductsRequest = async () => {
  try {
    const response = await axios.get('/products');
    return response.data;
  } catch (error) {
    alertError('No se pudieron cargar los productos');
    throw error;
  }
};

export const getProductByIdRequest = async (id) => {
  try {
    const response = await axios.get(`/products/${id}`);
    return response.data;
  } catch (error) {
    alertError('No se pudo cargar el producto');
    throw error;
  }
};


// ➕ Crear producto con imagen
export const createProductRequest = async (formData) => {
  try {
    const response = await axios.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    alertSuccess('Producto creado correctamente');
    return response.data;
  } catch (error) {
    alertError('Error al crear el producto');
    throw error;
  }
};

// 📝 Actualizar producto
export const updateProductRequest = async (id, formData) => {
  try {
    const response = await axios.put(`/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    alertSuccess('Producto actualizado correctamente');
    return response.data;
  } catch (error) {
    alertError('Error al actualizar el producto');
    throw error;
  }
};

// ❌ Eliminar producto
export const deleteProductRequest = async (id) => {
  try {
    const response = await axios.delete(`/products/${id}`);
    alertSuccess('Producto eliminado');
    return response.data;
  } catch (error) {
    alertError('Error al eliminar el producto');
    throw error;
  }
};

// 📊 Dashboard APIs
export const getStockPorTallasRequest = async () => {
  try {
    const response = await axios.get('/products/dashboard/stock-tallas', {
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      params: { _t: Date.now() }
    });
    return response;
  } catch (error) {
    console.error('Error obteniendo stock por tallas:', error);
    throw error;
  }
};

export const getProductosVendidosRequest = async () => {
  try {
    const response = await axios.get('/products/dashboard/ventas', {
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      params: { _t: Date.now() }
    });
    return response;
  } catch (error) {
    console.error('Error obteniendo productos vendidos:', error);
    throw error;
  }
};

export const getEstadisticasProductosRequest = async () => {
  try {
    const response = await axios.get('/products/dashboard/estadisticas', {
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      params: { _t: Date.now() }
    });
    return response;
  } catch (error) {
    console.error('Error obteniendo estadísticas de productos:', error);
    throw error;
  }
};