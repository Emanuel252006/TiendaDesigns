import axios from './axios'; // Asegúrate de que esta ruta a tu instancia de axios configurada sea correcta

/**
 * Realiza una solicitud POST para registrar un nuevo usuario.
 * @param {object} user - Objeto que contiene los datos del usuario Y la dirección (NombreUsuario, Contrasena, Correo, Rol, Direccion, Ciudad, Pais, CodigoPostal).
 * @returns {Promise<AxiosResponse>} La respuesta de la API.
 */
export const registerRequest = user => axios.post(`/users/userregister`, user);

/**
 * Realiza una solicitud POST para iniciar sesión.
 * @param {object} user - Objeto que contiene las credenciales del usuario (Correo, Contrasena).
 * @returns {Promise<AxiosResponse>} La respuesta de la API con los datos del usuario y la cookie del token.
 */
export const loginRequest = user => axios.post(`/users/login`, user);

/**
 * Realiza una solicitud GET para verificar la validez del token de autenticación.
 * Esta solicitud se basa en la cookie 'token' que el navegador envía automáticamente.
 * @returns {Promise<AxiosResponse>} La respuesta de la API, incluyendo el perfil completo del usuario si el token es válido.
 */
export const verifyTokenRequest = () => axios.get(`/auth/verify`);

/**
 * Realiza una solicitud POST para cerrar la sesión del usuario en el backend.
 * Normalmente, esta acción solo requiere invalidar el token/sesión en el servidor y no necesita un cuerpo de solicitud.
 * @returns {Promise<AxiosResponse>} La respuesta de la API.
 */


/**
 * Realiza una solicitud GET para obtener los datos del usuario formateados para checkout.
 * @returns {Promise<AxiosResponse>} La respuesta de la API con los datos formateados para checkout.
 */
export const getCheckoutDataRequest = () => axios.get(`/users/checkout-data`);

export const startRegisterRequest = (userData) => axios.post('/auth/start-register', userData);
export const verifyRegisterCodeRequest = (data) => axios.post('/auth/verify-register-code', data);
export const forgotPasswordRequest = (email) => axios.post('/auth/forgot-password', { correo: email });
export const resetPasswordRequest = (data) => axios.post('/auth/reset-password', data);

/**
 * Realiza una solicitud GET para obtener el perfil del usuario.
 * @returns {Promise<AxiosResponse>} La respuesta de la API con los datos del perfil.
 */
export const getProfileRequest = () => axios.get(`/auth/profile`);

/**
 * Realiza una solicitud PUT para actualizar el perfil del usuario.
 * @param {object} userData - Objeto con los datos a actualizar.
 * @returns {Promise<AxiosResponse>} La respuesta de la API.
 */
export const updateProfileRequest = async (userData) => {
  try {
    const response = await axios.put(`/auth/profile`, userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Realiza una solicitud PUT para cambiar la contraseña del usuario.
 * @param {object} passwordData - Objeto con la contraseña actual y nueva.
 * @returns {Promise<AxiosResponse>} La respuesta de la API.
 */
export const changePasswordRequest = (passwordData) => axios.put(`/auth/change-password`, passwordData);

// Funciones para estadísticas de usuarios
export const getUserStatisticsRequest = async () => {
  try {
    // Forzar actualización sin caché
    const response = await axios.get('/users/statistics', {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      params: {
        _t: Date.now() // Timestamp para evitar caché
      }
    });
    return response; // ✅ CORREGIDO: Retornar la respuesta completa
  } catch (error) {
    throw error;
  }
};

export const getActiveCartUsersRequest = async () => {
  try {
    // Forzar actualización sin caché
    const response = await axios.get('/users/active-carts', {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      params: {
        _t: Date.now() // Timestamp para evitar caché
      }
    });
    return response; // ✅ CORREGIDO: Retornar la respuesta completa
  } catch (error) {
    throw error;
    }
};

export const getCountryDistributionRequest = async () => {
  try {
    const response = await axios.get('/users/country-distribution');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Función para heartbeat global
export const globalHeartbeatRequest = async () => {
  try {
    const response = await axios.post('/users/heartbeat');
    return response.data;
  } catch (error) {
    throw error;
  }
};