// src/db.js
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { URL } from 'url';

dotenv.config();

const parseConnectionUrl = (value) => {
  if (!value) {
    return null;
  }

  const parsedUrl = new URL(value);

  return {
    host: parsedUrl.hostname,
    port: parsedUrl.port ? Number(parsedUrl.port) : 3306,
    user: decodeURIComponent(parsedUrl.username),
    password: decodeURIComponent(parsedUrl.password),
    database: parsedUrl.pathname.replace(/^\//, ''),
  };
};

const urlConfig =
  parseConnectionUrl(process.env.DATABASE_URL) ||
  parseConnectionUrl(process.env.MYSQL_URL) ||
  parseConnectionUrl(process.env.MYSQL_PUBLIC_URL);

const resolvedDatabaseName =
  process.env.DB_NAME ||
  process.env.MYSQLDATABASE ||
  urlConfig?.database;

const masterConfig = {
  host: process.env.DB_HOST || process.env.MYSQLHOST || urlConfig?.host || 'localhost',
  user: process.env.DB_USER || process.env.MYSQLUSER || urlConfig?.user,
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || urlConfig?.password,
  port: Number(process.env.DB_PORT || process.env.MYSQLPORT || urlConfig?.port || 3306),
  charset: 'utf8mb4'
};

const appConfig = {
  ...masterConfig,
  database: resolvedDatabaseName
};

// scripts para crear tablas
const tableCreationScripts = [
  // 0) Crear BD si no existe
  `CREATE DATABASE IF NOT EXISTS ${resolvedDatabaseName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,

  // 2) Usuarios
  `CREATE TABLE IF NOT EXISTS ${resolvedDatabaseName}.Usuarios (
     UsuarioID      INT           AUTO_INCREMENT PRIMARY KEY,
     NombreUsuario  VARCHAR(50)   NOT NULL,
     Contrasena     VARCHAR(255)  NOT NULL,
     Correo         VARCHAR(100)  NOT NULL,
     FechaRegistro  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
     UltimaActividad TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     Rol            VARCHAR(50)   NOT NULL
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 3) Direcciones
  `CREATE TABLE IF NOT EXISTS ${resolvedDatabaseName}.Direcciones (
     DireccionID   INT           AUTO_INCREMENT PRIMARY KEY,
     UsuarioID     INT           NOT NULL,
     Direccion     VARCHAR(255)  NOT NULL,
     Ciudad        VARCHAR(100)  NOT NULL,
     Pais          VARCHAR(100)  NOT NULL,
     CodigoPostal  VARCHAR(20)   NOT NULL,
    FOREIGN KEY (UsuarioID) REFERENCES ${resolvedDatabaseName}.Usuarios(UsuarioID) ON DELETE CASCADE
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 4) Productos
  `CREATE TABLE IF NOT EXISTS ${resolvedDatabaseName}.Productos (
     ProductoID     INT           AUTO_INCREMENT PRIMARY KEY,
     NombreProducto VARCHAR(100)  NOT NULL,
     Descripcion    VARCHAR(255),
     Precio         DECIMAL(10,2) NOT NULL,
     Stock          INT           DEFAULT 0,
     Imagen         VARCHAR(255)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 5) Tallas
  `CREATE TABLE IF NOT EXISTS ${resolvedDatabaseName}.Tallas (
     TallaID     INT           AUTO_INCREMENT PRIMARY KEY,
     NombreTalla VARCHAR(10)   NOT NULL UNIQUE
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 6) ProductoTallas
  `CREATE TABLE IF NOT EXISTS ${resolvedDatabaseName}.ProductoTallas (
     ProductoID INT NOT NULL,
     TallaID    INT NOT NULL,
     Stock      INT DEFAULT 0,
     PRIMARY KEY (ProductoID, TallaID),
    FOREIGN KEY (ProductoID) REFERENCES ${resolvedDatabaseName}.Productos(ProductoID) ON DELETE CASCADE,
    FOREIGN KEY (TallaID) REFERENCES ${resolvedDatabaseName}.Tallas(TallaID) ON DELETE CASCADE
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 7) Carritos
  `CREATE TABLE IF NOT EXISTS ${resolvedDatabaseName}.Carritos (
     CarritoID     INT           AUTO_INCREMENT PRIMARY KEY,
     UsuarioID     INT           NOT NULL,
     FechaCreacion TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UsuarioID) REFERENCES ${resolvedDatabaseName}.Usuarios(UsuarioID) ON DELETE CASCADE
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 8) CarritoArticulos
  `CREATE TABLE IF NOT EXISTS ${resolvedDatabaseName}.CarritoArticulos (
     CarritoArticuloID INT AUTO_INCREMENT PRIMARY KEY,
     CarritoID         INT NOT NULL,
     ProductoID        INT NOT NULL,
     TallaID           INT,
     Cantidad          INT NOT NULL,
    FOREIGN KEY (CarritoID) REFERENCES ${resolvedDatabaseName}.Carritos(CarritoID) ON DELETE CASCADE,
    FOREIGN KEY (ProductoID) REFERENCES ${resolvedDatabaseName}.Productos(ProductoID) ON DELETE CASCADE,
    FOREIGN KEY (TallaID) REFERENCES ${resolvedDatabaseName}.Tallas(TallaID) ON DELETE SET NULL
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 9) Ordenes
  `CREATE TABLE IF NOT EXISTS ${resolvedDatabaseName}.Ordenes (
     OrdenID     INT           AUTO_INCREMENT PRIMARY KEY,
     UsuarioID   INT           NOT NULL,
     FechaOrden  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
     Estado      VARCHAR(50)   NOT NULL,
     DireccionID INT           NOT NULL,
     PaymentId   VARCHAR(100),
     PreferenceId VARCHAR(100),
    FOREIGN KEY (UsuarioID) REFERENCES ${resolvedDatabaseName}.Usuarios(UsuarioID) ON DELETE CASCADE,
    FOREIGN KEY (DireccionID) REFERENCES ${resolvedDatabaseName}.Direcciones(DireccionID) ON DELETE CASCADE
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 10) OrdenArticulos
  `CREATE TABLE IF NOT EXISTS ${resolvedDatabaseName}.OrdenArticulos (
     OrdenArticuloID INT           AUTO_INCREMENT PRIMARY KEY,
     OrdenID         INT           NOT NULL,
     ProductoID      INT           NOT NULL,
     TallaID         INT           NOT NULL,
     Cantidad        INT           NOT NULL,
     Precio          DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (OrdenID) REFERENCES ${resolvedDatabaseName}.Ordenes(OrdenID) ON DELETE CASCADE,
    FOREIGN KEY (ProductoID) REFERENCES ${resolvedDatabaseName}.Productos(ProductoID) ON DELETE CASCADE,
    FOREIGN KEY (TallaID) REFERENCES ${resolvedDatabaseName}.Tallas(TallaID) ON DELETE CASCADE
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 11) Pagos
  `CREATE TABLE IF NOT EXISTS ${resolvedDatabaseName}.Pagos (
     PagoID       INT           AUTO_INCREMENT PRIMARY KEY,
     OrdenID      INT           NOT NULL,
     Monto        DECIMAL(10,2) NOT NULL,
     FechaPago    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
     MetodoPago   VARCHAR(50)   NOT NULL,
     PaymentId    VARCHAR(100)  NULL,
     PreferenceId VARCHAR(100)  NULL,
     Estado       VARCHAR(50)   DEFAULT 'Pendiente',
    FOREIGN KEY (OrdenID) REFERENCES ${resolvedDatabaseName}.Ordenes(OrdenID) ON DELETE CASCADE
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 12) Carrusel
  `CREATE TABLE IF NOT EXISTS ${resolvedDatabaseName}.Carrusel (
    CarruselID INT AUTO_INCREMENT PRIMARY KEY,
    ImagenPath VARCHAR(255) NOT NULL,
    Orden      INT          NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 13) Insertar tallas básicas si no existen
  `INSERT IGNORE INTO ${resolvedDatabaseName}.Tallas (NombreTalla) VALUES ('S'), ('M'), ('L'), ('XL');`
];

// scripts para crear triggers
const triggerScripts = [
  // sincroniza Productos.Stock con suma de tallas
  `CREATE TRIGGER IF NOT EXISTS trg_SincronizarStockProducto
   AFTER INSERT ON ProductoTallas
   FOR EACH ROW
   BEGIN
     UPDATE Productos
     SET Stock = (
       SELECT COALESCE(SUM(Stock), 0)
       FROM ProductoTallas
       WHERE ProductoTallas.ProductoID = NEW.ProductoID
     )
     WHERE ProductoID = NEW.ProductoID;
   END;`,

  `CREATE TRIGGER IF NOT EXISTS trg_SincronizarStockProductoUpdate
   AFTER UPDATE ON ProductoTallas
   FOR EACH ROW
   BEGIN
     UPDATE Productos
     SET Stock = (
       SELECT COALESCE(SUM(Stock), 0)
       FROM ProductoTallas
       WHERE ProductoTallas.ProductoID = NEW.ProductoID
     )
     WHERE ProductoID = NEW.ProductoID;
   END;`,

  `CREATE TRIGGER IF NOT EXISTS trg_SincronizarStockProductoDelete
   AFTER DELETE ON ProductoTallas
   FOR EACH ROW
   BEGIN
     UPDATE Productos
     SET Stock = (
       SELECT COALESCE(SUM(Stock), 0)
       FROM ProductoTallas
       WHERE ProductoTallas.ProductoID = OLD.ProductoID
     )
     WHERE ProductoID = OLD.ProductoID;
   END;`,

  // descuenta stock por talla al insertar orden artículo
  `CREATE TRIGGER IF NOT EXISTS trg_DescontarStockAlInsertarOrdenArticulo
   AFTER INSERT ON OrdenArticulos
   FOR EACH ROW
   BEGIN
     UPDATE ProductoTallas
     SET Stock = Stock - NEW.Cantidad
     WHERE ProductoID = NEW.ProductoID AND TallaID = NEW.TallaID;
   END;`,

  // restaura stock si se elimina un artículo de orden
  `CREATE TRIGGER IF NOT EXISTS trg_RestaurarStockAlEliminarOrdenArticulo
   AFTER DELETE ON OrdenArticulos
   FOR EACH ROW
   BEGIN
     UPDATE ProductoTallas
     SET Stock = Stock + OLD.Cantidad
     WHERE ProductoID = OLD.ProductoID AND TallaID = OLD.TallaID;
   END;`
];

let connectedPool = null;

export const connectBD = async () => {
  if (connectedPool) return connectedPool;

  if (!resolvedDatabaseName) {
    throw new Error('Falta configurar DB_NAME o las variables MYSQLDATABASE/DATABASE_URL de Railway.');
  }

  try {
    // 1) Intentar crear la base solo cuando el proveedor lo permita.
    try {
      const masterConnection = await mysql.createConnection(masterConfig);
      await masterConnection.execute(tableCreationScripts[0]);
      await masterConnection.end();
    } catch (dbCreationError) {
      console.warn('⚠️ No se pudo crear/verificar la base automáticamente, se intentará usar la base existente:', dbCreationError.message);
    }

    // 2) Conectar a BD de aplicación
    const pool = mysql.createPool(appConfig);

    // 3) Crear tablas (ignorar si ya existen)
    for (let i = 1; i < tableCreationScripts.length; i++) {
      try {
        console.log(`🔧 Ejecutando script ${i}:`, tableCreationScripts[i].substring(0, 100) + '...');
        await pool.execute(tableCreationScripts[i]);
        console.log(`✅ Script ${i} ejecutado exitosamente`);
      } catch (err) {
        const msg = err.message;
        if (!msg.includes('already exists') &&
            !msg.includes('Duplicate entry')) {
          console.error('Error al ejecutar script de tabla:', msg);
          throw err;
        } else {
          console.log(`⚠️ Script ${i} ya existe, continuando...`);
        }
      }
    }

    // 4) Crear triggers
    for (const script of triggerScripts) {
      try {
        await pool.query(script);
        console.log('✅ Trigger creado exitosamente');
      } catch (err) {
        console.error('Error al ejecutar script de trigger:', err.message);
        // Los triggers pueden fallar si ya existen, no es crítico
      }
    }

    // 5) Seed: usuario admin
    const [adminRows] = await pool.execute('SELECT COUNT(*) as total FROM Usuarios');
    if (adminRows[0].total === 0) {
      const hash = await bcrypt.hash('UserAdmin', 10);
      await pool.execute(`
        INSERT INTO ${resolvedDatabaseName}.Usuarios (NombreUsuario, Contrasena, Correo, Rol)
        VALUES (?, ?, ?, ?)
      `, ['Admin', hash, 'admin@example.com', 'Admin']);
      console.log('✅ Usuario admin creado');
    }

    connectedPool = pool;
    return pool;

  } catch (error) {
    console.error('Error al inicializar BD:', error);
    if (connectedPool) await connectedPool.end();
    connectedPool = null;
    throw error;
  }
};

export const getPool = async () => {
  if (!connectedPool) await connectBD();
  return connectedPool;
};

export const getConnection = async () => {
  try {
    if (!connectedPool) {
      connectedPool = await connectBD();
    }
    return connectedPool;
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
};