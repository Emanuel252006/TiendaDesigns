FROM node:20-slim

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

RUN npm install

# Copiar el resto del código
COPY . .

ENV NODE_ENV=production

RUN npm run build

# Servir los archivos estáticos con un servidor ligero
RUN npm install -g serve

EXPOSE 4173

CMD ["serve", "-s", "dist", "-l", "4173"]
