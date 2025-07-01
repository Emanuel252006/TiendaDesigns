
import { Router } from 'express';
import { login, logout, verifyToken, profile } from '../controllers/authControllers.js'; 
import { validateSchema } from '../middlewares/validator.middleware.js'; 
import { loginSchema, registerSchema } from '../schemas/authSchemas.js';
import { requiredAuth } from '../middlewares/Token_validator.js'; 

const router = Router();

router.post('/login', validateSchema(loginSchema), login); 


router.post('/logout', logout); 


router.get('/verify', verifyToken);


router.get('/profile', requiredAuth, profile); 

export default router;