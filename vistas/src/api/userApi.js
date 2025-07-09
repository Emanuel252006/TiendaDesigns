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
export const verifyTokenRequest = () => axios.get(`/verify`);

/**
 * Realiza una solicitud POST para cerrar la sesión del usuario en el backend.
 * Normalmente, esta acción solo requiere invalidar el token/sesión en el servidor y no necesita un cuerpo de solicitud.
 * @returns {Promise<AxiosResponse>} La respuesta de la API.
 */
export const logao = () => axios.post(`/users/logao`); // ¡Ajuste aquí: eliminamos 'user' si no es necesario para el logout del backend!

/**
 * Realiza una solicitud GET para obtener los datos del usuario formateados para checkout.
 * @returns {Promise<AxiosResponse>} La respuesta de la API con los datos formateados para checkout.
 */
export const getCheckoutDataRequest = () => axios.get(`/checkout-data`);

export const startRegisterRequest = (userData) => axios.post('/start-register', userData);
export const verifyRegisterCodeRequest = (data) => axios.post('/verify-register-code', data);

/**
 * Realiza una solicitud GET para obtener el perfil del usuario.
 * @returns {Promise<AxiosResponse>} La respuesta de la API con los datos del perfil.
 */
export const getProfileRequest = () => axios.get(`/profile`);

/**
 * Realiza una solicitud PUT para actualizar el perfil del usuario.
 * @param {object} userData - Objeto con los datos a actualizar.
 * @returns {Promise<AxiosResponse>} La respuesta de la API.
 */
export const updateProfileRequest = (userData) => axios.put(`/profile`, userData);

/**
 * Realiza una solicitud PUT para cambiar la contraseña del usuario.
 * @param {object} passwordData - Objeto con la contraseña actual y nueva.
 * @returns {Promise<AxiosResponse>} La respuesta de la API.
 */
export const changePasswordRequest = (passwordData) => axios.put(`/change-password`, passwordData);