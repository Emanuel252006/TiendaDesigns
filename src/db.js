// src/db.js
import sql from 'mssql';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const masterConfig = {
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server:   process.env.DB_SERVER,
  database: process.env.DB_MASTER,
  options: {
    encrypt:               process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true'
  }
};

const appConfig = {
  ...masterConfig,
  database: process.env.DB_NAME
};

// scripts para crear tablas
const tableCreationScripts = [
  // 0) Crear BD si no existe
  `IF NOT EXISTS (
      SELECT name FROM sys.databases
       WHERE name = N'${process.env.DB_NAME}'
    )
    CREATE DATABASE ${process.env.DB_NAME};`,

  // 1) Cambiar contexto a la BD de aplicación
  `USE ${process.env.DB_NAME};`,

  // 2) Usuarios
  `CREATE TABLE Usuarios (
     UsuarioID      INT           PRIMARY KEY IDENTITY(1,1),
     NombreUsuario  NVARCHAR(50)  NOT NULL,
     Contrasena     NVARCHAR(255) NOT NULL,
     Correo         NVARCHAR(100) NOT NULL,
     FechaRegistro  DATETIME      DEFAULT GETDATE(),
     Rol            NVARCHAR(50)  NOT NULL
   );`,

  // 3) Direcciones
  `CREATE TABLE Direcciones (
     DireccionID   INT           PRIMARY KEY IDENTITY(1,1),
     UsuarioID     INT           NOT NULL 
                             FOREIGN KEY REFERENCES Usuarios(UsuarioID),
     Direccion     NVARCHAR(255) NOT NULL,
     Ciudad        NVARCHAR(100) NOT NULL,
     Pais          NVARCHAR(100) NOT NULL,
     CodigoPostal  NVARCHAR(20)  NOT NULL
   );`,

  // 4) Productos
  `CREATE TABLE Productos (
     ProductoID     INT           PRIMARY KEY IDENTITY(1,1),
     NombreProducto NVARCHAR(100) NOT NULL,
     Descripcion    NVARCHAR(255),
     Precio         DECIMAL(10,2) NOT NULL,
     Stock          INT           NOT NULL,
     Imagen         NVARCHAR(255)
   );`,

  // 5) Tallas
  `CREATE TABLE Tallas (
     TallaID     INT           PRIMARY KEY IDENTITY(1,1),
     NombreTalla NVARCHAR(10)  NOT NULL UNIQUE
   );`,

  // 6) ProductoTallas
  `CREATE TABLE ProductoTallas (
     ProductoID INT NOT NULL 
               FOREIGN KEY REFERENCES Productos(ProductoID),
     TallaID    INT NOT NULL 
               FOREIGN KEY REFERENCES Tallas(TallaID),
     Stock      INT DEFAULT 0,
     PRIMARY KEY (ProductoID, TallaID)
   );`,

  // 7) Inventarios
  `CREATE TABLE Inventarios (
     InventarioID INT           PRIMARY KEY IDENTITY(1,1),
     ProductoID   INT           NOT NULL 
                             FOREIGN KEY REFERENCES Productos(ProductoID),
     Ubicacion    NVARCHAR(100) NOT NULL,
     Cantidad     INT           NOT NULL
   );`,

  // 8) Carritos
  `CREATE TABLE Carritos (
     CarritoID     INT           PRIMARY KEY IDENTITY(1,1),
     UsuarioID     INT           NOT NULL 
                              FOREIGN KEY REFERENCES Usuarios(UsuarioID),
     FechaCreacion DATETIME      DEFAULT GETDATE()
   );`,

  // 9) CarritoArticulos
  `CREATE TABLE CarritoArticulos (
     CarritoArticuloID INT PRIMARY KEY IDENTITY(1,1),
     CarritoID         INT NOT NULL 
                              FOREIGN KEY REFERENCES Carritos(CarritoID),
     ProductoID        INT NOT NULL 
                              FOREIGN KEY REFERENCES Productos(ProductoID),
     TallaID           INT 
                              FOREIGN KEY REFERENCES Tallas(TallaID),
     Cantidad          INT NOT NULL
   );`,

  // 10) Ordenes
  `CREATE TABLE Ordenes (
     OrdenID     INT           PRIMARY KEY IDENTITY(1,1),
     UsuarioID   INT           NOT NULL 
                             FOREIGN KEY REFERENCES Usuarios(UsuarioID),
     FechaOrden  DATETIME      DEFAULT GETDATE(),
     Estado      NVARCHAR(50)  NOT NULL,
     DireccionID INT           NOT NULL 
                             FOREIGN KEY REFERENCES Direcciones(DireccionID)
   );`,

  // 11) OrdenArticulos
  `CREATE TABLE OrdenArticulos (
     OrdenArticuloID INT           PRIMARY KEY IDENTITY(1,1),
     OrdenID         INT           NOT NULL 
                              FOREIGN KEY REFERENCES Ordenes(OrdenID),
     ProductoID      INT           NOT NULL 
                              FOREIGN KEY REFERENCES Productos(ProductoID),
     TallaID         INT           NOT NULL 
                              FOREIGN KEY REFERENCES Tallas(TallaID),
     Cantidad        INT           NOT NULL,
     Precio          DECIMAL(10,2) NOT NULL
   );`,

  // 12) Pagos
  `CREATE TABLE Pagos (
     PagoID     INT           PRIMARY KEY IDENTITY(1,1),
     OrdenID    INT           NOT NULL 
                             FOREIGN KEY REFERENCES Ordenes(OrdenID),
     Monto      DECIMAL(10,2) NOT NULL,
     FechaPago  DATETIME      DEFAULT GETDATE(),
     MetodoPago NVARCHAR(50)  NOT NULL
   );
   -- 13) Carrusel: guarda las rutas de las imágenes y el orden en que aparecen
CREATE TABLE Carrusel (
  CarruselID INT IDENTITY(1,1) PRIMARY KEY,
  ImagenPath NVARCHAR(255) NOT NULL,   -- ruta relativa, p.ej. '/uploads/carrusel/banner1.jpg'
  Orden       INT          NOT NULL    -- controla la posición en el carrusel
);
   `
];

