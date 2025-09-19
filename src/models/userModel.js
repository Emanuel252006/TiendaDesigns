import { getPool } from "../db.js"; // Importamos correctamente la función getPool
import bcrypt from 'bcryptjs'; // Asegúrate de tener bcryptjs importado para el hashing
import jwt from 'jsonwebtoken'; // Importamos jsonwebtoken para manejar tokens JWT

/**
 * Busca un usuario por su nombre de usuario o ID en la base de datos.
 * @param {string} Nombre_Usuario - El nombre de usuario a buscar.
 * @param {string} Id_usuario - El ID de usuario a buscar.
 * @returns {Promise<Array>} Un array con los usuarios encontrados.
 */
export const findUserByUsernameOrId = async (Nombre_Usuario, Id_usuario) => {
    try {
        const pool = await getPool(); // Obtenemos el pool de conexión
        const [rows] = await pool.execute(
            'SELECT * FROM Usuarios WHERE NombreUsuario = ? OR UsuarioID = ?',
            [Nombre_Usuario, Id_usuario]
        );
        return rows; // Los resultados de mysql2 están en el primer elemento del array
    } catch (error) {
        console.error('Error in findUserByUsernameOrId:', error);
        throw error;
    }
};

export const insertAddress = async (UsuarioID, address) => {
    try {
        const { Direccion, Ciudad, Pais, CodigoPostal } = address;
        const pool = await getPool();
        
        const [result] = await pool.execute(`
            INSERT INTO Direcciones (UsuarioID, Direccion, Ciudad, Pais, CodigoPostal)
            VALUES (?, ?, ?, ?, ?)
        `, [UsuarioID, Direccion ?? null, Ciudad ?? null, Pais ?? null, CodigoPostal ?? null]);

        // Obtener el registro insertado
        const [rows] = await pool.execute("SELECT * FROM Direcciones WHERE DireccionID = ?", [result.insertId]);
        return rows[0] || null;
    } catch (error) {
        console.error("❌ Error en insertAddress:", error.message);
        throw error;
    }
};


