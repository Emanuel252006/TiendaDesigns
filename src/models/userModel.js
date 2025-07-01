import { getPool } from "../db.js"; // Importamos correctamente la función getPool
import sql from 'mssql'; // Necesitamos importar 'mssql' para los tipos de datos
import bcrypt from 'bcryptjs'; // Asegúrate de tener bcryptjs importado para el hashing

/**
 * Busca un usuario por su nombre de usuario o ID en la base de datos.
 * @param {string} Nombre_Usuario - El nombre de usuario a buscar.
 * @param {string} Id_usuario - El ID de usuario a buscar.
 * @returns {Promise<Array>} Un array con los usuarios encontrados.
 */
export const findUserByUsernameOrId = async (Nombre_Usuario, Id_usuario) => {
    try {
        const pool = await getPool(); // Obtenemos el pool de conexión
        const request = pool.request();
        request.input('Nombre_Usuario', sql.NVarChar, Nombre_Usuario);
        // Es crucial que el tipo de dato de Id_usuario coincida con el de la base de datos (INT)
        request.input('Id_usuario', sql.Int, Id_usuario); 
        const result = await request.query(
            'SELECT * FROM Usuarios WHERE NombreUsuario = @Nombre_Usuario OR UsuarioID = @Id_usuario'
        );
        return result.recordset; // Los resultados de mssql están en .recordset
    } catch (error) {
        console.error('Error in findUserByUsernameOrId:', error);
        throw error;
    }
};

export const insertAddress = async (UsuarioID, address) => {
    try {
        const { Direccion, Ciudad, Pais, CodigoPostal } = address;
        const pool = await getPool();
        const request = pool.request();

        request.input("UsuarioID", sql.Int, UsuarioID);
        request.input("Direccion", sql.NVarChar(255), Direccion);
        request.input("Ciudad", sql.NVarChar(100), Ciudad);
        request.input("Pais", sql.NVarChar(100), Pais);
        request.input("CodigoPostal", sql.NVarChar(20), CodigoPostal);

        const result = await request.query(`
            INSERT INTO Direcciones (UsuarioID, Direccion, Ciudad, Pais, CodigoPostal)
            OUTPUT INSERTED.DireccionID
            VALUES (@UsuarioID, @Direccion, @Ciudad, @Pais, @CodigoPostal);
        `);

        console.log("✔ Dirección insertada:", result.recordset);
        return result.recordset.length > 0 ? result.recordset[0] : null;
    } catch (error) {
        console.error("❌ Error en insertAddress:", error.message);
        throw error;
    }
};


export const insertUserWithAddress = async (user, address) => {
    let transaction;
    try {
        const { NombreUsuario, Contrasena, Correo, Rol } = user;
        const pool = await getPool();
       
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        const request = new sql.Request(transaction);

        
        const passwordHash = await bcrypt.hash(Contrasena, 10); 

        request.input("NombreUsuario", sql.NVarChar(100), NombreUsuario);
        request.input("Contrasena", sql.NVarChar(255), passwordHash); 
        request.input("Correo", sql.NVarChar(100), Correo);
        request.input("Rol", sql.NVarChar(50), Rol);

        const userResult = await request.query(`
            INSERT INTO Usuarios (NombreUsuario, Contrasena, Correo, Rol)
            OUTPUT INSERTED.UsuarioID
            VALUES (@NombreUsuario, @Contrasena, @Correo, @Rol);
        `);

        if (userResult.recordset.length === 0) {
            throw new Error("No se pudo obtener el UsuarioID después de la inserción.");
        }

        const newUserId = userResult.recordset[0].UsuarioID;
        console.log("✔ Usuario insertado con ID:", newUserId);

       
        const addressRequest = new sql.Request(transaction); 
        addressRequest.input("UsuarioID", sql.Int, newUserId);
        addressRequest.input("Direccion", sql.NVarChar(255), address.Direccion);
        addressRequest.input("Ciudad", sql.NVarChar(100), address.Ciudad);
        addressRequest.input("Pais", sql.NVarChar(100), address.Pais);
        addressRequest.input("CodigoPostal", sql.NVarChar(20), address.CodigoPostal);

        const addressResult = await addressRequest.query(`
            INSERT INTO Direcciones (UsuarioID, Direccion, Ciudad, Pais, CodigoPostal)
            OUTPUT INSERTED.DireccionID
            VALUES (@UsuarioID, @Direccion, @Ciudad, @Pais, @CodigoPostal);
        `);

        if (addressResult.recordset.length === 0) {
            throw new Error("No se pudo obtener el DireccionID después de la inserción de la dirección.");
        }

        const newAddressId = addressResult.recordset[0].DireccionID;
        console.log("✔ Dirección insertada con ID:", newAddressId);

        await transaction.commit(); 

        return { 
            UsuarioID: newUserId, 
            DireccionID: newAddressId, 
            ...user,
            ...address 
        };

    } catch (error) {
        if (transaction) {
            await transaction.rollback(); 
            console.error("❌ Transacción revertida debido a un error.");
        }
        console.error("❌ Error en insertUserWithAddress:", error.message);
        throw error;
    }
};


