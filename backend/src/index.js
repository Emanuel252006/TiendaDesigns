import app from "./app.js";
import { connectBD } from "./db.js";

// Inicializar servicios
import './services/emailService.js';
import './services/pdfService.js';

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server corriendo en 0.0.0.0:${PORT} [${NODE_ENV}]`);

  connectBD()
    .then(() => {
      console.log('✅ Base de datos inicializada correctamente');
    })
    .catch((err) => {
      console.error('❌ Error al conectar/inicializar la base de datos:', err);
    });
});