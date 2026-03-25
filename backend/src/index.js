import app from "./app.js";
import { connectBD } from "./db.js";
import { logInfo, logError } from "./logger.js";

// Inicializar servicios
import "./services/emailService.js";
import "./services/pdfService.js";

const rawPort = process.env.PORT;
const PORT = rawPort != null && rawPort !== "" ? Number(rawPort) : 3001;
const NODE_ENV = process.env.NODE_ENV || "development";

if (!Number.isFinite(PORT) || PORT <= 0) {
  logError("PORT invalido", { rawPort, parsed: PORT });
  process.exit(1);
}

process.on("unhandledRejection", (reason) => {
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

// Sin segundo argumento: Node elige interfaz (en Linux suele ser :: y acepta IPv4/IPv6 según el sistema).
// Forzar solo 0.0.0.0 puede dejar fuera el tráfico del proxy de Railway → 502.
const server = app.listen(PORT, () => {
  const addr = server.address();
  logInfo("http_listening", { address: addr });
  console.log(
    `✅ HTTP escuchando [${NODE_ENV}] pid=${process.pid} address=${JSON.stringify(addr)}`
  );

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

server.on("error", (err) => {
  logError("listen_fatal", { code: err.code, message: err.message });
  process.exit(1);
});

process.once("SIGTERM", () => {
  logInfo("sigterm", { uptime: process.uptime() });
  server.close(() => {
    logInfo("http_closed");
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 25_000).unref();
});
