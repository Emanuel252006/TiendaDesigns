import axios from './axios'; 
import Swal from 'sweetalert2';


const alertSuccess = (message) => {
  console.log('Mostrando alerta de éxito:', message);
  
  Swal.fire({
    icon: 'success',
    title: 'Éxito',
    text: message,
  });
};


const alertError = (message) => {
  console.log('Mostrando alerta de error:', message);

  Swal.fire({
    icon: 'error',
    title: 'Error',
    text: message,
  });
};


const fetchData = async (endpoint) => {
  try {
    const response = await axios.get(endpoint);  

  
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      throw new Error(`Error HTTP: ${response.status}`);
    }
  } catch (error) {
    console.error(`Error al cargar los datos desde ${endpoint}:`, error);
    throw error;
  }
};




export const createPersona = async (personaData) => {
  try {
    const response = await axios.post('/roles-handler?action=createPersona', personaData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });


    if (response.status >= 200 && response.status < 300) {
      alertSuccess(response.data.message);
      return response.data;
    } else {
      throw new Error('Hubo un error al procesar la solicitud');
    }
  } catch (error) {
    
    if (error.response && error.response.data) {
      alertError(error.response.data.message || 'Hubo un error al procesar los datos');
    } else {
      alertError('Hubo un error al procesar los datos.');
    }
    throw error;
  }
};

export const loginRequest = async (user) => {
  try {
    const res = await axios.post("/auth/login", user);
    return res;
  } catch (error) {
    throw error;
  }
};

export const registerRequest = async (user) => {
  try {
    const res = await axios.post("/users/userregister", user);
    return res;
  } catch (error) {
    throw error;
  }
};

export const forgotPasswordRequest = async (correo) => {
  try {
    const res = await axios.post("/auth/forgot-password", { correo });
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error solicitando código de recuperación.' };
  }
};

export const resetPasswordRequest = async ({ correo, codigo, nuevaContrasena }) => {
  try {
    const res = await axios.post("/auth/reset-password", { correo, codigo, nuevaContrasena });
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error restableciendo la contraseña.' };
  }
};



