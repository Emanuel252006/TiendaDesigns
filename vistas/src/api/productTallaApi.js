import axios from './axios';
import Swal  from 'sweetalert2';

const alertSuccess = msg => Swal.fire({ icon: 'success', title: 'Éxito', text: msg });
const alertError   = msg => Swal.fire({ icon: 'error',   title: 'Error',  text: msg });

// 🔄 Listar stock por producto (opcional ?productoId=)
export const getProductTallasRequest = async productoId => {
  try {
    const { data } = await axios.get('/productTalla', { params: { productoId } });
    return data;
  } catch (err) {
    alertError('No se pudo cargar el stock de tallas');
    throw err;
  }
};

// 🔄 Obtener una combinación producto–talla
export const getProductTallaRequest = async (productoId, tallaId) => {
  try {
    const { data } = await axios.get(`/productTalla/${productoId}/${tallaId}`);
    return data;
  } catch (err) {
    alertError('No se pudo cargar la relación producto–talla');
    throw err;
  }
};

// ➕ Crear nueva relación con stock
export const createProductTallaRequest = async payload => {
  try {
    const { data } = await axios.post('/productTalla', payload);
    alertSuccess('Stock por talla creado correctamente');
    return data;
  } catch (err) {
    alertError('Error al crear stock por talla');
    throw err;
  }
};

// 📝 Actualizar stock de una combinación
export const updateProductTallaRequest = async (productoId, tallaId, payload) => {
  try {
    const { data } = await axios.put(`/productTalla/${productoId}/${tallaId}`, payload);
    alertSuccess('Stock por talla actualizado correctamente');
    return data;
  } catch (err) {
    alertError('Error al actualizar stock por talla');
    throw err;
  }
};

// ❌ Eliminar relación producto–talla
export const deleteProductTallaRequest = async (productoId, tallaId) => {
  try {
    const { data } = await axios.delete(`/productTalla/${productoId}/${tallaId}`);
    alertSuccess('Stock por talla eliminado correctamente');
    return data;
  } catch (err) {
    alertError('Error al eliminar stock por talla');
    throw err;
  }
};