import express from 'express';
import { PaymentController } from '../controllers/paymentController.js';
import { requiredAuth } from '../middlewares/Token_validator.js';

const router = express.Router();

// Procesar pago exitoso (requiere autenticación)
router.post('/process-success', requiredAuth, PaymentController.processSuccessfulPayment);

// Obtener historial de pagos del usuario (requiere autenticación)
router.get('/history', requiredAuth, PaymentController.getUserPayments);

// Obtener detalles de un pago específico (requiere autenticación)
router.get('/details/:paymentId', requiredAuth, PaymentController.getPaymentDetails);

export default router;