export const getAllUsers = async () => {
    try {
        const pool = await getPool();
        const request = pool.request();
       
        const result = await request.query(`
            SELECT 
                U.UsuarioID, 
                U.NombreUsuario, 
                U.Correo, 
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
        return result.recordset;
    } catch (error) {
        console.error('Error in getAllUsers:', error);
        throw error;
    }
};


export const getUserById = async (id) => {
    try {
        const pool = await getPool();
        const request = pool.request();
        request.input('id', sql.Int, id); 
        const result = await request.query(`
            SELECT 
                U.UsuarioID, 
                U.NombreUsuario, 
                U.Correo, 
                U.FechaRegistro, 
                U.Rol,
                D.DireccionID,
                D.Direccion,
                D.Ciudad,
                D.Pais,
                D.CodigoPostal
            FROM Usuarios U
            LEFT JOIN Direcciones D ON U.UsuarioID = D.UsuarioID
            WHERE U.UsuarioID = @id
        `);
        return result.recordset;
    } catch (error) {
        console.error('Error in getUserById:', error);
        throw error;
    }
};


export const updateUserById = async (id, userFields, addressFields, plainPassword) => {
    let transaction;
    try {
        const pool = await getPool();
        transaction = new sql.Transaction(pool);
        await transaction.begin();
        const request = new sql.Request(transaction);

        let userUpdateClauses = [];
        if (userFields.NombreUsuario !== undefined) {
            userUpdateClauses.push('NombreUsuario = @NombreUsuario');
            request.input('NombreUsuario', sql.NVarChar, userFields.NombreUsuario);
        }
        if (userFields.Correo !== undefined) {
            userUpdateClauses.push('Correo = @Correo');
            request.input('Correo', sql.NVarChar, userFields.Correo);
        }
        if (userFields.Rol !== undefined) {
            userUpdateClauses.push('Rol = @Rol');
            request.input('Rol', sql.NVarChar, userFields.Rol);
        }
        if (plainPassword) { // Si se proporciona una nueva contraseña
            const passwordHash = await bcrypt.hash(plainPassword, 10);
            userUpdateClauses.push('Contrasena = @passwordHash');
            request.input('passwordHash', sql.NVarChar(255), passwordHash);
        }

        let rowsAffectedUser = 0;
        if (userUpdateClauses.length > 0) {
            const userQuery = `UPDATE Usuarios SET ${userUpdateClauses.join(', ')} WHERE UsuarioID = @id`;
            request.input('id', sql.Int, id); 
            const userResult = await request.query(userQuery);
            rowsAffectedUser = userResult.rowsAffected[0];
            console.log(`Usuario con ID ${id} actualizado. Filas afectadas: ${rowsAffectedUser}`);
        } else {
            console.warn('No se proporcionaron campos para actualizar el usuario.');
        }

        let rowsAffectedAddress = 0;
        if (addressFields && Object.keys(addressFields).length > 0) {
            const addressRequest = new sql.Request(transaction);
            addressRequest.input('UsuarioID_Addr', sql.Int, id); // Usamos un nombre diferente para evitar conflictos de parámetros

            let addressUpdateClauses = [];
            if (addressFields.Direccion !== undefined) {
                addressUpdateClauses.push('Direccion = @Direccion');
                addressRequest.input('Direccion', sql.NVarChar(255), addressFields.Direccion);
            }
            if (addressFields.Ciudad !== undefined) {
                addressUpdateClauses.push('Ciudad = @Ciudad');
                addressRequest.input('Ciudad', sql.NVarChar(100), addressFields.Ciudad);
            }
            if (addressFields.Pais !== undefined) {
                addressUpdateClauses.push('Pais = @Pais');
                addressRequest.input('Pais', sql.NVarChar(100), addressFields.Pais);
            }
            if (addressFields.CodigoPostal !== undefined) {
                addressUpdateClauses.push('CodigoPostal = @CodigoPostal');
                addressRequest.input('CodigoPostal', sql.NVarChar(20), addressFields.CodigoPostal);
            }

            if (addressUpdateClauses.length > 0) {
                // Primero, verifica si el usuario ya tiene una dirección. Si no, inserta. Si sí, actualiza.
                const { recordset: existingAddress } = await addressRequest.query('SELECT DireccionID FROM Direcciones WHERE UsuarioID = @UsuarioID_Addr');

                if (existingAddress.length > 0) {
                    const addressQuery = `UPDATE Direcciones SET ${addressUpdateClauses.join(', ')} WHERE UsuarioID = @UsuarioID_Addr`;
                    const addressResult = await addressRequest.query(addressQuery);
                    rowsAffectedAddress = addressResult.rowsAffected[0];
                    console.log(`Dirección del usuario con ID ${id} actualizada. Filas afectadas: ${rowsAffectedAddress}`);
                } else {
                    // Si no hay una dirección existente, insertamos una nueva
                    console.log(`No se encontró dirección para el usuario ${id}. Insertando nueva dirección.`);
                    const newAddress = await insertAddress(id, addressFields);
                    if (newAddress) {
                        rowsAffectedAddress = 1; // Consideramos una fila afectada por la inserción
                    }
                }
            } else {
                console.warn('No se proporcionaron campos para actualizar la dirección.');
            }
        }

        await transaction.commit(); 

        return { 
            rowsAffected: [rowsAffectedUser + rowsAffectedAddress], 
            rowsAffectedUser: rowsAffectedUser,
            rowsAffectedAddress: rowsAffectedAddress
        };
    } catch (error) {
        if (transaction) {
            await transaction.rollback(); 
            console.error("❌ Transacción de actualización revertida debido a un error.");
        }
        console.error('Error in updateUserById:', error);
        throw error;
    }
};


export const deleteUserById = async (id) => {
    let transaction;
    try {
        const pool = await getPool();
        transaction = new sql.Transaction(pool);
        await transaction.begin();
        const request = new sql.Request(transaction);

      
        const deleteAddressesResult = await request.input('id_addr', sql.Int, id)
                                                .query("DELETE FROM Direcciones WHERE UsuarioID = @id_addr");
        console.log(`Direcciones eliminadas para UsuarioID ${id}. Filas afectadas: ${deleteAddressesResult.rowsAffected[0]}`);
        
       
        const deleteUserResult = await request.input('id_user', sql.Int, id)
                                            .query("DELETE FROM Usuarios WHERE UsuarioID = @id_user");
        console.log(`Usuario con ID ${id} eliminado. Filas afectadas: ${deleteUserResult.rowsAffected[0]}`);

        await transaction.commit(); 

        return {
            rowsAffected: [deleteUserResult.rowsAffected[0] + deleteAddressesResult.rowsAffected[0]]
        };
    } catch (error) {
        if (transaction) {
            await transaction.rollback(); // Revertir la transacción en caso de error
            console.error("❌ Transacción de eliminación revertida debido a un error.");
        }
        console.error('Error in deleteUserById:', error);
        throw error;
    }
};

export const findUserByUsername = async (Nombre_Usuario) => {
    try {
        const pool = await getPool();
        const request = pool.request();
        request.input('Nombre_Usuario', sql.NVarChar, Nombre_Usuario);
        const result = await request.query('SELECT * FROM Usuarios WHERE NombreUsuario = @Nombre_Usuario');
        return result.recordset;
    } catch (error) {
        console.error('Error in findUserByUsername:', error);
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

export const findUserByEmail = async (email) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('Correo', sql.NVarChar(100), email)
            .query('SELECT UsuarioID, NombreUsuario, Contrasena, Correo, Rol FROM Usuarios WHERE Correo = @Correo');
        return result.recordset;
    } catch (error) {
        console.error('Error in findUserByEmail:', error);
        throw error;
    }
};