import sql from 'mssql';
import bcrypt from 'bcryptjs';


const config = {
  user: 'Proyecto', 
  password: 'proyecto123', 
  server: 'localhost', 
  database: 'master', 
  options: {
    encrypt: false, 
    trustServerCertificate: true 
  }
};

const tableCreationScripts = [
 
  `IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'BDPROYECTOFIN')
     CREATE DATABASE BDPROYECTOFIN;`,

  
  `CREATE TABLE Usuarios (
    UsuarioID INT PRIMARY KEY IDENTITY(1,1),
    NombreUsuario NVARCHAR(50) NOT NULL,
    Contrasena NVARCHAR(255) NOT NULL,
    Correo NVARCHAR(100) NOT NULL,
    FechaRegistro DATETIME DEFAULT GETDATE(),
    Rol NVARCHAR(50) NOT NULL
  );`,

  `CREATE TABLE Direcciones (
    DireccionID INT PRIMARY KEY IDENTITY(1,1),
    UsuarioID INT FOREIGN KEY REFERENCES Usuarios(UsuarioID),
    Direccion NVARCHAR(255) NOT NULL,
    Ciudad NVARCHAR(100) NOT NULL,
    Pais NVARCHAR(100) NOT NULL,
    CodigoPostal NVARCHAR(20) NOT NULL
  );`,


  `CREATE TABLE Productos (
    ProductoID INT PRIMARY KEY IDENTITY(1,1),
    NombreProducto NVARCHAR(100) NOT NULL,
    Descripcion NVARCHAR(255),
    Precio DECIMAL(10, 2) NOT NULL,
    Stock INT NOT NULL,
    Imagen NVARCHAR(255),
  );`,

  `CREATE TABLE Inventarios (
    InventarioID INT PRIMARY KEY IDENTITY(1,1),
    ProductoID INT FOREIGN KEY REFERENCES Productos(ProductoID),
    Ubicacion NVARCHAR(100) NOT NULL,
    Cantidad INT NOT NULL
  );`,

  `CREATE TABLE Carritos (
    CarritoID INT PRIMARY KEY IDENTITY(1,1),
    UsuarioID INT FOREIGN KEY REFERENCES Usuarios(UsuarioID),
    FechaCreacion DATETIME DEFAULT GETDATE()
  );`,

  `CREATE TABLE CarritoArticulos (
    CarritoArticuloID INT PRIMARY KEY IDENTITY(1,1),
    CarritoID INT FOREIGN KEY REFERENCES Carritos(CarritoID),
    ProductoID INT FOREIGN KEY REFERENCES Productos(ProductoID),
    Cantidad INT NOT NULL
  );`,

  `CREATE TABLE Ordenes (
    OrdenID INT PRIMARY KEY IDENTITY(1,1),
    UsuarioID INT FOREIGN KEY REFERENCES Usuarios(UsuarioID),
    FechaOrden DATETIME DEFAULT GETDATE(),
    Estado NVARCHAR(50) NOT NULL,
    DireccionID INT FOREIGN KEY REFERENCES Direcciones(DireccionID)
  );`,

  `CREATE TABLE OrdenArticulos (
    OrdenArticuloID INT PRIMARY KEY IDENTITY(1,1),
    OrdenID INT FOREIGN KEY REFERENCES Ordenes(OrdenID),
    ProductoID INT FOREIGN KEY REFERENCES Productos(ProductoID),
    Cantidad INT NOT NULL,
    Precio DECIMAL(10, 2) NOT NULL
  );`,

  `CREATE TABLE Pagos (
    PagoID INT PRIMARY KEY IDENTITY(1,1),
    OrdenID INT FOREIGN KEY REFERENCES Ordenes(OrdenID),
    Monto DECIMAL(10, 2) NOT NULL,
    FechaPago DATETIME DEFAULT GETDATE(),
    MetodoPago NVARCHAR(50) NOT NULL
  );`,
];

let connectedPool; 

export const connectBD = async () => {
  try {
    
    if (connectedPool) {
      return connectedPool;
    }

    const poolMaster = new sql.ConnectionPool(config);
    await poolMaster.connect();

  
    const createDbScript = tableCreationScripts[0];
    await poolMaster.request().query(createDbScript);
    poolMaster.close(); 

  
    const appConfig = { ...config, database: 'BDPROYECTOFIN' };
    const pool = new sql.ConnectionPool(appConfig);
    await pool.connect();
    console.log('Conexión exitosa a la base de datos.'); 

    // Ejecutar scripts de creación de tablas (silenciosamente si ya existen).
    // Comenzamos desde el índice 1 porque el índice 0 es la creación de la base de datos.
    for (let i = 1; i < tableCreationScripts.length; i++) {
      const script = tableCreationScripts[i];
      if (script.trim().length > 0) {
        try {
          await pool.request().query(script);
        } catch (err) {
          // Si el error es que el objeto ya existe, lo ignoramos.
          if (!err.message.includes('There is already an object named') &&
              !err.message.includes('Cannot add primary key constraint') &&
              !err.message.includes('The object name') &&
              !err.message.includes('already exists in table')) {
          
            console.error(`Error crítico al ejecutar script:\n${script}\nError:`, err);
            throw err;
          }
        }
      }
    }

    
    const { recordset: users } = await pool.request().query('SELECT COUNT(*) AS total FROM Usuarios');
    if (users[0].total === 0) {
      const passwordHash = await bcrypt.hash('UserAdmin', 10);
      const insertAdminScript = `
        INSERT INTO Usuarios (NombreUsuario, Contrasena, Correo, Rol)
        VALUES (@NombreUsuario, @Contrasena, @Correo, @Rol)
      `;
      const request = pool.request();
      request.input('NombreUsuario', sql.NVarChar, 'Admin');
      request.input('Contrasena', sql.NVarChar, passwordHash);
      request.input('Correo', sql.NVarChar, 'admin@example.com');
      request.input('Rol', sql.NVarChar, 'Admin');
      await request.query(insertAdminScript);
      console.log('Usuario administrador (Admin) agregado a la base de datos.');
    } else {
      console.log('El usuario administrador ya se encuentra registrado.');
    }

    connectedPool = pool; 
    return connectedPool;

  } catch (error) {
    console.error('Error al conectar o crear la base de datos:', error);
   
    if (connectedPool) {
      connectedPool.close();
      connectedPool = null;
    }
    throw error;
  }
};


export const getPool = async () => {
    if (!connectedPool) {
        await connectBD(); 
    }
    return connectedPool;
};