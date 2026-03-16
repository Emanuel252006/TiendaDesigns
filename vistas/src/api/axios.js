import axios from 'axios';
import { API_PREFIX } from '../config/runtime.js';

const instance = axios.create({
    baseURL: API_PREFIX,
    withCredentials: true
})

export default instance