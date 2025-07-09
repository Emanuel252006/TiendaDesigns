import express from 'express';
import { CheckoutController } from '../controllers/checkoutController.js';
import { requiredAuth } from '../middlewares/Token_validator.js';

const router = express.Router();

// Todas las rutas del checkout requieren autenticación
router.use(requiredAuth);

// Endpoint de prueba
router.get('/test', CheckoutController.testCheckout);

// Procesar checkout
router.post('/process', CheckoutController.processCheckout);

// Obtener órdenes del usuario
router.get('/orders', CheckoutController.getUserOrders);

// Obtener detalles de una orden específica
router.get('/orders/:orderId', CheckoutController.getOrderDetails);

export default router; 