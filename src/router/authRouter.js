import { Router } from 'express';
import { login, logout, verifyToken, profile, changePassword, updateProfile, startRegister, verifyRegisterCode, forgotPassword, resetPassword } from '../controllers/authControllers.js'; 
import { validateSchema } from '../middlewares/validator.middleware.js'; 
import { loginSchema, registerSchema, profileUpdateSchema, changePasswordSchema } from '../schemas/authSchemas.js';
import { requiredAuth } from '../middlewares/Token_validator.js'; 

const router = Router();

router.post('/login', validateSchema(loginSchema), login); 


router.post('/logout', logout); 


router.get('/profile', requiredAuth, profile);
router.put('/profile', requiredAuth, validateSchema(profileUpdateSchema), updateProfile);

router.put('/change-password', requiredAuth, validateSchema(changePasswordSchema), changePassword); 

router.get('/verify', verifyToken);
router.post('/start-register', startRegister);
router.post('/verify-register-code', verifyRegisterCode);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;