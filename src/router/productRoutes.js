import express from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';
import { validateSchema } from '../middlewares/validator.middleware.js';
import {
  createProductSchema,
  updateProductSchema
} from '../schemas/productSchemas.js';

const router = express.Router();

router.post(  '/',            validateSchema(createProductSchema), createProduct);
router.get(   '/',            getProducts);
router.get(   '/:id',         getProductById);
router.put(   '/:id',         validateSchema(updateProductSchema), updateProduct);
router.delete('/:id',         deleteProduct);

export default router;