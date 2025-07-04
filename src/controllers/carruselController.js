// src/controllers/carruselController.js
import * as Model from "../models/carruselModel.js";

export async function list(req, res) {
  try {
    const items = await Model.getAllCarrusel();
    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).send("Error listando carrusel");
  }
}

export async function getById(req, res) {
  try {
    const item = await Model.getCarruselById(req.params.id);
    if (!item) return res.status(404).send("Banner no encontrado");
    res.json(item);
  } catch (e) {
    console.error(e);
    res.status(500).send("Error obteniendo banner");
  }
}

export async function create(req, res) {
  try {
    const { ImagenPath, Orden } = req.body;
    if (!ImagenPath || Orden == null) {
      return res.status(400).send("Faltan campos obligatorios");
    }
    const newItem = await Model.createCarrusel({ ImagenPath, Orden });
    res.status(201).json(newItem);
  } catch (e) {
    console.error(e);
    res.status(500).send("Error creando banner");
  }
}

export async function update(req, res) {
  try {
    const updated = await Model.updateCarrusel(req.params.id, req.body);
    if (!updated) return res.status(404).send("Banner no encontrado");
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).send("Error actualizando banner");
  }
}

export async function remove(req, res) {
  try {
    await Model.deleteCarrusel(req.params.id);
    res.sendStatus(204);
  } catch (e) {
    console.error(e);
    res.status(500).send("Error eliminando banner");
  }
}