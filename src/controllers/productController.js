import { ProductModel } from '../models/productModel.js';

// POST /api/products
export const createProduct = async (req, res, next) => {
  try {
    const nuevo = await ProductModel.create(req.body);

    if (!nuevo) {
      return res.status(500).json({ error: 'Error al crear producto' });
    }

    res.status(201).json(nuevo);
  } catch (err) {
    console.error('Error en createProduct:', err);
    next(err);
  }
};

// GET /api/products
export const getProducts = async (_req, res, next) => {
  try {
    const lista = await ProductModel.findAll();
    res.json(lista);
  } catch (err) {
    console.error('Error en getProducts:', err);
    next(err);
  }
};

// GET /api/products/:id
export const getProductById = async (req, res, next) => {
  try {
    const producto = await ProductModel.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json(producto);
  } catch (err) {
    console.error('Error en getProductById:', err);
    next(err);
  }
};

// PUT /api/products/:id
export const updateProduct = async (req, res, next) => {
  try {
    const actualizado = await ProductModel.update(
      req.params.id,
      req.body
    );

    if (!actualizado) {
      return res.status(404).json({ message: 'Producto no encontrado o sin campos válidos' });
    }

    res.json(actualizado);
  } catch (err) {
    console.error('Error en updateProduct:', err);
    next(err);
  }
};

// DELETE /api/products/:id
export const deleteProduct = async (req, res, next) => {
  try {
    const eliminado = await ProductModel.remove(req.params.id);

    if (!eliminado) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json({
      message: 'Producto eliminado',
      deleted: eliminado
    });
  } catch (err) {
    console.error('Error en deleteProduct:', err);
    next(err);
  }
};