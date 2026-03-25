import express from 'express';
import { OrderController } from '../controllers/orderController.js';
import { requiredAuth } from '../middlewares/Token_validator.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(requiredAuth);

// Obtener pedidos activos del usuario
router.get('/user-orders', OrderController.getUserOrders);

// Obtener detalles de una orden específica
router.get('/:orderId', OrderController.getOrderDetails);

export default router;
