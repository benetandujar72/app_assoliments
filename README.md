# Dashboard d'Assoliments Acadèmics

Una aplicació web per a l'anàlisi i visualització d'assoliments acadèmics d'estudiants de 3r ESO.

## 🚀 Característiques

- **Càrrega de dades CSV**: Importació automàtica de fitxers CSV amb dades d'assoliments
- **Dashboard interactiu**: Visualitzacions gràfiques i estadístiques en temps real
- **Filtres avançats**: Filtrat per grup, alumne, assignatura, trimestre i nivell d'assoliment
- **Múltiples vistes**: Pestanyes per a diferents tipus d'anàlisi
- **Exportació de dades**: Exportació de dades filtrades en format CSV
- **Disseny responsive**: Interfície adaptada per a diferents dispositius
- **Base de dades PostgreSQL**: Almacenament persistent de dades
- **Desplegament en Render**: Configuració per a producció

## 📋 Requisits

- Node.js (versió 14 o superior)
- npm o yarn
- PostgreSQL (per a desenvolupament local)

## 🛠️ Instal·lació

### Desenvolupament Local

1. **Clona o descarrega el projecte**
   ```bash
   git clone <url-del-repositori>
   cd grafica-assoliments
   ```

2. **Instal·la les dependències**
   ```bash
   npm install
   ```

3. **Configura la base de dades local**
   - Instal·la PostgreSQL
   - Crea una base de dades anomenada `assoliments_db`
   - Configura les credencials a `config.dev.env`

4. **Alterna a configuració de desenvolupament**
   ```powershell
   .\switch-env.ps1 dev
   ```

5. **Inicia el servidor**
   ```bash
   npm start
   ```

6. **Obre el navegador**
   ```
   http://localhost:3000
   ```

### Producció (Render)

L'aplicació està configurada per a desplegament automàtic en Render amb la base de dades PostgreSQL de producció.

**Configuració de producció:**
- **Host**: `dpg-d1t0j4er433s73eraf60-a.frankfurt-postgres.render.com`
- **Base de dades**: `assoliments_db`
- **Usuari**: `assoliments_db_user`

## 🔄 Alternança entre Entorns

### Desenvolupament → Producció
```powershell
.\switch-env.ps1 prod
npm start
```

### Producció → Desenvolupament
```powershell
.\switch-env.ps1 dev
npm start
```

### Verificar Connexió de Producció
```bash
node test-prod-db.js
```

## 🐳 Execució amb Docker

### Desenvolupament Local amb Docker
```bash
docker-compose up --build
```

### Producció amb Docker
```bash
docker-compose -f docker-compose.prod.yml up --build
```

## 📊 Format del CSV

El fitxer CSV ha de tenir el següent format:

```csv
CLASSE,NOM,LIN_1,LIN_2,LIN_3,LIN_FINAL,ANG_1,ANG_2,ANG_3,ANG_FINAL,...
3A,Anna García,AE,AN,AE,AE,AN,AE,AN,AE,...
3B,Joan Martí,AS,AN,AS,AN,NA,AS,AN,AS,...
```

**Columnes esperades:**
- **CLASSE**: Grup de l'alumne (ex: 3A, 3B)
- **NOM**: Nom complet de l'alumne
- **Assoliments per assignatura i trimestre**: Valors AE, AN, AS, NA

**Valors d'assoliment:**
- **AE**: Assoliment Excel·lent
- **AN**: Assoliment Notable  
- **AS**: Assoliment Suficient
- **NA**: No Assoliment

## 🎯 Ús de l'aplicació

### 1. Càrrega inicial
- L'aplicació verifica automàticament si ja hi ha dades carregades
- Si no n'hi ha, mostra la pantalla de càrrega de fitxer CSV
- Si n'hi ha, ofereix opcions per carregar el dashboard o un nou fitxer

### 2. Càrrega de fitxer CSV
- Arrossega el fitxer CSV a l'àrea de càrrega o fes clic per seleccionar-lo
- L'aplicació processa el fitxer i carrega les dades al servidor
- Un cop carregades, es mostra automàticament el dashboard

### 3. Navegació pel dashboard
- **Visió General**: Gràfics principals i estadístiques globals
- **Trimestres**: Anàlisi per trimestres i evolució temporal
- **Assignatures**: Rendiment per assignatura
- **Grups**: Comparativa entre grups de classe
- **Individual**: Anàlisi individual d'alumnes
- **Taula Detallada**: Vista tabular amb tots els registres

### 4. Filtres
- Utilitza els filtres per afinar l'anàlisi
- Els filtres s'apliquen en temps real a tots els gràfics
- Utilitza el botó "Reiniciar Filtres" per netejar-los

### 5. Exportació
- Exporta les dades filtrades en format CSV
- Utilitza el botó "Exportar Dades" per descarregar

## 🔧 Desenvolupament

Per executar l'aplicació en mode desenvolupament:

```bash
npm run dev
```

Això inicia el servidor amb nodemon per a recàrrega automàtica.

## 📁 Estructura del projecte

```
grafica-assoliments/
├── index.html              # Pàgina principal
├── script.js               # Lògica del frontend
├── styles.css              # Estils CSS
├── server.js               # Servidor Express
├── package.json            # Dependències
├── config.env              # Configuració de producció
├── config.dev.env          # Configuració de desenvolupament
├── switch-env.ps1          # Script per alternar entorns
├── test-prod-db.js         # Script per provar connexió de producció
├── render.yaml             # Configuració per Render
├── Dockerfile              # Configuració Docker
├── docker-compose.yml      # Docker Compose per desenvolupament
├── docker-compose.prod.yml # Docker Compose per producció
└── README.md              # Aquesta documentació
```

## 🐛 Solució de problemes

### L'aplicació no carrega
- Verifica que el servidor està executant-se a `http://localhost:3000`
- Comprova que no hi ha errors a la consola del navegador
- Verifica la connexió a la base de dades amb `node test-prod-db.js`

### Error carregant CSV
- Verifica que el fitxer és un CSV vàlid
- Comprova que les columnes tenen el format correcte
- Assegura't que els valors d'assoliment són AE, AN, AS o NA

### El dashboard no es mostra
- Neteja la caché del navegador
- Verifica que les dades s'han carregat correctament
- Comprova la consola per a errors JavaScript

### Problemes de connexió a la base de dades
- Verifica que les credencials són correctes
- Comprova que la base de dades està accessible
- En producció, verifica que SSL està configurat correctament

## 📝 Notes tècniques

- L'aplicació utilitza Chart.js per a les visualitzacions
- Base de dades PostgreSQL per a almacenament persistent
- Configuració SSL automàtica per a producció
- Desplegament automàtic en Render
- Suport per a Docker per a desenvolupament i producció

## 🤝 Contribucions

Les contribucions són benvingudes! Si vols millorar l'aplicació:

1. Fes un fork del projecte
2. Crea una branca per a la teva funcionalitat
3. Fes commit dels teus canvis
4. Obre un pull request

## 📄 Llicència

Aquest projecte està sota la llicència MIT. 