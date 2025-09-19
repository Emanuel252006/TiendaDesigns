import { ProductModel } from "../models/productModel.js";
import path from "path";
import sql from "mssql";
import { getPool } from "../db.js";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// POST /api/products
export const createProduct = async (req, res, next) => {
  try {
    let imagenPath = null;
    
    // Manejar subida de imagen si existe
    if (req.files && req.files.Imagen) {
      const file = req.files.Imagen;
      const fileName = `${Date.now()}_${file.name}`;
      const uploadPath = path.join(__dirname, '../../images/productos', fileName);
      
      // Crear directorio si no existe
      const fs = await import('fs');
      const productosDir = path.join(__dirname, '../../images/productos');
      if (!fs.existsSync(productosDir)) {
        fs.mkdirSync(productosDir, { recursive: true });
      }
      
      await file.mv(uploadPath);
      imagenPath = `productos/${fileName}`;
    }

    // Validar que los campos requeridos estén presentes
    if (!req.body.NombreProducto || !req.body.Precio) {
      return res.status(400).json({ 
        error: 'NombreProducto y Precio son campos requeridos' 
      });
    }

    const nuevo = await ProductModel.create({
      NombreProducto: req.body.NombreProducto,
      Descripcion: req.body.Descripcion || '',
      Precio: parseFloat(req.body.Precio),
      Imagen: imagenPath
    });

    if (!nuevo) {
      return res.status(500).json({ error: 'Error al crear producto' });
    }

    res.status(201).json(nuevo);
  } catch (err) {
    console.error('Error en createProduct:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
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
    let imagenPath = null;
    
    // Manejar subida de imagen si existe
    if (req.files && req.files.Imagen) {
      const file = req.files.Imagen;
      const fileName = `${Date.now()}_${file.name}`;
      const uploadPath = path.join(__dirname, '../../images/productos', fileName);
      
      // Crear directorio si no existe
      const fs = await import('fs');
      const productosDir = path.join(__dirname, '../../images/productos');
      if (!fs.existsSync(productosDir)) {
        fs.mkdirSync(productosDir, { recursive: true });
      }
      
      await file.mv(uploadPath);
      imagenPath = `productos/${fileName}`;
    }

    // Preparar datos para actualizar
    const updateData = {
      NombreProducto: req.body.NombreProducto,
      Descripcion: req.body.Descripcion,
      Precio: parseFloat(req.body.Precio)
    };

    // Agregar imagen solo si se subió una nueva
    if (imagenPath) {
      updateData.Imagen = imagenPath;
    }

    const actualizado = await ProductModel.update(
      req.params.id,
      updateData
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
    // Primero obtener el producto para saber si tiene imagen
    const producto = await ProductModel.findById(req.params.id);
    
    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Eliminar el producto (esto también elimina las relaciones ProductoTallas)
    const eliminado = await ProductModel.remove(req.params.id);

    // Si tenía imagen, eliminar el archivo
    if (producto.Imagen) {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const imagePath = path.join(__dirname, '../../images', producto.Imagen);
        
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (fileError) {
        console.error('Error eliminando imagen:', fileError);
        // No fallar si no se puede eliminar la imagen
      }
    }

    res.json({
      message: 'Producto eliminado exitosamente',
      deleted: eliminado
    });
  } catch (err) {
    console.error('Error en deleteProduct:', err);
    res.status(500).json({ 
      error: 'Error eliminando producto',
      details: err.message 
    });
  }
};

// Actualizar stock de todos los productos
export const updateAllProductStock = async (req, res, next) => {
  try {
    const { getPool } = await import('../db.js');
    const pool = await getPool();
    
    // Actualizar stock
    await pool.execute(`
      UPDATE Productos
      SET Stock = (
        SELECT COALESCE(SUM(Stock), 0)
        FROM ProductoTallas
        WHERE ProductoTallas.ProductoID = Productos.ProductoID
      )
    `);
    
    // Obtener productos actualizados
    const [rows] = await pool.execute(`
      SELECT ProductoID, NombreProducto, Stock
      FROM Productos
      ORDER BY ProductoID
    `);
    
    res.json({
      message: 'Stock actualizado para todos los productos',
      productos: rows
    });
  } catch (err) {
    console.error('Error actualizando stock:', err);
    next(err);
  }
};

// Agregar columna Stock de emergencia
export const addStockColumn = async (req, res, next) => {
  try {
    const { getPool } = await import('../db.js');
    const pool = await getPool();
    
    // Verificar si la columna existe
    const [checkRows] = await pool.execute(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Productos' AND COLUMN_NAME = 'Stock'
    `);
    
    if (checkRows[0].count === 0) {
      // Agregar la columna
      await pool.execute(`
        ALTER TABLE Productos ADD Stock INT DEFAULT 0
      `);
      
      res.json({
        message: 'Columna Stock agregada exitosamente',
        success: true
      });
    } else {
      res.json({
        message: 'La columna Stock ya existe',
        success: true
      });
    }
  } catch (err) {
    console.error('Error agregando columna Stock:', err);
    res.status(500).json({
      error: 'Error agregando columna Stock',
      details: err.message
    });
  }
};

// Verificar productos sin tallas
export const checkProductsWithoutTallas = async (req, res, next) => {
  try {
    const { getPool } = await import('../db.js');
    const pool = await getPool();
    
    const [rows] = await pool.execute(`
      SELECT 
        p.ProductoID,
        p.NombreProducto,
        p.Stock,
        COUNT(pt.TallaID) as TallasCount
      FROM Productos p
      LEFT JOIN ProductoTallas pt ON p.ProductoID = pt.ProductoID
      GROUP BY p.ProductoID, p.NombreProducto, p.Stock
      ORDER BY p.ProductoID DESC
    `);
    
    res.json({
      message: 'Productos y sus tallas',
      productos: rows
    });
  } catch (err) {
    console.error('Error verificando productos:', err);
    res.status(500).json({
      error: 'Error verificando productos',
      details: err.message
    });
  }
};

// Eliminar el último producto
export const deleteLastProduct = async (req, res, next) => {
  try {
    const { getPool } = await import('../db.js');
    const pool = await getPool();
    
    // Obtener el último producto
    const [lastProductRows] = await pool.execute(`
      SELECT ProductoID, NombreProducto, Imagen
      FROM Productos
      ORDER BY ProductoID DESC
      LIMIT 1
    `);
    
    if (lastProductRows.length === 0) {
      return res.status(404).json({
        message: 'No hay productos para eliminar'
      });
    }
    
    const lastProduct = lastProductRows[0];
    
    // Eliminar las relaciones ProductoTallas primero
    await pool.execute(`
      DELETE FROM ProductoTallas
      WHERE ProductoID = ?
    `, [lastProduct.ProductoID]);
    
    // Eliminar el producto
    await pool.execute(`
      DELETE FROM Productos
      WHERE ProductoID = ?
    `, [lastProduct.ProductoID]);
    
    // Si tiene imagen, eliminar el archivo
    if (lastProduct.Imagen) {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const imagePath = path.join(__dirname, '../../images', lastProduct.Imagen);
        
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (fileError) {
        console.error('Error eliminando imagen:', fileError);
      }
    }
    
    res.json({
      message: 'Último producto eliminado exitosamente',
      productoEliminado: lastProduct
    });
  } catch (err) {
    console.error('Error eliminando último producto:', err);
    res.status(500).json({
      error: 'Error eliminando último producto',
      details: err.message
    });
  }
};

// Verificar estado de la base de datos
export const checkDatabaseStatus = async (req, res, next) => {
  try {
    const { getPool } = await import('../db.js');
    const pool = await getPool();
    
    // Contar productos
    const [productCountRows] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM Productos
    `);
    
    // Contar relaciones ProductoTallas
    const [tallaCountRows] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM ProductoTallas
    `);
    
    // Último producto
    const [lastProductRows] = await pool.execute(`
      SELECT ProductoID, NombreProducto, Stock
      FROM Productos
      ORDER BY ProductoID DESC
      LIMIT 1
    `);
    
    res.json({
      message: 'Estado de la base de datos',
      totalProductos: productCountRows[0].total,
      totalRelacionesTalla: tallaCountRows[0].total,
      ultimoProducto: lastProductRows[0] || null
    });
  } catch (err) {
    console.error('Error verificando estado:', err);
    res.status(500).json({
      error: 'Error verificando estado',
      details: err.message
    });
  }
};

// GET /api/products/destacados
export const getProductosDestacados = async (req, res, next) => {
  try {
    const productos = await ProductModel.getProductosAleatorios(4);
    res.json(productos);
  } catch (err) {
    console.error('Error en getProductosDestacados:', err);
    next(err);
  }
};

// PUT /api/products/destacados
export const updateProductosDestacados = async (req, res, next) => {
  try {
    const { tipo, productos } = req.body;
    
    if (!tipo) {
      return res.status(400).json({ message: 'Tipo es requerido' });
    }
    
    // Por ahora, simplemente devolver éxito
    res.json({ message: 'Configuración actualizada correctamente' });
  } catch (err) {
    console.error('Error en updateProductosDestacados:', err);
    next(err);
  }
};

// GET /api/products/dashboard/stock-tallas
export const getStockPorTallas = async (req, res, next) => {
  try {
    const stockData = await ProductModel.getStockPorTallas();
    res.json({
      success: true,
      data: stockData
    });
  } catch (err) {
    console.error('Error en getStockPorTallas:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener stock por tallas',
      error: err.message 
    });
  }
};

// GET /api/products/dashboard/ventas
export const getProductosVendidos = async (req, res, next) => {
  try {
    const ventasData = await ProductModel.getProductosVendidos();
    res.json({
      success: true,
      data: ventasData
    });
  } catch (err) {
    console.error('Error en getProductosVendidos:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener datos de ventas',
      error: err.message 
    });
  }
};

// GET /api/products/dashboard/estadisticas
export const getEstadisticasProductos = async (req, res, next) => {
  try {
    const estadisticas = await ProductModel.getEstadisticasProductos();
    res.json({
      success: true,
      data: estadisticas
    });
  } catch (err) {
    console.error('Error en getEstadisticasProductos:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener estadísticas de productos',
      error: err.message 
    });
  }
};