// scripts para crear triggers
const triggerScripts = [
  // sincroniza Productos.Stock con suma de tallas
  `CREATE OR ALTER TRIGGER trg_SincronizarStockProducto
     ON ProductoTallas
     AFTER INSERT, UPDATE, DELETE
  AS
  BEGIN
    SET NOCOUNT ON;
    DECLARE @ProdIds TABLE (ProductoID INT PRIMARY KEY);
    INSERT INTO @ProdIds SELECT DISTINCT ProductoID FROM inserted
    UNION
    SELECT DISTINCT ProductoID FROM deleted;

    UPDATE p
      SET p.Stock = ISNULL(s.TotalStock, 0)
      FROM Productos p
      JOIN (
        SELECT ProductoID, SUM(Stock) AS TotalStock
          FROM ProductoTallas
         GROUP BY ProductoID
      ) AS s ON p.ProductoID = s.ProductoID
     WHERE p.ProductoID IN (SELECT ProductoID FROM @ProdIds);

    UPDATE Productos
      SET Stock = 0
      WHERE ProductoID IN (
        SELECT ProductoID FROM @ProdIds
        EXCEPT
        SELECT ProductoID FROM ProductoTallas
      );
  END;`,

  // descuenta stock por talla al insertar orden artículo
  `CREATE OR ALTER TRIGGER trg_DescontarStockAlInsertarOrdenArticulo
     ON OrdenArticulos
     AFTER INSERT
  AS
  BEGIN
    SET NOCOUNT ON;
    UPDATE pt
      SET pt.Stock = pt.Stock - i.Cantidad
      FROM ProductoTallas pt
      JOIN inserted i
        ON pt.ProductoID = i.ProductoID
       AND pt.TallaID    = i.TallaID;
  END;`,

  // restaura stock si se elimina un artículo de orden
  `CREATE OR ALTER TRIGGER trg_RestaurarStockAlEliminarOrdenArticulo
     ON OrdenArticulos
     AFTER DELETE
  AS
  BEGIN
    SET NOCOUNT ON;
    UPDATE pt
      SET pt.Stock = pt.Stock + d.Cantidad
      FROM ProductoTallas pt
      JOIN deleted d
        ON pt.ProductoID = d.ProductoID
       AND pt.TallaID    = d.TallaID;
  END;`
];

let connectedPool = null;

export const connectBD = async () => {
  if (connectedPool) return connectedPool;

  try {
    // 1) Crear BD si no existe
    const poolMaster = await new sql.ConnectionPool(masterConfig).connect();
    await poolMaster.request().query(tableCreationScripts[0]);
    await poolMaster.close();

    // 2) Conectar a BD de aplicación
    const pool = await new sql.ConnectionPool(appConfig).connect();

    // 3) Crear tablas (ignorar si ya existen)
    for (let i = 1; i < tableCreationScripts.length; i++) {
      try {
        await pool.request().query(tableCreationScripts[i]);
      } catch (err) {
        const msg = err.message;
        if (!msg.includes('already exists') &&
            !msg.includes('There is already an object named')) {
          console.error('Error al ejecutar script de tabla:', msg);
          throw err;
        }
      }
    }

    // 4) Crear triggers (cada uno en su propia batch)
    for (const script of triggerScripts) {
      try {
        await pool.request().batch(script);
      } catch (err) {
        console.error('Error al ejecutar script de trigger:', err.message);
        // si quieres ignorar errores de existencia, descomenta:
        // if (!/already exists/i.test(err.message)) throw err;
      }
    }

    // 5) Seed: usuario admin
    const { recordset } = await pool.request()
      .query('SELECT COUNT(*) AS total FROM Usuarios');
    if (recordset[0].total === 0) {
      const hash = await bcrypt.hash('UserAdmin', 10);
      await pool.request()
        .input('NombreUsuario', sql.NVarChar, 'Admin')
        .input('Contrasena',    sql.NVarChar, hash)
        .input('Correo',        sql.NVarChar, 'admin@example.com')
        .input('Rol',           sql.NVarChar, 'Admin')
        .query(`
          INSERT INTO Usuarios (NombreUsuario, Contrasena, Correo, Rol)
          VALUES (@NombreUsuario, @Contrasena, @Correo, @Rol)
        `);
    }

    connectedPool = pool;
    return pool;

  } catch (error) {
    console.error('Error al inicializar BD:', error);
    if (connectedPool) await connectedPool.close();
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