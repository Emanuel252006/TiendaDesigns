FROM node:20-slim

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm install --only=production

# Copiar el resto del código
COPY . .

ENV NODE_ENV=production

# Railway inyecta PORT, pero exponemos un valor por defecto
ENV PORT=3001

EXPOSE 3001

CMD ["npm", "start"]
