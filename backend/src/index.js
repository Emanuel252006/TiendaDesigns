import app from "./app.js";
import { connectBD } from "./db.js";
import { logInfo, logError } from "./logger.js";

// Inicializar servicios
import './services/emailService.js';
import './services/pdfService.js';

const rawPort = process.env.PORT;
const PORT = rawPort != null && rawPort !== "" ? Number(rawPort) : 3001;
const NODE_ENV = process.env.NODE_ENV || "development";

if (!Number.isFinite(PORT) || PORT <= 0) {
  logError("PORT invalido", { rawPort, parsed: PORT });
  process.exit(1);
}

process.on("unhandledRejection", (reason, promise) => {
  logError("unhandledRejection", {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

process.on("uncaughtException", (err) => {
  logError("uncaughtException", { message: err.message, stack: err.stack });
  process.exit(1);
});

logInfo("boot", {
  NODE_ENV,
  PORT,
  rawPort: rawPort ?? null,
  RAILWAY_PUBLIC_DOMAIN: process.env.RAILWAY_PUBLIC_DOMAIN ?? null,
  RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT ?? null,
});

const server = app.listen(PORT, "0.0.0.0", () => {
  logInfo("http_listening", {
    host: "0.0.0.0",
    port: PORT,
    address: server.address(),
  });
  console.log(`✅ Server corriendo en 0.0.0.0:${PORT} [${NODE_ENV}]`);

  connectBD()
    .then(() => {
      logInfo("db_ready");
      console.log("✅ Base de datos inicializada correctamente");
    })
    .catch((err) => {
      logError("db_init_failed", {
        message: err?.message,
        stack: err?.stack,
      });
      console.error("❌ Error al conectar/inicializar la base de datos:", err);
    });
});