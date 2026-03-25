/**
 * Logs en JSON para deploy (Railway) y filtrado en consola.
 */
export function logInfo(message, meta = {}) {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "info",
      message,
      ...meta,
    })
  );
}

export function logWarn(message, meta = {}) {
  console.warn(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "warn",
      message,
      ...meta,
    })
  );
}

export function logError(message, meta = {}) {
  console.error(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "error",
      message,
      ...meta,
    })
  );
}
