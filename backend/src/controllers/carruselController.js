// src/controllers/carruselController.js
import * as Model from "../models/carruselModel.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    let imagenPath = null;
    
    // Manejar subida de imagen si existe
    if (req.files && req.files.imagen) {
      const file = req.files.imagen;
      console.log('Archivo recibido:', file.name, 'Tamaño:', file.size);
      
      const fileName = `${Date.now()}_${file.name}`;
      const uploadPath = path.join(__dirname, '../../images/carrusel', fileName);
      
      // Crear directorio si no existe
      const carruselDir = path.join(__dirname, '../../images/carrusel');
      console.log('Directorio carrusel:', carruselDir);
      
      if (!fs.existsSync(carruselDir)) {
        console.log('Creando directorio carrusel...');
        fs.mkdirSync(carruselDir, { recursive: true });
      }
      
      console.log('Guardando archivo en:', uploadPath);
      await file.mv(uploadPath);
      imagenPath = `carrusel/${fileName}`;
      console.log('Archivo guardado como:', imagenPath);
    } else {
      console.log('No se recibió archivo de imagen');
      return res.status(400).json({ error: "No se recibió archivo de imagen" });
    }

    const { orden } = req.body;
    console.log('Orden recibido:', orden);
    
    if (!imagenPath || orden == null) {
      return res.status(400).json({ error: "Faltan campos obligatorios: imagen y orden" });
    }
    
    console.log('Creando carrusel con:', { ImagenPath: imagenPath, Orden: parseInt(orden) });
    const newItem = await Model.createCarrusel({ ImagenPath: imagenPath, Orden: parseInt(orden) });
    console.log('Carrusel creado:', newItem);
    
    res.status(201).json(newItem);
  } catch (e) {
    console.error('Error detallado en create carrusel:', e);
    res.status(500).json({ error: "Error creando banner", details: e.message });
  }
}

export async function update(req, res) {
  try {
    let imagenPath = null;
    
    // Manejar subida de imagen si existe
    if (req.files && req.files.imagen) {
      const file = req.files.imagen;
      const fileName = `${Date.now()}_${file.name}`;
      const uploadPath = path.join(__dirname, '../../images/carrusel', fileName);
      
      // Crear directorio si no existe
      const carruselDir = path.join(__dirname, '../../images/carrusel');
      if (!fs.existsSync(carruselDir)) {
        fs.mkdirSync(carruselDir, { recursive: true });
      }
      
      await file.mv(uploadPath);
      imagenPath = `carrusel/${fileName}`;
    }

    const updateData = {};
    if (imagenPath) updateData.ImagenPath = imagenPath;
    if (req.body.orden != null) updateData.Orden = parseInt(req.body.orden);

    const updated = await Model.updateCarrusel(req.params.id, updateData);
    if (!updated) return res.status(404).send("Banner no encontrado");
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).send("Error actualizando banner");
  }
}

export async function remove(req, res) {
  try {
    // Obtener información del banner antes de eliminarlo
    const banner = await Model.getCarruselById(req.params.id);
    if (banner) {
      // Eliminar archivo físico si existe
      const filePath = path.join(__dirname, '../../images', banner.ImagenPath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await Model.deleteCarrusel(req.params.id);
    res.sendStatus(204);
  } catch (e) {
    console.error(e);
    res.status(500).send("Error eliminando banner");
  }
}