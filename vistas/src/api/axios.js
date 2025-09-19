import axios from 'axios';

// Configuración simplificada para desarrollo local
const instance = axios.create({
    baseURL: 'http://localhost:3001/api',
    withCredentials: true
})

export default instance