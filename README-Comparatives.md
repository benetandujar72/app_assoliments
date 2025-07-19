# 📊 Sistema de Comparatives Estadístiques

## Descripció General

El sistema de comparatives estadístiques permet realitzar anàlisis avançats i comparatives entre diferents dimensions dels dades educatius:

- **Materies**: Comparació de rendiment entre assignatures
- **Grups**: Anàlisi comparatiu entre classes
- **Temporal**: Evolució del rendiment al llarg del temps
- **Multidimensional**: Anàlisi combinant múltiples factors
- **Correlacions**: Relacions entre diferents variables
- **Anàlisi de Variància**: Tests estadístics de significància

## 🎯 Tipus de Comparatives Disponibles

### 1. Comparativa entre Materies
**Endpoint**: `/api/estadistiques/comparativa/materies`

**Funcionalitats**:
- Ranking de rendiment per materia
- Comparació de mitjanes i percentatges d'èxit
- Anàlisi de dificultat per assignatura
- Identificació de materies "filtro"

**Filtres disponibles**:
- `classe`: Filtrar per classe específica
- `trimestre`: Filtrar per trimestre específic
- `grup_materies`: Seleccionar materies específiques

**Visualitzacions**:
- Gràfic de barres comparatiu
- Gràfic de radar per anàlisi detallada
- Taula de resultats amb mètriques

### 2. Comparativa entre Grups
**Endpoint**: `/api/estadistiques/comparativa/grups`

**Funcionalitats**:
- Ranking de grups per rendiment
- Anàlisi de variabilitat entre classes
- Comparació de mitjanes i desviacions estàndard
- Identificació de grups d'alt/baix rendiment

**Filtres disponibles**:
- `assignatura`: Filtrar per assignatura específica
- `trimestre`: Filtrar per trimestre específic
- `grup_classes`: Seleccionar classes específiques

**Visualitzacions**:
- Gràfic de barres amb mitjanes i desviacions
- Gràfic de donut per distribució d'estudiants
- Taula comparativa de resultats

### 3. Comparativa Temporal
**Endpoint**: `/api/estadistiques/comparativa/temporal`

**Funcionalitats**:
- Evolució del rendiment per trimestres
- Anàlisi de tendències temporals
- Identificació de millores/empitjoraments
- Anàlisi de consistència del rendiment

**Filtres disponibles**:
- `classe`: Filtrar per classe específica
- `assignatura`: Filtrar per assignatura específica

**Visualitzacions**:
- Gràfic de línies temporals
- Gràfic de barres apilades per assoliments
- Taula d'evolució temporal

### 4. Comparativa Multidimensional
**Endpoint**: `/api/estadistiques/comparativa/multidimensional`

**Funcionalitats**:
- Anàlisi combinant assignatura, classe i trimestre
- Identificació de patrons complexos
- Anàlisi d'interaccions entre factors
- Visualització en matriu

**Filtres disponibles**:
- `classe`: Filtrar per classe específica
- `assignatura`: Filtrar per assignatura específica
- `trimestre`: Filtrar per trimestre específic

**Visualitzacions**:
- Gràfic de barres agrupades
- Gràfic de dispersió per correlacions
- Taula multidimensional

### 5. Anàlisi de Correlacions
**Endpoint**: `/api/estadistiques/comparativa/correlacions`

**Funcionalitats**:
- Càlcul de correlacions de Pearson entre materies
- Matriu de correlacions
- Identificació de relacions fortes/dèbils
- Anàlisi de dependències entre assignatures

**Filtres disponibles**:
- `classe`: Filtrar per classe específica
- `trimestre`: Filtrar per trimestre específic

**Visualitzacions**:
- Matriu de correlacions
- Gràfic de barres per correlacions
- Taula de coeficients de correlació

### 6. Anàlisi de Variància
**Endpoint**: `/api/estadistiques/comparativa/analisi-variancia`

**Funcionalitats**:
- Test ANOVA per comparar grups
- Càlcul d'estadístics F
- Anàlisi de significància estadística
- Coeficient de determinació (R²)

**Filtres disponibles**:
- `assignatura`: Filtrar per assignatura específica
- `trimestre`: Filtrar per trimestre específic

**Visualitzacions**:
- Gràfic de barres per grups
- Gràfic de donut per descomposició de variància
- Taula d'estadístics ANOVA

## 🔧 Ús de l'Interfície

