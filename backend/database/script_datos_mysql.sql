USE tiendadesigns;

-- =============================================
-- SCRIPT PARA INSERTAR DATOS DE PRUEBA EN MYSQL
-- =============================================

-- 1) INSERTAR BANNERS DEL CARRUSEL (solo si no existen)
INSERT IGNORE INTO Carrusel (ImagenPath, Orden)
VALUES ('carrusel/1754367075286_Elegancia en Tres Tiempos.png', 1);

INSERT IGNORE INTO Carrusel (ImagenPath, Orden)
VALUES ('carrusel/carrusel2.png', 2);

-- 2) INSERTAR TALLAS BASE (solo si no existen)
INSERT IGNORE INTO Tallas (NombreTalla) VALUES ('S');
INSERT IGNORE INTO Tallas (NombreTalla) VALUES ('M');
INSERT IGNORE INTO Tallas (NombreTalla) VALUES ('L');
INSERT IGNORE INTO Tallas (NombreTalla) VALUES ('XL');

-- 3) INSERTAR PRODUCTOS (solo si no existen)
INSERT IGNORE INTO Productos (NombreProducto, Descripcion, Precio, Stock, Imagen)
VALUES (
    'Camiseta Blanca',
    'Camiseta básica de algodón blanco',
    100000.00,
    32,
    'productos/camisablanca.png'
);

INSERT IGNORE INTO Productos (NombreProducto, Descripcion, Precio, Stock, Imagen)
VALUES (
    'Pantalón Beige',
    'Pantalón beige de lino',
    50000.00,
    20,
    'productos/destacada3.jpg'
);

INSERT IGNORE INTO Productos (NombreProducto, Descripcion, Precio, Stock, Imagen)
VALUES (
    'Traje Azul',
    'Traje formal de corte clásico en azul marino',
    180000.00,
    20,
    'productos/trajeazul.png'
);

INSERT IGNORE INTO Productos (NombreProducto, Descripcion, Precio, Stock, Imagen)
VALUES (
    'Camisa Clásica',
    'Camisa blanca formal',
    40000.00,
    24,
    'productos/destacada1.jpg'
);

-- 4) INSERTAR STOCK POR TALLA (solo si no existen las relaciones)
-- Obtener IDs de productos y tallas
SET @CamisetaID = (SELECT ProductoID FROM Productos WHERE NombreProducto = 'Camiseta Blanca');
SET @PantalonID = (SELECT ProductoID FROM Productos WHERE NombreProducto = 'Pantalón Beige');
SET @TrajeID = (SELECT ProductoID FROM Productos WHERE NombreProducto = 'Traje Azul');
SET @CamisaID = (SELECT ProductoID FROM Productos WHERE NombreProducto = 'Camisa Clásica');

SET @TallaS = (SELECT TallaID FROM Tallas WHERE NombreTalla = 'S');
SET @TallaM = (SELECT TallaID FROM Tallas WHERE NombreTalla = 'M');
SET @TallaL = (SELECT TallaID FROM Tallas WHERE NombreTalla = 'L');
SET @TallaXL = (SELECT TallaID FROM Tallas WHERE NombreTalla = 'XL');

-- Camiseta Blanca (Stock total: 32)
INSERT IGNORE INTO ProductoTallas (ProductoID, TallaID, Stock) VALUES (@CamisetaID, @TallaS, 10);
INSERT IGNORE INTO ProductoTallas (ProductoID, TallaID, Stock) VALUES (@CamisetaID, @TallaM, 15);
INSERT IGNORE INTO ProductoTallas (ProductoID, TallaID, Stock) VALUES (@CamisetaID, @TallaL, 5);
INSERT IGNORE INTO ProductoTallas (ProductoID, TallaID, Stock) VALUES (@CamisetaID, @TallaXL, 2);

-- Pantalón Beige (Stock total: 20)
INSERT IGNORE INTO ProductoTallas (ProductoID, TallaID, Stock) VALUES (@PantalonID, @TallaM, 10);
INSERT IGNORE INTO ProductoTallas (ProductoID, TallaID, Stock) VALUES (@PantalonID, @TallaL, 10);

-- Traje Azul (Stock total: 20)
INSERT IGNORE INTO ProductoTallas (ProductoID, TallaID, Stock) VALUES (@TrajeID, @TallaS, 5);
INSERT IGNORE INTO ProductoTallas (ProductoID, TallaID, Stock) VALUES (@TrajeID, @TallaM, 5);
INSERT IGNORE INTO ProductoTallas (ProductoID, TallaID, Stock) VALUES (@TrajeID, @TallaL, 5);
INSERT IGNORE INTO ProductoTallas (ProductoID, TallaID, Stock) VALUES (@TrajeID, @TallaXL, 5);

-- Camisa Clásica (Stock total: 24)
INSERT IGNORE INTO ProductoTallas (ProductoID, TallaID, Stock) VALUES (@CamisaID, @TallaS, 8);
INSERT IGNORE INTO ProductoTallas (ProductoID, TallaID, Stock) VALUES (@CamisaID, @TallaM, 8);
INSERT IGNORE INTO ProductoTallas (ProductoID, TallaID, Stock) VALUES (@CamisaID, @TallaL, 8);

-- 5) VERIFICAR QUE LOS DATOS SE INSERTARON CORRECTAMENTE
SELECT '=== VERIFICACIÓN DE DATOS INSERTADOS ===' as mensaje;

SELECT 'Banners del carrusel:' as mensaje;
SELECT * FROM Carrusel ORDER BY Orden;

SELECT 'Tallas disponibles:' as mensaje;
SELECT * FROM Tallas ORDER BY TallaID;

SELECT 'Productos:' as mensaje;
SELECT ProductoID, NombreProducto, Precio, Stock, Imagen FROM Productos ORDER BY ProductoID;

SELECT 'Stock por talla:' as mensaje;
SELECT 
    p.NombreProducto,
    t.NombreTalla,
    pt.Stock
FROM ProductoTallas pt
JOIN Productos p ON pt.ProductoID = p.ProductoID
JOIN Tallas t ON pt.TallaID = t.TallaID
ORDER BY p.ProductoID, t.TallaID;

SELECT '=== FIN DE VERIFICACIÓN ===' as mensaje;