export const insertUserWithAddress = async (user, address) => {
    let connection;
    try {
        const { NombreUsuario, Contrasena, Correo, Telefono, Rol } = user;
        const pool = await getPool();
       
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // La contraseña ya viene hasheada desde el controlador
        const [userResult] = await connection.execute(`
            INSERT INTO Usuarios (NombreUsuario, Contrasena, Correo, Telefono, Rol)
            VALUES (?, ?, ?, ?, ?)
        `, [NombreUsuario, Contrasena, Correo, Telefono || null, Rol]);

        const newUserId = userResult.insertId;

        const [addressResult] = await connection.execute(`
            INSERT INTO Direcciones (UsuarioID, Direccion, Ciudad, Pais, CodigoPostal)
            VALUES (?, ?, ?, ?, ?)
        `, [newUserId, address.Direccion, address.Ciudad, address.Pais, address.CodigoPostal]);

        const newAddressId = addressResult.insertId;

        await connection.commit(); 

        return { 
            UsuarioID: newUserId, 
            DireccionID: newAddressId, 
            ...user,
            ...address 
        };

    } catch (error) {
        if (connection) {
            await connection.rollback(); 
        }
        console.error("❌ Error en insertUserWithAddress:", error.message);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};


export const getAllUsers = async () => {
    try {
        const pool = await getPool();
        const [rows] = await pool.execute(`
            SELECT 
                U.UsuarioID, 
                U.NombreUsuario, 
                U.Contrasena,
                U.Correo, 
                U.Telefono,
                U.FechaRegistro, 
                U.Rol,
                D.DireccionID,
                D.Direccion,
                D.Ciudad,
                D.Pais,
                D.CodigoPostal
            FROM Usuarios U
            LEFT JOIN Direcciones D ON U.UsuarioID = D.UsuarioID
        `);
        return rows;
    } catch (error) {
        console.error('Error in getAllUsers:', error);
        throw error;
    }
};


export const getUserById = async (id) => {
    try {
        // Validar que el ID no sea undefined o null
        if (!id) {
            console.error('Error in getUserById: ID is undefined or null');
            return [];
        }
        
        const pool = await getPool();
        const [rows] = await pool.execute(`
            SELECT 
                U.UsuarioID, 
                U.NombreUsuario, 
                U.Contrasena,
                U.Correo, 
                U.Telefono,
                U.FechaRegistro, 
                U.Rol,
                D.DireccionID,
                D.Direccion,
                D.Ciudad,
                D.Pais,
                D.CodigoPostal
            FROM Usuarios U
            LEFT JOIN Direcciones D ON U.UsuarioID = D.UsuarioID
            WHERE U.UsuarioID = ?
        `, [id]);
        return rows;
    } catch (error) {
        console.error('Error in getUserById:', error);
        throw error;
    }
};


export const updateUserById = async (id, userFields, addressFields, plainPassword) => {
    let connection;
    try {
        const pool = await getPool();
        connection = await pool.getConnection();
        await connection.beginTransaction();

        let userUpdateClauses = [];
        let userParams = [];
        
        if (userFields.NombreUsuario !== undefined) {
            userUpdateClauses.push('NombreUsuario = ?');
            userParams.push(userFields.NombreUsuario);
        }
        if (userFields.Correo !== undefined) {
            userUpdateClauses.push('Correo = ?');
            userParams.push(userFields.Correo);
        }
        if (userFields.Telefono !== undefined) {
            userUpdateClauses.push('Telefono = ?');
            userParams.push(userFields.Telefono);
        }
        if (userFields.Rol !== undefined) {
            userUpdateClauses.push('Rol = ?');
            userParams.push(userFields.Rol);
        }
        if (plainPassword) { // Si se proporciona una nueva contraseña
            const passwordHash = await bcrypt.hash(plainPassword, 10);
            userUpdateClauses.push('Contrasena = ?');
            userParams.push(passwordHash);
        }

        let rowsAffectedUser = 0;
        if (userUpdateClauses.length > 0) {
            const userQuery = `UPDATE Usuarios SET ${userUpdateClauses.join(', ')} WHERE UsuarioID = ?`;
            userParams.push(id);
            const [userResult] = await connection.execute(userQuery, userParams);
            rowsAffectedUser = userResult.affectedRows;
        }

        let rowsAffectedAddress = 0;
        if (addressFields && Object.keys(addressFields).length > 0) {
            let addressUpdateClauses = [];
            let addressParams = [];
            
            if (addressFields.Direccion !== undefined) {
                addressUpdateClauses.push('Direccion = ?');
                addressParams.push(addressFields.Direccion);
            }
            if (addressFields.Ciudad !== undefined) {
                addressUpdateClauses.push('Ciudad = ?');
                addressParams.push(addressFields.Ciudad);
            }
            if (addressFields.Pais !== undefined) {
                addressUpdateClauses.push('Pais = ?');
                addressParams.push(addressFields.Pais);
            }
            if (addressFields.CodigoPostal !== undefined) {
                addressUpdateClauses.push('CodigoPostal = ?');
                addressParams.push(addressFields.CodigoPostal);
            }

            if (addressUpdateClauses.length > 0) {
                // Primero, verifica si el usuario ya tiene una dirección. Si no, inserta. Si sí, actualiza.
                const [existingAddress] = await connection.execute('SELECT DireccionID FROM Direcciones WHERE UsuarioID = ?', [id]);

                if (existingAddress.length > 0) {
                    const addressQuery = `UPDATE Direcciones SET ${addressUpdateClauses.join(', ')} WHERE UsuarioID = ?`;
                    addressParams.push(id);
                    const [addressResult] = await connection.execute(addressQuery, addressParams);
                    rowsAffectedAddress = addressResult.affectedRows;
                } else {
                    // Si no hay una dirección existente, insertamos una nueva
                    const newAddress = await insertAddress(id, addressFields);
                    if (newAddress) {
                        rowsAffectedAddress = 1; // Consideramos una fila afectada por la inserción
                    }
                }
            }
        }

        await connection.commit(); 

        return { 
            rowsAffected: [rowsAffectedUser + rowsAffectedAddress], 
            rowsAffectedUser: rowsAffectedUser,
            rowsAffectedAddress: rowsAffectedAddress
        };
    } catch (error) {
        if (connection) {
            await connection.rollback(); 
        }
        console.error('Error in updateUserById:', error);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};


export const deleteUserById = async (id) => {
    let connection;
    try {
        const pool = await getPool();
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Eliminar direcciones primero
        const [deleteAddressesResult] = await connection.execute(
            "DELETE FROM Direcciones WHERE UsuarioID = ?", 
            [id]
        );
        
        // Eliminar usuario
        const [deleteUserResult] = await connection.execute(
            "DELETE FROM Usuarios WHERE UsuarioID = ?", 
            [id]
        );

        await connection.commit(); 

        return {
            rowsAffected: [deleteUserResult.affectedRows + deleteAddressesResult.affectedRows]
        };
    } catch (error) {
        if (connection) {
            await connection.rollback(); // Revertir la transacción en caso de error
        }
        console.error('Error in deleteUserById:', error);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

export const findUserByUsername = async (Nombre_Usuario) => {
    try {
        const pool = await getPool();
        const [rows] = await pool.execute('SELECT * FROM Usuarios WHERE NombreUsuario = ?', [Nombre_Usuario]);
        return rows;
    } catch (error) {
        console.error('Error in findUserByUsername:', error);
        throw error;
    }
};



export const findUserByEmail = async (email) => {
    try {
        const pool = await getPool();
        const [rows] = await pool.execute(
            'SELECT UsuarioID, NombreUsuario, Contrasena, Correo, Rol FROM Usuarios WHERE Correo = ?', 
            [email]
        );
        return rows;
    } catch (error) {
        console.error('Error in findUserByEmail:', error);
        throw error;
    }
};

// Función para obtener usuarios activos (con sesión activa en las últimas 30 minutos, excluyendo admins)
export const getActiveUsers = async () => {
    try {
        const pool = await getPool();
        const [rows] = await pool.execute(`
            SELECT COUNT(*) as UsuariosActivos
            FROM Usuarios
            WHERE UltimaActividad >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 MINUTE)
            AND Rol != 'Admin'
        `);
        return rows[0]?.UsuariosActivos || 0;
    } catch (error) {
        console.error('Error in getActiveUsers:', error);
        throw error;
    }
};

// Función para actualizar la última actividad del usuario
export const updateUserActivity = async (UsuarioID) => {
    try {
        const pool = await getPool();
        const [result] = await pool.execute(
            `UPDATE Usuarios SET UltimaActividad = CURRENT_TIMESTAMP WHERE UsuarioID = ?`,
            [UsuarioID]
        );
        console.log('✅ Actividad actualizada para usuario:', UsuarioID);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('❌ Error actualizando actividad:', error);
        return false;
    }
};

// Marcar usuario como inactivo inmediatamente (al cerrar sesión)
export const setUserInactive = async (UsuarioID) => {
    try {
        console.log('🔍 setUserInactive ejecutándose para usuario:', UsuarioID);
        const pool = await getPool();

        // Primero verificar el valor actual
        const [checkRows] = await pool.execute(
            `SELECT UltimaActividad FROM Usuarios WHERE UsuarioID = ?`,
            [UsuarioID]
        );
        console.log('📊 UltimaActividad antes del cambio:', checkRows[0]?.UltimaActividad);

        const [result] = await pool.execute(
            `UPDATE Usuarios 
             SET UltimaActividad = DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 61 MINUTE)
             WHERE UsuarioID = ?`,
            [UsuarioID]
        );

        console.log('✅ Usuario marcado inactivo (logout):', UsuarioID);
        console.log('📊 Filas afectadas:', result.affectedRows);

        // Verificar el valor después del cambio
        const [afterRows] = await pool.execute(
            `SELECT UltimaActividad FROM Usuarios WHERE UsuarioID = ?`,
            [UsuarioID]
        );
        console.log('📊 UltimaActividad después del cambio:', afterRows[0]?.UltimaActividad);

        return result.affectedRows > 0;
    } catch (error) {
        console.error('❌ Error marcando usuario inactivo:', error);
        return false;
    }
};

// Marcar TODOS los usuarios logueados como activos (heartbeat global)
export const markAllLoggedUsersAsActive = async () => {
    try {
        const pool = await getPool();
        const [result] = await pool.execute(`
            UPDATE Usuarios 
            SET UltimaActividad = CURRENT_TIMESTAMP
            WHERE UltimaActividad > DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 MINUTE)
            AND UltimaActividad > FechaRegistro
            AND Rol != 'Admin'
        `);
        return result.affectedRows;
    } catch (error) {
        console.error('❌ Error en heartbeat global:', error);
        throw error;
    }
};

// Función para obtener usuarios con carritos activos
export const getUsersWithActiveCarts = async () => {
    try {
        const pool = await getPool();
        
        // Consulta principal para obtener usuarios con carritos activos (excluyendo admins)
        const [rows] = await pool.execute(`
            SELECT 
                U.UsuarioID,
                U.NombreUsuario,
                U.Correo,
                U.FechaRegistro,
                C.CarritoID,
                C.FechaCreacion as FechaCarrito,
                COALESCE(COUNT(CA.CarritoArticuloID), 0) as ItemsEnCarrito
            FROM Usuarios U
            INNER JOIN Carritos C ON U.UsuarioID = C.UsuarioID
            LEFT JOIN CarritoArticulos CA ON C.CarritoID = CA.CarritoID
            WHERE U.Rol != 'Admin'
            GROUP BY U.UsuarioID, U.NombreUsuario, U.Correo, U.FechaRegistro, C.CarritoID, C.FechaCreacion
            HAVING COALESCE(COUNT(CA.CarritoArticuloID), 0) > 0
            ORDER BY C.FechaCreacion DESC
        `);
        
        return rows;
    } catch (error) {
        console.error('Error in getUsersWithActiveCarts:', error);
        throw error;
    }
};

// Función para obtener distribución de usuarios por país
export const getUsersByCountry = async () => {
    try {
        const pool = await getPool();
        
        // Usar una subconsulta para obtener la dirección más reciente de cada usuario
        const [rows] = await pool.execute(`
            SELECT 
                COALESCE(D.Pais, 'Sin país registrado') as Pais,
                COUNT(U.UsuarioID) as CantidadUsuarios
            FROM Usuarios U
            LEFT JOIN (
                SELECT DISTINCT 
                    UsuarioID,
                    Pais,
                    ROW_NUMBER() OVER (PARTITION BY UsuarioID ORDER BY DireccionID DESC) as rn
                FROM Direcciones
            ) D ON U.UsuarioID = D.UsuarioID AND D.rn = 1
            WHERE U.Rol != 'Admin'
            GROUP BY D.Pais
            ORDER BY CantidadUsuarios DESC
        `);
        return rows;
    } catch (error) {
        console.error('Error in getUsersByCountry:', error);
        throw error;
    }
};

// Función para obtener estadísticas generales de usuarios
export const getUserStats = async () => {
    try {
        const pool = await getPool();
        const [rows] = await pool.execute(`
            SELECT 
                COUNT(CASE WHEN Rol != 'Admin' THEN 1 END) as TotalUsuarios,
                COUNT(CASE 
                    WHEN UltimaActividad >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 MINUTE) 
                    AND Rol != 'Admin' 
                    AND UltimaActividad > FechaRegistro
                    THEN 1 
                END) as UsuariosActivos,
                COUNT(CASE 
                    WHEN FechaRegistro >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) 
                    AND FechaRegistro < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY)
                    AND Rol != 'Admin'
                    THEN 1 
                END) as UsuariosEstaSemana,
                COUNT(CASE 
                    WHEN FechaRegistro >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
                    AND FechaRegistro < DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
                    AND Rol != 'Admin'
                    THEN 1 
                END) as UsuariosEsteMes
            FROM Usuarios
        `);
        return rows[0];
    } catch (error) {
        console.error('Error in getUserStats:', error);
        throw error;
    }
};

// Función para limpiar direcciones duplicadas (ejecutar una sola vez)
export const cleanDuplicateAddresses = async () => {
    try {
        const pool = await getPool();
        
        // Primero, contar cuántas direcciones duplicadas hay
        const [countBefore] = await pool.execute(`
            SELECT COUNT(*) as total FROM Direcciones
        `);
        
        // Eliminar direcciones duplicadas, manteniendo solo la más reciente por usuario
        const [result] = await pool.execute(`
            DELETE d1 FROM Direcciones d1
            INNER JOIN Direcciones d2 
            WHERE d1.UsuarioID = d2.UsuarioID 
            AND d1.DireccionID < d2.DireccionID
        `);
        
        // Contar después de la limpieza
        const [countAfter] = await pool.execute(`
            SELECT COUNT(*) as total FROM Direcciones
        `);
        
        const duplicatesRemoved = countBefore[0].total - countAfter[0].total;
        
        console.log(`✅ Direcciones duplicadas limpiadas: ${duplicatesRemoved} registros eliminados`);
        console.log(`📊 Direcciones antes: ${countBefore[0].total}, después: ${countAfter[0].total}`);
        
        return {
            duplicatesRemoved,
            totalBefore: countBefore[0].total,
            totalAfter: countAfter[0].total
        };
    } catch (error) {
        console.error('Error limpiando direcciones duplicadas:', error);
        throw error;
    }
};

export const verifyToken = async (req, res) => {
    const { token } = req.cookies;

    if (!token) {
        return res.status(401).json({ message: "No se proporcionó token de autenticación." });
    }

    try {
        jwt.verify(token, TOKEN_SECRET, async (err, decodedTokenPayload) => { 
            if (err) {
                return res.status(403).json({ message: "Token de autenticación inválido o expirado." });
            }

            const result = await getUserById(decodedTokenPayload.id); 

            if (result.length === 0) {
                return res.status(401).json({ message: "Usuario asociado al token no encontrado." });
            }

            const userFound = result[0];

            return res.json({
                valid: true,
                UsuarioID: userFound.UsuarioID,
                NombreUsuario: userFound.NombreUsuario,
                Correo: userFound.Correo,
                Rol: userFound.Rol,
                DireccionID: userFound.DireccionID,
                Direccion: userFound.Direccion,
                Ciudad: userFound.Ciudad,
                Pais: userFound.Pais,
                CodigoPostal: userFound.CodigoPostal,
            });
        });
    } catch (error) {
        console.error("Error en verifyToken:", error);
        res.status(500).json({ message: "Error interno del servidor al verificar el token." });
    }
};