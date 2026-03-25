import app from "./app.js";
import { connectBD } from "./db.js";

// Inicializar servicios
import "./services/emailService.js";
import "./services/pdfService.js";

function parsePort() {
  const raw = process.env.PORT;
  if (raw === undefined || raw === "") {
    return 3001;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1 || n > 65535) {
    console.error("❌ PORT inválido:", raw);
    process.exit(1);
  }
  return n;
}

const PORT = parsePort();
const NODE_ENV = process.env.NODE_ENV || "development";

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ unhandledRejection:", reason, promise);
});
process.on("uncaughtException", (err) => {
  console.error("❌ uncaughtException:", err);
  process.exit(1);
});

console.log("[boot] NODE_ENV=", NODE_ENV, "PORT=", PORT, "RAILWAY_ENVIRONMENT=", process.env.RAILWAY_ENVIRONMENT ?? "(n/a)");

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ HTTP escuchando en 0.0.0.0:${PORT} [${NODE_ENV}] pid=${process.pid}`);
  // Evita 502 por cierre prematuro de conexiones detrás del proxy de Railway
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  connectBD()
    .then(() => {
      console.log("✅ Base de datos inicializada correctamente");
    })
    .catch((err) => {
      console.error("❌ Error al conectar/inicializar la base de datos:", err);
    });
});
