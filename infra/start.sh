#!/bin/sh
set -eu

# Renderiza el puerto de Railway en el conf de nginx
envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Arranca backend en puerto interno fijo para reverse proxy
PORT=3001 node /app/backend/src/index.js &

# Nginx en foreground (proceso principal del contenedor)
nginx -g "daemon off;"
