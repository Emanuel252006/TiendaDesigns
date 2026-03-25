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

// Procesar orden después del pago exitoso de MercadoPago
router.post('/process-after-payment', CheckoutController.processOrderAfterPayment);

// Obtener pedidos activos (solo para administradores)
router.get('/active-orders', CheckoutController.getActiveOrders);

// Marcar pedido como entregado (solo para administradores)
router.put('/mark-delivered/:orderId', CheckoutController.markAsDelivered);


// Obtener estadísticas de ventas (solo para administradores)
router.get('/sales-stats', CheckoutController.getSalesStats);
router.get('/debug-sales', CheckoutController.debugSalesData);

// Simular checkout completo con pago (para testing)
router.post('/simulate-payment', CheckoutController.simulateCheckoutAndPayment);

export default router; 