USE BDPROYECTOFIN;
GO

-- =============================================
-- SCRIPT PARA INSERTAR DATOS DE PRUEBA
-- =============================================

-- 1) INSERTAR BANNERS DEL CARRUSEL (solo si no existen)
IF NOT EXISTS (SELECT * FROM Carrusel WHERE Orden = 1)
BEGIN
    INSERT INTO Carrusel (ImagenPath, Orden)
    VALUES ('carrusel/carrusel1.png', 1);
END

IF NOT EXISTS (SELECT * FROM Carrusel WHERE Orden = 2)
BEGIN
    INSERT INTO Carrusel (ImagenPath, Orden)
    VALUES ('carrusel/carrusel2.png', 2);
END

-- 2) INSERTAR TALLAS BASE (solo si no existen)
IF NOT EXISTS (SELECT * FROM Tallas WHERE NombreTalla = 'S')
    INSERT INTO Tallas (NombreTalla) VALUES ('S');

IF NOT EXISTS (SELECT * FROM Tallas WHERE NombreTalla = 'M')
    INSERT INTO Tallas (NombreTalla) VALUES ('M');

IF NOT EXISTS (SELECT * FROM Tallas WHERE NombreTalla = 'L')
    INSERT INTO Tallas (NombreTalla) VALUES ('L');

IF NOT EXISTS (SELECT * FROM Tallas WHERE NombreTalla = 'XL')
    INSERT INTO Tallas (NombreTalla) VALUES ('XL');

-- 3) INSERTAR PRODUCTOS (solo si no existen)
IF NOT EXISTS (SELECT * FROM Productos WHERE NombreProducto = 'Camiseta Blanca')
BEGIN
    INSERT INTO Productos (NombreProducto, Descripcion, Precio, Stock, Imagen)
    VALUES (
        'Camiseta Blanca',
        'Camiseta básica de algodón blanco',
        100000.00,
        32,
        'productos/camisablanca.png'
    );
END

IF NOT EXISTS (SELECT * FROM Productos WHERE NombreProducto = 'Pantalón Beige')
BEGIN
    INSERT INTO Productos (NombreProducto, Descripcion, Precio, Stock, Imagen)
    VALUES (
        'Pantalón Beige',
        'Pantalón beige de lino',
        50000.00,
        20,
        'productos/destacada3.jpg'
    );
END

IF NOT EXISTS (SELECT * FROM Productos WHERE NombreProducto = 'Traje Azul')
BEGIN
    INSERT INTO Productos (NombreProducto, Descripcion, Precio, Stock, Imagen)
    VALUES (
        'Traje Azul',
        'Traje formal de corte clásico en azul marino',
        180000.00,
        20,
        'productos/trajeazul.png'
    );
END

IF NOT EXISTS (SELECT * FROM Productos WHERE NombreProducto = 'Camisa Clásica')
BEGIN
    INSERT INTO Productos (NombreProducto, Descripcion, Precio, Stock, Imagen)
    VALUES (
        'Camisa Clásica',
        'Camisa blanca formal',
        40000.00,
        24,
        'productos/destacada1.jpg'
    );
END

-- 4) INSERTAR STOCK POR TALLA (solo si no existen las relaciones)
-- Obtener IDs de productos y tallas
DECLARE @CamisetaID INT = (SELECT ProductoID FROM Productos WHERE NombreProducto = 'Camiseta Blanca');
DECLARE @PantalonID INT = (SELECT ProductoID FROM Productos WHERE NombreProducto = 'Pantalón Beige');
DECLARE @TrajeID INT = (SELECT ProductoID FROM Productos WHERE NombreProducto = 'Traje Azul');
DECLARE @CamisaID INT = (SELECT ProductoID FROM Productos WHERE NombreProducto = 'Camisa Clásica');

DECLARE @TallaS INT = (SELECT TallaID FROM Tallas WHERE NombreTalla = 'S');
DECLARE @TallaM INT = (SELECT TallaID FROM Tallas WHERE NombreTalla = 'M');
DECLARE @TallaL INT = (SELECT TallaID FROM Tallas WHERE NombreTalla = 'L');
DECLARE @TallaXL INT = (SELECT TallaID FROM Tallas WHERE NombreTalla = 'XL');

-- Camiseta Blanca (Stock total: 32)
IF NOT EXISTS (SELECT * FROM ProductoTallas WHERE ProductoID = @CamisetaID AND TallaID = @TallaS)
    INSERT INTO ProductoTallas (ProductoID, TallaID, Stock) VALUES (@CamisetaID, @TallaS, 10);

