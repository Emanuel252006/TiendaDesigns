import app from "./app.js";
import { connectBD } from "./db.js";

// Inicializar servicios
import './services/emailService.js';
import './services/pdfService.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ Server corriendo en http://localhost:${PORT}`);

  connectBD()
    .then(() => {
      console.log('✅ Base de datos inicializada correctamente');
    })
    .catch((err) => {
      console.error('❌ Error al conectar/inicializar la base de datos:', err);
    });
});