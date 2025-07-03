import { TallaModel } from '../models/tallaModel.js';

// GET /api/tallas
export const listTallas = async (_req, res, next) => {
  try {
    const tallas = await TallaModel.findAll();
    res.json(tallas);
  } catch (err) {
    next(err);
  }
};

// GET /api/tallas/:id
export const getTallaById = async (req, res, next) => {
  try {
    const talla = await TallaModel.findById(req.params.id);
    if (!talla) return res.status(404).json({ message: 'Talla no encontrada' });
    res.json(talla);
  } catch (err) {
    next(err);
  }
};

// POST /api/tallas
export const createTalla = async (req, res, next) => {
  try {
    const { NombreTalla } = req.body;
    const nueva = await TallaModel.create({ NombreTalla });
    res.status(201).json(nueva);
  } catch (err) {
    next(err);
  }
};

// PUT /api/tallas/:id
export const updateTalla = async (req, res, next) => {
  try {
    const { NombreTalla } = req.body;
    const updated = await TallaModel.update(req.params.id, { NombreTalla });
    if (!updated) return res.status(404).json({ message: 'Talla no encontrada' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tallas/:id
export const deleteTalla = async (req, res, next) => {
  try {
    const deleted = await TallaModel.remove(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Talla no encontrada' });
    res.json({ message: 'Talla eliminada', deleted });
  } catch (err) {
    next(err);
  }
};