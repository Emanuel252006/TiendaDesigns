# Una sola instancia Railway: Express sirve API + frontend estático (mismo PORT).
# Ver backend/src/app.js (FRONTEND_DIST_DIR y fallback SPA).

FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-slim

WORKDIR /app

COPY package.json ./
COPY src ./src

COPY backend/package*.json ./backend/
RUN npm ci --omit=dev --prefix ./backend
COPY backend/ ./backend/

# Build de Vite: Express lo sirve desde /app/frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

ENV NODE_ENV=production

# Railway inyecta PORT en runtime; no fijar aqui para evitar desajustes con el proxy.
EXPOSE 3000

CMD ["node", "backend/src/index.js"]
