# TiendaDesigns (Monorepo ordenado)

Estructura separada por responsabilidades:

- `backend/`: API Node.js/Express, base de datos, correo, pagos y archivos estaticos.
- `frontend/`: aplicacion React + Vite.
- `infra/`: configuraciones de infraestructura (docker compose y nginx).

## Estructura

```txt
TiendaDesigns/
  backend/
    src/
    images/
    invoices/
    package.json
    Dockerfile
    Procfile
    .env.example
  frontend/
    src/
    public/
    package.json
    Dockerfile
  infra/
    docker-compose.yml
    nginx.conf
```

## Comandos utiles (desde raiz)

- `npm run dev:backend`
- `npm run dev:frontend`
- `npm run build:frontend`
- `npm run start:backend`

## Deploy en Railway

### Opcion recomendada (dos servicios)

1. Servicio Backend:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
2. Servicio Frontend:
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npx serve -s dist -l $PORT`

### Opcion con Docker

- Backend: Railway usa `backend/Dockerfile`.
- Frontend: Railway usa `frontend/Dockerfile`.

## Variables de entorno

Usa `backend/.env.example` como plantilla de variables para Railway/local.
