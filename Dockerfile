FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-slim

WORKDIR /app

# nginx + envsubst para usar el puerto dinamico de Railway
RUN apt-get update && apt-get install -y --no-install-recommends nginx gettext-base && rm -rf /var/lib/apt/lists/*

# Shim para Railway si el Start Command sigue siendo `node src/index.js`
COPY package.json ./
COPY src ./src

# Backend dependencies + source
COPY backend/package*.json ./backend/
RUN npm ci --omit=dev --prefix ./backend
COPY backend/ ./backend/

# Frontend compilado servido por nginx
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Configuracion y arranque
COPY infra/nginx.railway.template.conf /etc/nginx/templates/default.conf.template
COPY infra/start.sh /start.sh
RUN chmod +x /start.sh

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["/start.sh"]
