import app from "./app.js";
import { connectBD } from "./db.js"; 

connectBD().catch(err => console.error('Error al conectar a la base de datos:', err));

app.listen(5001, () => console.log('Server Corriendo en el puerto 5001'));
