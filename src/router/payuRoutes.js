import express from 'express';
import { PayUController } from '../controllers/payuController.js';
import { requiredAuth } from '../middlewares/Token_validator.js';

const router = express.Router();

// ========== RUTAS PROTEGIDAS (requieren autenticación) ==========

// Crear pago con PayU (API directa con tarjeta)
router.post('/create-payment', requiredAuth, PayUController.createPayment);

// Crear URL de redirección para PayU (formulario)
router.post('/create-redirect', requiredAuth, PayUController.createRedirectPayment);

// Verificar estado de transacción
router.get('/status/:referenceCode', requiredAuth, PayUController.getTransactionStatus);

// Simular pago para pruebas
router.post('/simulate', requiredAuth, PayUController.simulatePayment);

// ========== RUTAS PÚBLICAS (webhooks) ==========

// Webhook de notificación de PayU (POST público)
router.post('/notification', PayUController.handleNotification);

// Confirmación de pago (GET público para redirecciones)
router.get('/confirmation', PayUController.handleNotification);

export default router;

