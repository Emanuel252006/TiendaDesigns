import express from 'express';
import { CartController } from '../controllers/cartController.js';
import { requiredAuth } from '../middlewares/Token_validator.js';

const router = express.Router();

// Ruta pública para verificar stock (no requiere autenticación)
router.get('/stock/:ProductoID/:TallaID', CartController.checkStock);

// Todas las demás rutas del carrito requieren autenticación
router.use(requiredAuth);

// Obtener carrito del usuario
router.get('/', CartController.getCart);

// Agregar producto al carrito
router.post('/add', CartController.addToCart);

// Actualizar cantidad de un ítem
router.put('/item/:cartItemId', CartController.updateCartItem);

// Eliminar ítem del carrito
router.delete('/item/:cartItemId', CartController.removeFromCart);

// Vaciar carrito completo
router.delete('/clear', CartController.clearCart);

export default router; 