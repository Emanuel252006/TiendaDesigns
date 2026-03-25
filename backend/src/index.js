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

// #region agent log
fetch('http://127.0.0.1:7244/ingest/de36ff69-006a-43b4-9c6a-abb74e0d808a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.js:40',message:'About to start server binding',data:{PORT,NODE_ENV},timestamp:Date.now(),runId:'debug',hypothesisId:'B'})}).catch(()=>{});
// #endregion

// Sin segundo argumento: Node elige interfaz (en Linux suele ser :: y acepta IPv4/IPv6 según el sistema).
// Forzar solo 0.0.0.0 puede dejar fuera el tráfico del proxy de Railway → 502.
const server = app.listen(PORT, () => {
  const addr = server.address();
  
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/de36ff69-006a-43b4-9c6a-abb74e0d808a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.js:45',message:'Server successfully bound to address',data:{address:addr,PORT,family:addr?.family},timestamp:Date.now(),runId:'debug',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
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

// Railway envia SIGTERM al sustituir una version (contenedor viejo): es normal ver "Stopping Container" en los logs del deploy.
process.once("SIGTERM", () => {
  logInfo("sigterm_graceful_shutdown", { uptime: process.uptime() });
  server.close(() => {
    logInfo("http_closed");
    process.exit(0);
  });
});
