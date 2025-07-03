import { productTallaModel } from '../models/productTallaModel.js';

// GET /api/productTalla?productoId=5
export const listProductTalla = async (req, res, next) => {
  try {
    const productoId = req.query.productoId;
    const rows = await productTallaModel.findAll(productoId);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// GET /api/productTalla/:productoId/:tallaId
export const getProductTalla = async (req, res, next) => {
  try {
    const { productoId, tallaId } = req.params;
    const row = await productTallaModel.findOne(productoId, tallaId);
    if (!row) return res.status(404).json({ message: 'No encontrado' });
    res.json(row);
  } catch (err) {
    next(err);
  }
};

// POST /api/productTalla
export const createProductTalla = async (req, res, next) => {
  try {
    const nueva = await productTallaModel.create(req.body);
    res.status(201).json(nueva);
  } catch (err) {
    next(err);
  }
};

// PUT /api/productTalla/:productoId/:tallaId
export const updateProductTalla = async (req, res, next) => {
  try {
    const { productoId, tallaId } = req.params;
    const { Stock } = req.body;
    const updated = await productTallaModel.update(
      parseInt(productoId, 10),
      parseInt(tallaId, 10),
      Stock
    );
    if (!updated) return res.status(404).json({ message: 'No encontrado' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/productTalla/:productoId/:tallaId
export const deleteProductTalla = async (req, res, next) => {
  try {
    const { productoId, tallaId } = req.params;
    const deleted = await productTallaModel.remove(
      parseInt(productoId, 10),
      parseInt(tallaId, 10)
    );
    if (!deleted) return res.status(404).json({ message: 'No encontrado' });
    res.json(deleted);
  } catch (err) {
    next(err);
  }
};