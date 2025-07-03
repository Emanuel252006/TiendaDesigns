import axios from './axios';
import Swal  from 'sweetalert2';

const alertSuccess = msg => Swal.fire({ icon: 'success', title: 'Éxito', text: msg });
const alertError   = msg => Swal.fire({ icon: 'error',   title: 'Error',  text: msg });

// 🔄 Listar todas las tallas
export const getTallasRequest = async () => {
  try {
    const { data } = await axios.get('/tallas');
    return data;
  } catch (err) {
    alertError('No se pudieron cargar las tallas');
    throw err;
  }
};

// 🔄 Obtener una talla por ID
export const getTallaByIdRequest = async id => {
  try {
    const { data } = await axios.get(`/tallas/${id}`);
    return data;
  } catch (err) {
    alertError('No se pudo cargar la talla');
    throw err;
  }
};

// ➕ Crear nueva talla
export const createTallaRequest = async payload => {
  try {
    const { data } = await axios.post('/tallas', payload);
    alertSuccess('Talla creada correctamente');
    return data;
  } catch (err) {
    alertError('Error al crear la talla');
    throw err;
  }
};

// 📝 Actualizar nombre de talla
export const updateTallaRequest = async (id, payload) => {
  try {
    const { data } = await axios.put(`/tallas/${id}`, payload);
    alertSuccess('Talla actualizada correctamente');
    return data;
  } catch (err) {
    alertError('Error al actualizar la talla');
    throw err;
  }
};

// ❌ Eliminar talla
export const deleteTallaRequest = async id => {
  try {
    const { data } = await axios.delete(`/tallas/${id}`);
    alertSuccess('Talla eliminada correctamente');
    return data;
  } catch (err) {
    alertError('Error al eliminar la talla');
    throw err;
  }
};