# 🐳 Dashboard d'Assoliments - Guia Docker

Aquest document explica com executar l'aplicació Dashboard d'Assoliments utilitzant Docker, tant localment com en producció a Render.com.

## 📋 Prerequisits

- [Docker](https://docs.docker.com/get-docker/) instal·lat
- [Docker Compose](https://docs.docker.com/compose/install/) instal·lat
- Git per clonar el repositori

## 🚀 Execució Local amb Docker

### Opció 1: Scripts automàtics

#### Windows
```bash
# Executar el script de Windows
scripts\start-docker.bat
```

#### Linux/macOS
```bash
# Donar permisos d'execució
chmod +x scripts/start-docker.sh

# Executar el script
./scripts/start-docker.sh
```

### Opció 2: Comandaments manuals

1. **Clonar el repositori**
```bash
git clone <url-del-repositori>
cd Grafica-assoliments
```

2. **Iniciar els serveis**
```bash
# Construir i iniciar els contenedors
docker-compose up --build -d
```

3. **Verificar l'estat**
```bash
# Veure l'estat dels contenedors
docker-compose ps

# Veure els logs
docker-compose logs -f app
```

4. **Accedir a l'aplicació**
   - Obre el navegador i visita: http://localhost:3000

## 🛑 Aturar l'aplicació

```bash
# Aturar els contenedors
docker-compose down

# Aturar i eliminar volums (elimina les dades de la BD)
docker-compose down -v
```

## 🔧 Comandaments útils

```bash
# Veure logs en temps real
docker-compose logs -f

# Veure logs d'un servei específic
docker-compose logs -f app
docker-compose logs -f postgres

# Entrar al contenedor de l'aplicació
docker-compose exec app sh

# Entrar a la base de dades PostgreSQL
docker-compose exec postgres psql -U postgres -d dashboard_assoliments

# Reiniciar un servei específic
docker-compose restart app

# Reconstruir un servei específic
docker-compose up --build app
```

## 🌐 Desplegament a Render.com

### Pas 1: Preparar el repositori

1. Assegura't que tots els fitxers Docker estan al repositori:
   - `Dockerfile`
   - `docker-compose.yml`
   - `render.yaml`
   - `init.sql`

2. Fes commit i push dels canvis:
```bash
git add .
git commit -m "Add Docker configuration"
git push origin main
```

### Pas 2: Configurar a Render

1. **Crear un compte a Render.com**

2. **Crear un nou Web Service**:
   - Connecta el teu repositori de GitHub
   - Selecciona el repositori del Dashboard d'Assoliments
   - Render detectarà automàticament que és una aplicació Node.js

3. **Configurar les variables d'entorn**:
   - `NODE_ENV`: `production`
   - `PORT`: `3000`
   - Les variables de base de dades es configuraran automàticament

4. **Crear la base de dades PostgreSQL**:
   - A Render, crea una nova PostgreSQL Database
   - Connecta-la amb el teu Web Service
   - Render configurará automàticament les variables d'entorn de la BD

### Pas 3: Desplegar

1. Render començarà automàticament el desplegament
2. El procés pot tardar uns minuts
3. Un cop completat, tindràs una URL pública per accedir a l'aplicació

## 📊 Estructura dels fitxers Docker

```
├── Dockerfile              # Configuració del contenedor de l'aplicació
├── docker-compose.yml      # Orquestració dels serveis locals
├── .dockerignore          # Fitxers a ignorar en el build
├── init.sql              # Script d'inicialització de la BD
├── render.yaml           # Configuració per Render.com
├── env.example           # Exemple de variables d'entorn
└── scripts/
    ├── start-docker.sh   # Script d'inici per Linux/macOS
    └── start-docker.bat  # Script d'inici per Windows
```

## 🔍 Troubleshooting

### Problemes comuns

1. **Port 3000 ja està en ús**:
```bash
# Canviar el port al docker-compose.yml
ports:
  - "3001:3000"  # Usar port 3001 localment
```

2. **Error de connexió a la base de dades**:
```bash
# Verificar que PostgreSQL està executant-se
docker-compose ps

# Veure logs de PostgreSQL
docker-compose logs postgres
```

3. **Problemes de permisos (Linux/macOS)**:
```bash
# Donar permisos al script
chmod +x scripts/start-docker.sh
```

4. **Eliminar tot i començar de nou**:
```bash
# Aturar i eliminar tot
docker-compose down -v
docker system prune -f
docker-compose up --build -d
```

### Logs i debugging

```bash
# Veure tots els logs
docker-compose logs

# Veure logs d'un servei específic
docker-compose logs app
docker-compose logs postgres

# Veure logs en temps real
docker-compose logs -f

# Entrar al contenedor per debugging
docker-compose exec app sh
```

## 📝 Notes importants

- **Dades persistents**: Les dades de PostgreSQL es guarden en un volum Docker
- **Variables d'entorn**: Configura-les segons el teu entorn
- **Seguretat**: En producció, canvia les contrasenyes per defecte
- **Backup**: Fes còpies de seguretat regulars de la base de dades

## 🆘 Suport

Si tens problemes:
1. Revisa els logs: `docker-compose logs`
2. Verifica que Docker està executant-se
3. Comprova que els ports no estan ocupats
4. Revisa la configuració de les variables d'entorn 