import express from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateAllProductStock,
  addStockColumn,
  checkProductsWithoutTallas,
  deleteLastProduct,
  checkDatabaseStatus,
  getProductosDestacados,
  updateProductosDestacados,
  getStockPorTallas,
  getProductosVendidos,
  getEstadisticasProductos
} from '../controllers/productController.js';
import { validateSchema } from '../middlewares/validator.middleware.js';
import {
  createProductSchema,
  updateProductSchema
} from '../schemas/productSchemas.js';

const router = express.Router();

// Rutas para productos destacados (DEBEN IR ANTES de /:id)
router.get('/destacados', getProductosDestacados);
router.put('/destacados', updateProductosDestacados);

// Rutas para dashboard de productos (DEBEN IR ANTES de /:id)
router.get('/dashboard/stock-tallas', getStockPorTallas);
router.get('/dashboard/ventas', getProductosVendidos);
router.get('/dashboard/estadisticas', getEstadisticasProductos);

router.post(  '/',            createProduct);
router.get(   '/',            getProducts);
router.get(   '/:id',         getProductById);
router.put(   '/:id',         updateProduct);
router.delete('/:id',         deleteProduct);
router.post(  '/update-stock', updateAllProductStock);
router.post(  '/add-stock-column', addStockColumn);
router.get(   '/check-tallas', checkProductsWithoutTallas);
router.delete('/delete-last', deleteLastProduct);
router.get(   '/status',      checkDatabaseStatus);

export default router;