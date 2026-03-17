# TiendaDesigns - Deploy en Railway (Backend + Frontend en una sola instancia)

Este proyecto queda configurado para desplegar Express (API) y React (Vite build) en un solo servicio de Railway.

## Como quedo configurado

- Backend en `src/index.js` (Express).
- Frontend compilado desde `vistas` y servido por Express en produccion (`vistas/dist`).
- Rutas API bajo `/api/*`.
- Archivos estaticos bajo `/images/*` e `/invoices/*`.
- Fallback SPA para rutas de React Router (por ejemplo `/tienda`, `/checkout`, etc.).

## Scripts de despliegue

En `package.json` raiz:

- `npm run build`: instala dependencias de `vistas` y compila frontend.
- `npm start`: levanta backend (`node src/index.js`).

Railway puede usar estos comandos automaticamente.

## Variables de entorno para Railway

Configura estas variables en el servicio de Railway:

### Obligatorias

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `FRONTEND_URL` (dominio permitido para CORS)
- `BACKEND_URL` (URL publica del backend, usada para callbacks como PayU)

### Recomendadas

- `NODE_ENV=production`
- `PORT` (Railway la inyecta automaticamente)
- `VITE_API_URL` (en misma instancia puedes dejarla vacia para usar mismo dominio)

### Email / Contacto

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `CONTACT_EMAIL`
- `CONTACT_PHONE` (opcional)

### PayU (opcional pero recomendado en produccion)

- `PAYU_API_LOGIN`
- `PAYU_API_KEY`
- `PAYU_MERCHANT_ID`
- `PAYU_ACCOUNT_ID`
- `PAYU_API_URL`

## Dominio via variables de entorno

### `FRONTEND_URL`

- Se usa en CORS del backend.
- Acepta un dominio o varios separados por coma.
- Ejemplo:
  - `FRONTEND_URL=https://miapp.up.railway.app`
  - `FRONTEND_URL=https://miapp.up.railway.app,https://www.midominio.com`

### `BACKEND_URL`

- Se usa para callbacks de backend (por ejemplo `confirmationUrl` de PayU).
- Ejemplo: `BACKEND_URL=https://miapp.up.railway.app`

### `VITE_API_URL`

- Si backend y frontend estan en el mismo dominio: dejar vacio.
- Si frontend consume API externa: define la URL completa del backend.

## Pasos de deploy en Railway

1. Crear un nuevo servicio desde este repositorio (raiz del proyecto).
2. Verificar que Railway use:
	- Build Command: `npm run build`
	- Start Command: `npm start`
3. Configurar variables del archivo `.env.example`.
4. Desplegar.
5. Abrir el dominio generado por Railway y probar:
	- Frontend: `/`
	- API: `/api/test` (o cualquier endpoint disponible)

## Local

1. Instalar dependencias raiz: `npm install`
2. Instalar dependencias frontend: `npm install --prefix vistas`
3. Ejecutar backend: `npm run dev`
4. Ejecutar frontend aparte (si quieres modo dev): `npm run dev --prefix vistas`

Puedes copiar `.env.example` a `.env` para trabajar localmente.
