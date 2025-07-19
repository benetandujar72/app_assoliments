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

# Crear script de inicialización amb actualització automàtica
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "🔌 Verificant connexió a la base de dades..."' >> /app/start.sh && \
    echo 'node -e "const { Pool } = require(\"pg\"); const pool = new Pool(); pool.query(\"SELECT 1\").then(() => { console.log(\"✅ Base de dades connectada\"); process.exit(0); }).catch(() => { console.log(\"⚠️  Base de dades no disponible, continuant...\"); process.exit(0); });"' >> /app/start.sh && \
    echo 'echo "🔄 Actualitzant base de dades per comparatives..."' >> /app/start.sh && \
    echo 'node scripts/docker-migrate.js || echo "⚠️ Error actualitzant BD, continuant..."' >> /app/start.sh && \
    echo 'echo "🚀 Iniciant aplicació..."' >> /app/start.sh && \
    echo 'npm start' >> /app/start.sh && \
    chmod +x /app/start.sh

# Comandament per executar l'aplicació amb inicialització
CMD ["/app/start.sh"] 