IF NOT EXISTS (SELECT * FROM ProductoTallas WHERE ProductoID = @CamisetaID AND TallaID = @TallaM)
    INSERT INTO ProductoTallas (ProductoID, TallaID, Stock) VALUES (@CamisetaID, @TallaM, 15);

IF NOT EXISTS (SELECT * FROM ProductoTallas WHERE ProductoID = @CamisetaID AND TallaID = @TallaL)
    INSERT INTO ProductoTallas (ProductoID, TallaID, Stock) VALUES (@CamisetaID, @TallaL, 5);

IF NOT EXISTS (SELECT * FROM ProductoTallas WHERE ProductoID = @CamisetaID AND TallaID = @TallaXL)
    INSERT INTO ProductoTallas (ProductoID, TallaID, Stock) VALUES (@CamisetaID, @TallaXL, 2);

-- Pantalón Beige (Stock total: 20)
IF NOT EXISTS (SELECT * FROM ProductoTallas WHERE ProductoID = @PantalonID AND TallaID = @TallaM)
    INSERT INTO ProductoTallas (ProductoID, TallaID, Stock) VALUES (@PantalonID, @TallaM, 10);

IF NOT EXISTS (SELECT * FROM ProductoTallas WHERE ProductoID = @PantalonID AND TallaID = @TallaL)
    INSERT INTO ProductoTallas (ProductoID, TallaID, Stock) VALUES (@PantalonID, @TallaL, 10);

-- Traje Azul (Stock total: 20)
IF NOT EXISTS (SELECT * FROM ProductoTallas WHERE ProductoID = @TrajeID AND TallaID = @TallaS)
    INSERT INTO ProductoTallas (ProductoID, TallaID, Stock) VALUES (@TrajeID, @TallaS, 5);

IF NOT EXISTS (SELECT * FROM ProductoTallas WHERE ProductoID = @TrajeID AND TallaID = @TallaM)
    INSERT INTO ProductoTallas (ProductoID, TallaID, Stock) VALUES (@TrajeID, @TallaM, 5);

IF NOT EXISTS (SELECT * FROM ProductoTallas WHERE ProductoID = @TrajeID AND TallaID = @TallaL)
    INSERT INTO ProductoTallas (ProductoID, TallaID, Stock) VALUES (@TrajeID, @TallaL, 5);

IF NOT EXISTS (SELECT * FROM ProductoTallas WHERE ProductoID = @TrajeID AND TallaID = @TallaXL)
    INSERT INTO ProductoTallas (ProductoID, TallaID, Stock) VALUES (@TrajeID, @TallaXL, 5);

-- Camisa Clásica (Stock total: 24)
IF NOT EXISTS (SELECT * FROM ProductoTallas WHERE ProductoID = @CamisaID AND TallaID = @TallaS)
    INSERT INTO ProductoTallas (ProductoID, TallaID, Stock) VALUES (@CamisaID, @TallaS, 8);

IF NOT EXISTS (SELECT * FROM ProductoTallas WHERE ProductoID = @CamisaID AND TallaID = @TallaM)
    INSERT INTO ProductoTallas (ProductoID, TallaID, Stock) VALUES (@CamisaID, @TallaM, 8);

IF NOT EXISTS (SELECT * FROM ProductoTallas WHERE ProductoID = @CamisaID AND TallaID = @TallaL)
    INSERT INTO ProductoTallas (ProductoID, TallaID, Stock) VALUES (@CamisaID, @TallaL, 8);

-- 5) VERIFICAR QUE LOS DATOS SE INSERTARON CORRECTAMENTE
PRINT '=== VERIFICACIÓN DE DATOS INSERTADOS ===';

PRINT 'Banners del carrusel:';
SELECT * FROM Carrusel ORDER BY Orden;

PRINT 'Tallas disponibles:';
SELECT * FROM Tallas ORDER BY TallaID;

PRINT 'Productos:';
SELECT ProductoID, NombreProducto, Precio, Stock, Imagen FROM Productos ORDER BY ProductoID;

PRINT 'Stock por talla:';
SELECT 
    p.NombreProducto,
    t.NombreTalla,
    pt.Stock
FROM ProductoTallas pt
JOIN Productos p ON pt.ProductoID = p.ProductoID
JOIN Tallas t ON pt.TallaID = t.TallaID
ORDER BY p.ProductoID, t.TallaID;

PRINT '=== FIN DE VERIFICACIÓN ===';
GO 