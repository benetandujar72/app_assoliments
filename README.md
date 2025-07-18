# Dashboard d'Assoliments Acadèmics

Una aplicació web per a l'anàlisi i visualització d'assoliments acadèmics d'estudiants de 3r ESO.

## 🚀 Característiques

- **Càrrega de dades CSV**: Importació automàtica de fitxers CSV amb dades d'assoliments
- **Dashboard interactiu**: Visualitzacions gràfiques i estadístiques en temps real
- **Filtres avançats**: Filtrat per grup, alumne, assignatura, trimestre i nivell d'assoliment
- **Múltiples vistes**: Pestanyes per a diferents tipus d'anàlisi
- **Exportació de dades**: Exportació de dades filtrades en format CSV
- **Disseny responsive**: Interfície adaptada per a diferents dispositius

## 📋 Requisits

- Node.js (versió 14 o superior)
- npm o yarn

## 🛠️ Instal·lació

1. **Clona o descarrega el projecte**
   ```bash
   git clone <url-del-repositori>
   cd grafica-assoliments
   ```

2. **Instal·la les dependències**
   ```bash
   npm install
   ```

3. **Inicia el servidor**
   ```bash
   npm start
   ```

4. **Obre el navegador**
   ```
   http://localhost:3000
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
├── index.html          # Pàgina principal
├── script.js           # Lògica del frontend
├── styles.css          # Estils CSS
├── server.js           # Servidor Express
├── package.json        # Dependències
└── README.md          # Aquesta documentació
```

## 🐛 Solució de problemes

### L'aplicació no carrega
- Verifica que el servidor està executant-se a `http://localhost:3000`
- Comprova que no hi ha errors a la consola del navegador

### Error carregant CSV
- Verifica que el fitxer és un CSV vàlid
- Comprova que les columnes tenen el format correcte
- Assegura't que els valors d'assoliment són AE, AN, AS o NA

### El dashboard no es mostra
- Neteja la caché del navegador
- Verifica que les dades s'han carregat correctament
- Comprova la consola per a errors JavaScript

## 📝 Notes tècniques

- L'aplicació utilitza Chart.js per a les visualitzacions
- El servidor simula una base de dades amb dades en memòria
- Per a producció, es recomana integrar amb una base de dades real
- L'aplicació és compatible amb navegadors moderns

## 🤝 Contribucions

Les contribucions són benvingudes! Si vols millorar l'aplicació:

1. Fes un fork del projecte
2. Crea una branca per a la teva funcionalitat
3. Fes commit dels teus canvis
4. Obre un pull request

## 📄 Llicència

Aquest projecte està sota la llicència MIT. 