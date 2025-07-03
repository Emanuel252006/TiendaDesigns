import { Router } from 'express';
import {
  listProductTalla,
  getProductTalla,
  createProductTalla,
  updateProductTalla,
  deleteProductTalla
} from '../controllers/productTallaController.js';

const router = Router();

// listar (opcional: ?productoId=)
router.get('/', listProductTalla);

// obtener stock de una única combinación
router.get('/:productoId/:tallaId', getProductTalla);

// crear nueva relación producto–talla
router.post('/', createProductTalla);

// actualizar stock
router.put('/:productoId/:tallaId', updateProductTalla);

// eliminar relación
router.delete('/:productoId/:tallaId', deleteProductTalla);

export default router;