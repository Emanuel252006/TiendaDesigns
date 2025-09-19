import express from 'express';
import { TestController } from '../controllers/testController.js';
import { requiredAuth } from '../middlewares/Token_validator.js';

const router = express.Router();

// Probar flujo completo de pago (requiere autenticación)
router.post('/payment-flow', requiredAuth, TestController.testPaymentFlow);

// Probar flujo completo de pago SIN autenticación (para pruebas)
router.post('/payment-flow-test', TestController.testPaymentFlow);

// Verificar estado actual del sistema
router.get('/status', TestController.checkStatus);

export default router;
