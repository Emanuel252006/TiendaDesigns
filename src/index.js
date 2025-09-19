import app from "./app.js";
import { connectBD } from "./db.js";

// Inicializar servicios
import './services/emailService.js';
import './services/pdfService.js';


// Conecta a la base de datos antes de arrancar el servidor
connectBD()
  .then(() => {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () =>
      console.log(`✅ Server corriendo en http://localhost:${PORT}`)
    );
  })
  .catch((err) =>
    console.error("❌ Error al conectar a la base de datos:", err)
  );