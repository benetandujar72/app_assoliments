# Usar Node.js 18 com a base
FROM node:18-alpine

# Establir directori de treball
WORKDIR /app

# Copiar package.json i package-lock.json
COPY package*.json ./

# Instal·lar dependències
RUN npm ci --only=production

# Copiar codi de l'aplicació
COPY . .

# Exposar port 3000
EXPOSE 3000

# Variable d'entorn per al port
ENV PORT=3000

# Comandament per executar l'aplicació
CMD ["npm", "start"] 