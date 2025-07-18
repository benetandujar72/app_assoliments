#!/bin/bash

# Script per iniciar l'aplicació amb Docker Compose

echo "🐳 Iniciant Dashboard d'Assoliments amb Docker..."

# Verificar si Docker està instal·lat
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no està instal·lat. Si us plau, instal·la Docker primer."
    exit 1
fi

# Verificar si Docker Compose està instal·lat
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no està instal·lat. Si us plau, instal·la Docker Compose primer."
    exit 1
fi

# Aturar i eliminar contenedors existents
echo "🛑 Aturant contenedors existents..."
docker-compose down

# Construir i iniciar els contenedors
echo "🔨 Construint i iniciant contenedors..."
docker-compose up --build -d

# Esperar que els serveis estiguin preparats
echo "⏳ Esperant que els serveis estiguin preparats..."
sleep 10

# Verificar l'estat dels contenedors
echo "📊 Estat dels contenedors:"
docker-compose ps

# Mostrar logs
echo "📋 Logs de l'aplicació:"
docker-compose logs app

echo ""
echo "✅ Dashboard d'Assoliments iniciat correctament!"
echo "🌐 Accedeix a: http://localhost:3000"
echo "🔧 Per veure els logs: docker-compose logs -f"
echo "🛑 Per aturar: docker-compose down" 