### Accés a les Comparatives
1. Carrega les dades CSV al sistema
2. Navega a la pestaña "Comparatives"
3. Selecciona el tipus de comparativa desitjat
4. Configura els filtres opcionals
5. Fes clic a "Generar Comparativa"

### Filtres Avançats
- **Tipus de Comparativa**: Selecciona entre les 6 opcions disponibles
- **Classe**: Filtra per classe específica (opcional)
- **Assignatura**: Filtra per assignatura específica (opcional)
- **Trimestre**: Filtra per trimestre específic (opcional)

### Exportació de Resultats
- Fes clic a "Exportar" per descarregar els resultats en CSV
- Els fitxers s'exporten amb timestamp per facilitar l'organització

## 📈 Mètriques i Indicadors

### Mètriques Bàsiques
- **Mitjana**: Valor mitjà dels assoliments
- **Desviació Estàndard**: Mesura de dispersió
- **Percentatge d'Èxit**: % d'assoliments AE + AN
- **Percentatge NA**: % de no assoliments

### Mètriques Avançades
- **Correlació de Pearson**: Mesura de relació lineal (-1 a 1)
- **Estadístic F**: Mesura de significància estadística
- **R²**: Coeficient de determinació (0 a 1)
- **Significància**: Classificació qualitativa (Alta/Mitjana/Baixa)

### Classificacions de Significància
- **Alta**: Valors superiors al 80% o correlacions > 0.7
- **Mitjana**: Valors entre 60-80% o correlacions 0.4-0.7
- **Baixa**: Valors inferiors al 60% o correlacions < 0.4

## 🎨 Visualitzacions Disponibles

### Tipus de Gràfics
1. **Gràfics de Barres**: Per comparacions directes
2. **Gràfics de Línies**: Per evolució temporal
3. **Gràfics de Radar**: Per anàlisi multidimensional
4. **Gràfics de Donut**: Per distribucions
5. **Gràfics de Dispersió**: Per correlacions
6. **Matrius**: Per visualitzar múltiples dimensions

### Característiques dels Gràfics
- **Interactius**: Hover per veure detalls
- **Responsius**: S'adapten a diferents mides de pantalla
- **Color-coded**: Codificació per colors segons significància
- **Exportables**: Es poden descarregar com a imatges

## 🔍 Casos d'Ús Pràctics

### 1. Identificació de Materies Problemàtiques
- Utilitza "Comparativa entre Materies"
- Identifica assignatures amb baix percentatge d'èxit
- Analitza tendències temporals per veure millores

### 2. Anàlisi de Rendiment per Grups
- Utilitza "Comparativa entre Grups"
- Identifica classes amb millor/peor rendiment
- Analitza factors que poden influir en les diferències

### 3. Seguiment de Progrés Temporal
- Utilitza "Comparativa Temporal"
- Monitoritza millores al llarg del curs
- Identifica períodes de dificultat

### 4. Anàlisi de Correlacions entre Materies
- Utilitza "Anàlisi de Correlacions"
- Identifica assignatures relacionades
- Planteja estratègies d'ensenyament integrat

### 5. Tests Estadístics de Significància
- Utilitza "Anàlisi de Variància"
- Valida si les diferències són estadísticament significatives
- Prendre decisions basades en evidència estadística

## 🚀 Execució i Manteniment

### Actualització de la Base de Dades
```bash
node scripts/update-database.js
```

### Verificació de Funcionament
1. Carrega dades CSV
2. Navega a la pestaña "Comparatives"
3. Prova diferents tipus de comparativa
4. Verifica que els gràfics es generen correctament
5. Comprova l'exportació de resultats

### Troubleshooting
- **Error de connexió**: Verifica que el servidor estigui executant-se
- **Dades no carregades**: Assegura't que hi ha dades CSV importades
- **Gràfics no es mostren**: Verifica que Chart.js està carregat
- **Filtres no funcionen**: Comprova que les dades tenen els valors esperats

## 📚 Recursos Addicionals

### Documentació Tècnica
- [API Documentation](README.md#api-endpoints)
- [Database Schema](init.sql)
- [Chart.js Documentation](https://www.chartjs.org/docs/)

### Referències Estadístiques
- [Correlació de Pearson](https://en.wikipedia.org/wiki/Pearson_correlation_coefficient)
- [Anàlisi de Variància](https://en.wikipedia.org/wiki/Analysis_of_variance)
- [Estadístic F](https://en.wikipedia.org/wiki/F-test)

---

**Desenvolupat per**: Sistema d'Anàlisi Educatiu Avançat  
**Versió**: 2.0  
**Data**: 2024 