import axios from './axios'; // Asegúrate de que esta ruta a tu instancia de axios configurada sea correcta

/**
 * Realiza una solicitud POST para registrar un nuevo usuario.
 * @param {object} user - Objeto que contiene los datos del usuario Y la dirección (NombreUsuario, Contrasena, Correo, Rol, Direccion, Ciudad, Pais, CodigoPostal).
 * @returns {Promise<AxiosResponse>} La respuesta de la API.
 */
export const registerRequest = user => axios.post(`/userregister`, user);

/**
 * Realiza una solicitud POST para iniciar sesión.
 * @param {object} user - Objeto que contiene las credenciales del usuario (Correo, Contrasena).
 * @returns {Promise<AxiosResponse>} La respuesta de la API con los datos del usuario y la cookie del token.
 */
export const loginRequest = user => axios.post(`/login`, user);

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
export const logao = () => axios.post(`/logao`); // ¡Ajuste aquí: eliminamos 'user' si no es necesario para el logout del backend!