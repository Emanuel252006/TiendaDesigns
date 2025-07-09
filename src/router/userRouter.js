import express from "express";
import {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    login,
    logao,
    verifyToken,
    profile,
    getUserForCheckout
} from "../controllers/userController.js";

import { requiredAuth } from "../middlewares/Token_validator.js";


import { registerSchema, loginSchema } from "../schemas/authSchemas.js";
import { validateSchema } from "../middlewares/validator.middleware.js";

const router = express.Router();


router.post("/userregister", validateSchema(registerSchema), createUser);


router.post('/login', validateSchema(loginSchema), login);


router.post('/logao', logao);


router.get('/verify', verifyToken);


router.get("/userall", requiredAuth, getUsers);

router.get("/user/:id", requiredAuth, getUserById);

router.put("/updateuser/:id", requiredAuth, updateUser);

router.delete("/deleteuser/:id", requiredAuth, deleteUser);

// Ruta para obtener el perfil del usuario autenticado
router.get('/profile', requiredAuth, profile);



router.get('/checkout-data', requiredAuth, getUserForCheckout);


export default router;