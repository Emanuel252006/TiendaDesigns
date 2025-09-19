import express from "express";
import {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    login,
    verifyToken,
    profile,
    getUserForCheckout,
    getUserStatistics,
    getActiveCartUsers,
    getCountryDistribution,
    cleanDuplicateAddresses,
    globalHeartbeat
} from "../controllers/userController.js";

import { requiredAuth } from "../middlewares/Token_validator.js";


import { registerSchema, loginSchema } from "../schemas/authSchemas.js";
import { validateSchema } from "../middlewares/validator.middleware.js";

const router = express.Router();


router.post("/userregister", validateSchema(registerSchema), createUser);


router.post('/login', validateSchema(loginSchema), login);





router.get('/verify', verifyToken);


router.get("/userall", requiredAuth, getUsers);

router.get("/user/:id", requiredAuth, getUserById);

router.put("/updateuser/:id", requiredAuth, updateUser);

router.delete("/deleteuser/:id", requiredAuth, deleteUser);

// Ruta para obtener el perfil del usuario autenticado
router.get('/profile', requiredAuth, profile);



router.get('/checkout-data', requiredAuth, getUserForCheckout);

// Rutas para estadísticas de usuarios
router.get('/statistics', requiredAuth, getUserStatistics);
router.get('/active-carts', requiredAuth, getActiveCartUsers);
router.get('/country-distribution', requiredAuth, getCountryDistribution);

// Ruta temporal para limpiar direcciones duplicadas (solo admin)
router.post('/clean-duplicates', requiredAuth, cleanDuplicateAddresses);

// Ruta para heartbeat global (marcar todos los usuarios logueados como activos)
router.post('/heartbeat', requiredAuth, globalHeartbeat);

export default router;