# Usamos una versión ligera de Node.js
FROM node:18-alpine

# Instalamos curl para el healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./

# Instalamos solo dependencias de producción para ahorrar espacio
RUN npm install --only=production

# Copiamos el resto del código
COPY . .

# Exponemos el puerto que configuraste en tu app (8080 internamente)
EXPOSE 8080

# Comando para arrancar la app
CMD ["npm", "start"]