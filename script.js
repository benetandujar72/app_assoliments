// ===== VARIABLES GLOBALS =====
let currentData = [];
let filteredData = [];
let charts = {};
let currentTab = 'general';
let uploadProgress = 0;

// ===== CONFIGURACIÓ DE CHARTS =====
function initializeChartJS() {
    Chart.defaults.font.family = 'Inter, sans-serif';
    Chart.defaults.font.size = 12;
    Chart.defaults.color = '#475569';
    Chart.defaults.plugins.legend.position = 'bottom';
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.padding = 20;
}

// ===== INICIALITZACIÓ =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicialitzant aplicació...');
    
    // Verificar que Chart.js esté carregat
    if (typeof Chart === 'undefined') {
        console.error('❌ Chart.js no està carregat');
        showStatus('error', 'Error: Chart.js no s\'ha carregat correctament. Si us plau, recarrega la pàgina.');
        return;
    }
    
    // Configurar Chart.js
    initializeChartJS();
    
    initializeEventListeners();
    initializeScrollEffects();
    initializeMicrointeractions();
    
    // Inicialitzar comparatives
    inicialitzarComparatives();
    
    // Verificar si hi ha dades existents i carregar-les automàticament
    verificarDadesExistents();
});

// ===== VERIFICACIÓ DE DADES EXISTENTS =====
async function verificarDadesExistents() {
    try {
        console.log('🔍 Verificant dades existents...');
        const response = await fetch('/api/assoliments?limit=1');
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            console.log('✅ Hi ha dades existents, carregant automàticament...');
            showStatus('info', 'Carregant dades existents...');
            await carregarDadesDelServidor();
        } else {
            console.log('ℹ️ No hi ha dades existents');
            showStatus('info', 'Benvingut al Dashboard d\'Assoliments. Carrega un fitxer CSV per començar.');
        }
    } catch (error) {
        console.log('ℹ️ No hi ha dades existents o error de connexió');
        showStatus('info', 'Benvingut al Dashboard d\'Assoliments. Carrega un fitxer CSV per començar.');
    }
}

// ===== EVENT LISTENERS =====
function initializeEventListeners() {
    // File upload
    const fileInput = document.getElementById('fileInput');
    const fileUploadArea = document.getElementById('fileUploadArea');
    
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    fileUploadArea.addEventListener('dragover', handleDragOver);
    fileUploadArea.addEventListener('dragleave', handleDragLeave);
    fileUploadArea.addEventListener('drop', handleDrop);
    fileUploadArea.addEventListener('click', () => fileInput.click());
    
    // Action buttons
    document.addEventListener('click', handleActionClick);
    
    // Tab navigation
    document.addEventListener('click', handleTabClick);
    
    // Filter changes
    document.addEventListener('change', handleFilterChange);
}

// ===== MICROINTERACCIONS =====
function initializeMicrointeractions() {
    // Header scroll effect
    const header = document.getElementById('header');
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScrollY = currentScrollY;
    });
    
    // Button hover effects
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', (e) => {
            e.target.style.transform = 'translateY(-2px) scale(1.02)';
        });
        
        btn.addEventListener('mouseleave', (e) => {
            e.target.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Chart container hover effects
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
        container.addEventListener('mouseenter', (e) => {
            e.target.style.transform = 'translateY(-4px) scale(1.01)';
        });
        
        container.addEventListener('mouseleave', (e) => {
            e.target.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// ===== SCROLL EFFECTS =====
function initializeScrollEffects() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe sections for animation
    const sections = document.querySelectorAll('.upload-section, .filters-section, .tabs-section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        observer.observe(section);
    });
}

// ===== FILE HANDLING =====
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processFile(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
}

function handleDragLeave(event) {
    event.currentTarget.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function processFile(file) {
    console.log(`📁 Processant fitxer: ${file.name} Mida: ${file.size} bytes`);
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
        showStatus('error', 'Si us plau, selecciona un fitxer CSV vàlid.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const csvData = e.target.result;
            await uploadCSV(csvData, file.name);
        } catch (error) {
            console.error('❌ Error processant fitxer:', error);
            showStatus('error', 'Error processant el fitxer: ' + error.message);
        }
    };
    reader.readAsText(file);
}

async function uploadCSV(csvData, fileName) {
    showProgressBar();
    updateProgress(10, 'Preparant fitxer...');
    
    const formData = new FormData();
    const blob = new Blob([csvData], { type: 'text/csv' });
    formData.append('file', blob, fileName);
    
    try {
        updateProgress(30, 'Enviant fitxer al servidor...');
        const response = await fetch('/api/upload/csv', {
            method: 'POST',
            body: formData
        });
        
        updateProgress(60, 'Processant dades...');
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Fitxer carregat correctament:', result);
            showStatus('success', result.message);
            
            updateProgress(80, 'Carregant dades...');
            // Carregar dades del servidor després d'un petit delay
            setTimeout(() => {
                carregarDadesDelServidor();
            }, 1000);
        } else {
            throw new Error(result.error || 'Error desconegut');
        }
    } catch (error) {
        console.error('❌ Error carregant fitxer:', error);
        showStatus('error', 'Error carregant el fitxer: ' + error.message);
        hideProgressBar();
    }
}

// ===== DATA LOADING =====
async function carregarDadesDelServidor() {
    console.log('📡 Carregant dades del servidor...');
    updateProgress(85, 'Obtenint dades del servidor...');
    
    try {
        const response = await fetch('/api/assoliments?limit=10000');
        const result = await response.json();
        
        if (result.success) {
            updateProgress(95, 'Finalitzant càrrega...');
            currentData = result.data;
            filteredData = [...currentData];
            console.log(`✅ Dades carregades: ${currentData.length} assoliments`);
            
            setTimeout(() => {
                inicialitzarDashboard();
                updateProgress(100, 'Completat!');
                setTimeout(() => {
                    hideProgressBar();
                    showNavigationMarker();
                }, 500);
            }, 500);
        } else {
            throw new Error(result.error || 'Error carregant dades');
        }
    } catch (error) {
        console.error('❌ Error carregant dades:', error);
        showStatus('error', 'Error carregant dades: ' + error.message);
        hideProgressBar();
    }
}

// ===== DASHBOARD INITIALIZATION =====
function inicialitzarDashboard() {
    console.log('🚀 Inicialitzant dashboard...');
    
    // Mostrar seccions
    document.getElementById('filtersSection').style.display = 'block';
    document.getElementById('statsSection').style.display = 'block';
    document.getElementById('comparativaAvancadaSection').style.display = 'block';
    document.getElementById('tabsSection').style.display = 'block';
    
    // Omplir filtres
    omplirFiltres();
    
    // Carregar opcions de comparatives
    carregarOpcionsComparatives();
    
    // Afegir event listeners als filtres
    afegirEventListenersFiltres();
    
    // Actualitzar estadístiques detallades
    actualitzarEstadistiquesDetallades();
    
    // Actualitzar comparativa avançada
    actualitzarComparativaAvancada();
    
    // Actualitzar gràfics
    actualitzarGraficos();
    
    // Actualitzar taula resumen
    updateSummaryTable();
    
    // Afegir funcionalitats extra
    afegirFuncionalitatsExtra();
    
    console.log('✅ Dashboard inicialitzat correctament');
}

function omplirFiltres() {
    console.log('🔍 DEBUG - Estat de les dades:');
    console.log('Total dades brutes:', currentData.length);
    console.log('Total dades filtrades:', filteredData.length);
    
    // Classes
    const classes = [...new Set(currentData.map(item => item.classe))].sort();
    const classeFilter = document.getElementById('classeFilter');
    classeFilter.innerHTML = '<option value="">Totes les classes</option>';
    classes.forEach(classe => {
        const option = document.createElement('option');
        option.value = classe;
        option.textContent = classe;
        classeFilter.appendChild(option);
    });
    console.log('✅ Classes carregades:', classes);
    
    // Estudiants
    carregarAlumnes();
    
    // Assignatures
    const assignatures = [...new Set(currentData.map(item => item.assignatura_nom))].sort();
    const assignaturaFilter = document.getElementById('assignaturaFilter');
    assignaturaFilter.innerHTML = '<option value="">Totes les assignatures</option>';
    assignatures.forEach(assignatura => {
        const option = document.createElement('option');
        option.value = assignatura;
        option.textContent = assignatura;
        assignaturaFilter.appendChild(option);
    });
}

async function carregarAlumnes() {
    try {
        const response = await fetch('/api/estudiants?limit=1000');
        const result = await response.json();
        
        if (result.success) {
            const estudiants = result.data.sort((a, b) => a.nom.localeCompare(b.nom));
            const estudiantFilter = document.getElementById('estudiantFilter');
            estudiantFilter.innerHTML = '<option value="">Tots els estudiants</option>';
            estudiants.forEach(estudiant => {
                const option = document.createElement('option');
                option.value = estudiant.nom;
                option.textContent = `${estudiant.nom} (${estudiant.classe})`;
                estudiantFilter.appendChild(option);
            });
            console.log('✅ Alumnes carregats:', estudiants.length, 'alumnes');
        }
    } catch (error) {
        console.error('❌ Error carregant alumnes:', error);
    }
}

function afegirEventListenersFiltres() {
    const filterSelects = document.querySelectorAll('[data-filter]');
    filterSelects.forEach(select => {
        select.addEventListener('change', aplicarFiltres);
    });
}

function afegirFuncionalitatsExtra() {
    console.log('✨ Funcionalitats extra afegides');
}

// ===== FILTERS =====
function aplicarFiltres() {
    const classe = document.getElementById('classeFilter').value;
    const estudiant = document.getElementById('estudiantFilter').value;
    const assignatura = document.getElementById('assignaturaFilter').value;
    const trimestre = document.getElementById('trimestreFilter').value;
    const assoliment = document.getElementById('assolimentFilter').value;
    
    filteredData = currentData.filter(item => {
        if (classe && item.classe !== classe) return false;
        if (estudiant && !item.estudiant_nom.includes(estudiant)) return false;
        if (assignatura && item.assignatura_nom !== assignatura) return false;
        if (trimestre && item.trimestre !== trimestre) return false;
        if (assoliment && item.assoliment !== assoliment) return false;
        return true;
    });
    
    actualitzarGraficos();
    actualitzarTaula();
    updateSummaryTable(); // Actualitzar taula resumen amb els filtres aplicats
    actualitzarEstadistiquesDetallades(); // Actualitzar estadístiques detallades
    actualitzarComparativaAvancada(); // Actualitzar comparativa avançada
}

// ===== ESTADÍSTIQUES DETALLADES =====
function actualitzarEstadistiquesDetallades() {
    actualitzarEstadistiquesGenerals();
    actualitzarEstadistiquesPerAssignatura();
    actualitzarEstadistiquesPerTrimestre();
    actualitzarEstadistiquesPerClasse();
    actualitzarTaulaComparativaDetallada();
}

function actualitzarEstadistiquesGenerals() {
    const tbody = document.querySelector('#generalStatsTable tbody');
    if (!tbody) return;
    
    const totalAlumnes = new Set(filteredData.map(item => item.estudiant_nom)).size;
    const totalAssoliments = filteredData.length;
    const assolits = filteredData.filter(item => item.assoliment !== 'NA').length;
    const noAssolits = filteredData.filter(item => item.assoliment === 'NA').length;
    const percentAssolits = totalAssoliments > 0 ? Math.round((assolits / totalAssoliments) * 100) : 0;
    const percentNoAssolits = totalAssoliments > 0 ? Math.round((noAssolits / totalAssoliments) * 100) : 0;
    
    const ae = filteredData.filter(item => item.assoliment === 'AE').length;
    const an = filteredData.filter(item => item.assoliment === 'AN').length;
    const as = filteredData.filter(item => item.assoliment === 'AS').length;
    const na = filteredData.filter(item => item.assoliment === 'NA').length;
    
    const percentAE = totalAssoliments > 0 ? Math.round((ae / totalAssoliments) * 100) : 0;
    const percentAN = totalAssoliments > 0 ? Math.round((an / totalAssoliments) * 100) : 0;
    const percentAS = totalAssoliments > 0 ? Math.round((as / totalAssoliments) * 100) : 0;
    const percentNA = totalAssoliments > 0 ? Math.round((na / totalAssoliments) * 100) : 0;
    
    const mitjanaGeneral = totalAssoliments > 0 ? 
        (filteredData.reduce((sum, item) => sum + item.valor_numeric, 0) / totalAssoliments).toFixed(2) : '0.00';
    
    tbody.innerHTML = `
        <tr><td>Total Alumnes</td><td>${totalAlumnes}</td></tr>
        <tr><td>Total Assoliments</td><td>${totalAssoliments}</td></tr>
        <tr><td>Nº Assolits</td><td>${assolits}</td></tr>
        <tr><td>% Assolits</td><td class="percentage ${percentAssolits >= 80 ? 'high' : percentAssolits >= 60 ? 'medium' : 'low'}">${percentAssolits}%</td></tr>
        <tr><td>Nº No Assolits</td><td>${noAssolits}</td></tr>
        <tr><td>% No Assolits</td><td class="percentage ${percentNoAssolits <= 20 ? 'high' : percentNoAssolits <= 40 ? 'medium' : 'low'}">${percentNoAssolits}%</td></tr>
        <tr><td>Mitjana General</td><td>${mitjanaGeneral}</td></tr>
        <tr><td>AE (Excel·lent)</td><td>${ae} (${percentAE}%)</td></tr>
        <tr><td>AN (Notable)</td><td>${an} (${percentAN}%)</td></tr>
        <tr><td>AS (Assolit)</td><td>${as} (${percentAS}%)</td></tr>
        <tr><td>NA (No Assolit)</td><td>${na} (${percentNA}%)</td></tr>
    `;
}

function actualitzarEstadistiquesPerAssignatura() {
    const tbody = document.querySelector('#assignaturaStatsTable tbody');
    if (!tbody) return;
    
    const assignatures = [...new Set(filteredData.map(item => item.assignatura_nom))];
    const stats = assignatures.map(assignatura => {
        const data = filteredData.filter(item => item.assignatura_nom === assignatura);
        const total = data.length;
        const assolits = data.filter(item => item.assoliment !== 'NA').length;
        const noAssolits = data.filter(item => item.assoliment === 'NA').length;
        const percentAssolits = total > 0 ? Math.round((assolits / total) * 100) : 0;
        const percentNA = total > 0 ? Math.round((noAssolits / total) * 100) : 0;
        
        return { assignatura, total, percentAssolits, percentNA };
    }).sort((a, b) => b.percentAssolits - a.percentAssolits);
    
    tbody.innerHTML = stats.map(stat => `
        <tr>
            <td>${stat.assignatura}</td>
            <td>${stat.total}</td>
            <td class="percentage ${stat.percentAssolits >= 80 ? 'high' : stat.percentAssolits >= 60 ? 'medium' : 'low'}">${stat.percentAssolits}%</td>
            <td class="percentage ${stat.percentNA <= 20 ? 'high' : stat.percentNA <= 40 ? 'medium' : 'low'}">${stat.percentNA}%</td>
        </tr>
    `).join('');
}

function actualitzarEstadistiquesPerTrimestre() {
    const tbody = document.querySelector('#trimestreStatsTable tbody');
    if (!tbody) return;
    
    const trimestres = ['1r trim', '2n trim', '3r trim', 'final'];
    const stats = trimestres.map(trimestre => {
        const data = filteredData.filter(item => item.trimestre === trimestre);
        const total = data.length;
        const assolits = data.filter(item => item.assoliment !== 'NA').length;
        const noAssolits = data.filter(item => item.assoliment === 'NA').length;
        const percentAssolits = total > 0 ? Math.round((assolits / total) * 100) : 0;
        const percentNA = total > 0 ? Math.round((noAssolits / total) * 100) : 0;
        
        return { trimestre, total, percentAssolits, percentNA };
    });
    
    tbody.innerHTML = stats.map(stat => `
        <tr>
            <td>${stat.trimestre}</td>
            <td>${stat.total}</td>
            <td class="percentage ${stat.percentAssolits >= 80 ? 'high' : stat.percentAssolits >= 60 ? 'medium' : 'low'}">${stat.percentAssolits}%</td>
            <td class="percentage ${stat.percentNA <= 20 ? 'high' : stat.percentNA <= 40 ? 'medium' : 'low'}">${stat.percentNA}%</td>
        </tr>
    `).join('');
}

function actualitzarEstadistiquesPerClasse() {
    const tbody = document.querySelector('#classeStatsTable tbody');
    if (!tbody) return;
    
    const classes = [...new Set(filteredData.map(item => item.classe))];
    const stats = classes.map(classe => {
        const data = filteredData.filter(item => item.classe === classe);
        const total = data.length;
        const assolits = data.filter(item => item.assoliment !== 'NA').length;
        const noAssolits = data.filter(item => item.assoliment === 'NA').length;
        const percentAssolits = total > 0 ? Math.round((assolits / total) * 100) : 0;
        const percentNA = total > 0 ? Math.round((noAssolits / total) * 100) : 0;
        
        return { classe, total, percentAssolits, percentNA };
    }).sort((a, b) => b.percentAssolits - a.percentAssolits);
    
    tbody.innerHTML = stats.map(stat => `
        <tr>
            <td>${stat.classe}</td>
            <td>${stat.total}</td>
            <td class="percentage ${stat.percentAssolits >= 80 ? 'high' : stat.percentAssolits >= 60 ? 'medium' : 'low'}">${stat.percentAssolits}%</td>
            <td class="percentage ${stat.percentNA <= 20 ? 'high' : stat.percentNA <= 40 ? 'medium' : 'low'}">${stat.percentNA}%</td>
        </tr>
    `).join('');
}

// ===== CHARTS =====
function actualitzarGraficos() {
    const activeTab = document.querySelector('.tab-button.active').dataset.tab;
    console.log(`📊 Actualitzant gràfics per pestanya: ${activeTab}`);
    console.log(`📊 Dades disponibles: ${filteredData.length} registres`);
    
    if (filteredData.length === 0) {
        console.log('⚠️ No hi ha dades per mostrar gràfics');
        showStatus('warning', 'No hi ha dades per mostrar amb els filtres actuals');
        return;
    }
    
    try {
        switch (activeTab) {
            case 'general':
                console.log('🔄 Creant gràfics generals...');
                crearGraficAssoliments();
                crearGraficMitjana();
                crearGraficEvolucio();
                crearGraficRendiment();
                break;
            case 'trimestres':
                console.log('🔄 Creant gràfics de trimestres...');
                crearGraficTrimestres();
                crearGraficEvolucioTemporal();
                break;
            case 'assignatures':
                console.log('🔄 Creant gràfics d\'assignatures...');
                crearGraficAssignatures();
                crearGraficAssolimentsAssignatures();
                break;
            case 'grups':
                console.log('🔄 Creant gràfics de grups...');
                crearGraficClasses();
                crearGraficDistribucioGrups();
                break;
            case 'individual':
                console.log('🔄 Creant gràfics individuals...');
                crearGraficPerfilIndividual();
                crearGraficEvolucioIndividual();
                break;
            case 'taula':
                console.log('🔄 Actualitzant taula...');
                actualitzarTaula();
                break;
            default:
                console.log(`⚠️ Pestanya desconeguda: ${activeTab}`);
        }
        console.log('✅ Gràfics actualitzats correctament');
    } catch (error) {
        console.error('❌ Error actualitzant gràfics:', error);
        showStatus('error', 'Error actualitzant gràfics: ' + error.message);
    }
}

function crearGraficAssoliments() {
    const ctx = document.getElementById('assolimentsChart');
    if (!ctx) return;
    
    const assoliments = ['NA', 'AS', 'AN', 'AE'];
    const counts = assoliments.map(a => 
        filteredData.filter(item => item.assoliment === a).length
    );
    
    const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
    
    if (charts.assoliments) {
        charts.assoliments.destroy();
    }
    
    charts.assoliments = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['No Assolit', 'Assolit', 'Notable', 'Excel·lent'],
            datasets: [{
                data: counts,
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

function crearGraficMitjana() {
    const ctx = document.getElementById('mitjanaChart');
    if (!ctx) return;
    
    const assignatures = [...new Set(filteredData.map(item => item.assignatura_nom))];
    const mitjanes = assignatures.map(assignatura => {
        const data = filteredData.filter(item => item.assignatura_nom === assignatura);
        const mitjana = data.reduce((sum, item) => sum + item.valor_numeric, 0) / data.length;
        return Math.round(mitjana * 100) / 100;
    });
    
    if (charts.mitjana) {
        charts.mitjana.destroy();
    }
    
    charts.mitjana = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: assignatures,
            datasets: [{
                label: 'Mitjana',
                data: mitjanes,
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 3
                }
            }
        }
    });
}

function crearGraficEvolucio() {
    const ctx = document.getElementById('evolucioChart');
    if (!ctx) return;
    
    const trimestres = ['1r trim', '2n trim', '3r trim', 'final'];
    const mitjanes = trimestres.map(trimestre => {
        const data = filteredData.filter(item => item.trimestre === trimestre);
        if (data.length === 0) return 0;
        const mitjana = data.reduce((sum, item) => sum + item.valor_numeric, 0) / data.length;
        return Math.round(mitjana * 100) / 100;
    });
    
    if (charts.evolucio) {
        charts.evolucio.destroy();
    }
    
    charts.evolucio = new Chart(ctx, {
        type: 'line',
        data: {
            labels: trimestres,
            datasets: [{
                label: 'Mitjana',
                data: mitjanes,
                borderColor: 'rgba(16, 185, 129, 1)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 3
                }
            }
        }
    });
}

function crearGraficRendiment() {
    const ctx = document.getElementById('rendimentChart');
    if (!ctx) return;
    
    const classes = [...new Set(filteredData.map(item => item.classe))];
    const rendiments = classes.map(classe => {
        const data = filteredData.filter(item => item.classe === classe);
        const mitjana = data.reduce((sum, item) => sum + item.valor_numeric, 0) / data.length;
        return Math.round(mitjana * 100) / 100;
    });
    
    if (charts.rendiment) {
        charts.rendiment.destroy();
    }
    
    charts.rendiment = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: classes,
            datasets: [{
                label: 'Rendiment',
                data: rendiments,
                backgroundColor: 'rgba(168, 85, 247, 0.8)',
                borderColor: 'rgba(168, 85, 247, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 3
                }
            }
        }
    });
}

// ===== TAB NAVIGATION =====
function handleTabClick(event) {
    if (event.target.classList.contains('tab-button')) {
        const tabId = event.target.dataset.tab;
        showTab(tabId);
    }
}

function showTab(tabId) {
    // Remove active class from all tabs and panes
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    
    // Add active class to clicked tab and corresponding pane
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
    
    currentTab = tabId;
    
    // Update charts for the new tab
    setTimeout(() => {
        actualitzarGraficos();
    }, 100);
}

// ===== TABLE =====
function actualitzarTaula() {
    const tbody = document.getElementById('assolimentsTableBody');
    if (!tbody) return;
    
    if (filteredData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    No hi ha dades per mostrar amb els filtres actuals
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredData.map(item => `
        <tr>
            <td>${item.estudiant_nom}</td>
            <td>${item.classe}</td>
            <td>${item.assignatura_nom}</td>
            <td>${item.trimestre}</td>
            <td>${item.assoliment}</td>
            <td>${item.valor_numeric}</td>
        </tr>
    `).join('');
}

// ===== ACTION HANDLERS =====
function handleActionClick(event) {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    
    switch (action) {
        case 'apply-filters':
            aplicarFiltres();
            break;
        case 'reset-filters':
            resetFiltres();
            break;
        case 'clear-data':
            clearData();
            break;
        case 'export-data':
            exportData();
            break;
        case 'export-table':
            exportTable();
            break;
        case 'export-summary':
            exportSummary();
            break;
        case 'export-stats':
            exportStats();
            break;
        case 'go-to-stats':
            goToStats();
            break;
    }
}

// ===== NAVIGATION FUNCTIONS =====
function goToStats() {
    const statsSection = document.getElementById('statsSection');
    if (statsSection) {
        statsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
}

// ===== EXPORT FUNCTIONS =====
function exportStats() {
    if (filteredData.length === 0) {
        showStatus('warning', 'No hi ha dades per exportar');
        return;
    }
    
    // Crear CSV amb totes les estadístiques
    const statsData = [];
    
    // Estadístiques generals
    const totalAlumnes = new Set(filteredData.map(item => item.estudiant_nom)).size;
    const totalAssoliments = filteredData.length;
    const assolits = filteredData.filter(item => item.assoliment !== 'NA').length;
    const noAssolits = filteredData.filter(item => item.assoliment === 'NA').length;
    const percentAssolits = totalAssoliments > 0 ? Math.round((assolits / totalAssoliments) * 100) : 0;
    const percentNoAssolits = totalAssoliments > 0 ? Math.round((noAssolits / totalAssoliments) * 100) : 0;
    
    statsData.push(['ESTADÍSTIQUES GENERALS']);
    statsData.push(['Mètrica', 'Valor']);
    statsData.push(['Total Alumnes', totalAlumnes]);
    statsData.push(['Total Assoliments', totalAssoliments]);
    statsData.push(['Nº Assolits', assolits]);
    statsData.push(['% Assolits', `${percentAssolits}%`]);
    statsData.push(['Nº No Assolits', noAssolits]);
    statsData.push(['% No Assolits', `${percentNoAssolits}%`]);
    statsData.push([]);
    
    // Estadístiques per assignatura
    const assignatures = [...new Set(filteredData.map(item => item.assignatura_nom))];
    statsData.push(['ESTADÍSTIQUES PER ASSIGNATURA']);
    statsData.push(['Assignatura', 'Total', '% Assolits', '% NA']);
    
    assignatures.forEach(assignatura => {
        const data = filteredData.filter(item => item.assignatura_nom === assignatura);
        const total = data.length;
        const assolits = data.filter(item => item.assoliment !== 'NA').length;
        const noAssolits = data.filter(item => item.assoliment === 'NA').length;
        const percentAssolits = total > 0 ? Math.round((assolits / total) * 100) : 0;
        const percentNA = total > 0 ? Math.round((noAssolits / total) * 100) : 0;
        
        statsData.push([assignatura, total, `${percentAssolits}%`, `${percentNA}%`]);
    });
    statsData.push([]);
    
    // Estadístiques per trimestre
    const trimestres = ['1r trim', '2n trim', '3r trim', 'final'];
    statsData.push(['ESTADÍSTIQUES PER TRIMESTRE']);
    statsData.push(['Trimestre', 'Total', '% Assolits', '% NA']);
    
    trimestres.forEach(trimestre => {
        const data = filteredData.filter(item => item.trimestre === trimestre);
        const total = data.length;
        const assolits = data.filter(item => item.assoliment !== 'NA').length;
        const noAssolits = data.filter(item => item.assoliment === 'NA').length;
        const percentAssolits = total > 0 ? Math.round((assolits / total) * 100) : 0;
        const percentNA = total > 0 ? Math.round((noAssolits / total) * 100) : 0;
        
        statsData.push([trimestre, total, `${percentAssolits}%`, `${percentNA}%`]);
    });
    statsData.push([]);
    
    // Estadístiques per classe
    const classes = [...new Set(filteredData.map(item => item.classe))];
    statsData.push(['ESTADÍSTIQUES PER CLASSE']);
    statsData.push(['Classe', 'Total', '% Assolits', '% NA']);
    
    classes.forEach(classe => {
        const data = filteredData.filter(item => item.classe === classe);
        const total = data.length;
        const assolits = data.filter(item => item.assoliment !== 'NA').length;
        const noAssolits = data.filter(item => item.assoliment === 'NA').length;
        const percentAssolits = total > 0 ? Math.round((assolits / total) * 100) : 0;
        const percentNA = total > 0 ? Math.round((noAssolits / total) * 100) : 0;
        
        statsData.push([classe, total, `${percentAssolits}%`, `${percentNA}%`]);
    });
    
    const csv = statsData.map(row => 
        row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    downloadCSV(csv, 'estadistiques_detallades.csv');
    showStatus('success', 'Estadístiques exportades correctament');
}

function resetFiltres() {
    document.querySelectorAll('[data-filter]').forEach(select => {
        select.value = '';
    });
    filteredData = [...currentData];
    actualitzarGraficos();
    actualitzarTaula();
    updateSummaryTable(); // Resetar taula resumen
    showStatus('info', 'Filtres reiniciats');
}

async function clearData() {
    if (!confirm('Estàs segur que vols netejar totes les dades?')) return;
    
    try {
        const response = await fetch('/api/upload/clear', { method: 'POST' });
        const result = await response.json();
        
        if (result.success) {
            currentData = [];
            filteredData = [];
            actualitzarGraficos();
            actualitzarTaula();
            updateSummaryTable(); // Netejar taula resumen
            showStatus('success', 'Dades netejades correctament');
            
            // Amagar seccions
            document.getElementById('filtersSection').style.display = 'none';
            document.getElementById('tabsSection').style.display = 'none';
        }
    } catch (error) {
        showStatus('error', 'Error netejant dades: ' + error.message);
    }
}

function exportData() {
    if (filteredData.length === 0) {
        showStatus('warning', 'No hi ha dades per exportar');
        return;
    }
    
    const csv = convertToCSV(filteredData);
    downloadCSV(csv, 'assoliments_export.csv');
    showStatus('success', 'Dades exportades correctament');
}

function exportTable() {
    if (filteredData.length === 0) {
        showStatus('warning', 'No hi ha dades per exportar');
        return;
    }
    
    const csv = convertToCSV(filteredData);
    downloadCSV(csv, 'taula_assoliments.csv');
    showStatus('success', 'Taula exportada correctament');
}

function exportSummary() {
    if (filteredData.length === 0) {
        showStatus('warning', 'No hi ha dades per exportar');
        return;
    }
    
    // Calcular estadístiques per exportar
    const totalAlumnes = new Set(filteredData.map(item => item.estudiant_nom)).size;
    const totalAssoliments = filteredData.length;
    const assolits = filteredData.filter(item => item.assoliment !== 'NA').length;
    const noAssolits = filteredData.filter(item => item.assoliment === 'NA').length;
    const percentAssolits = totalAssoliments > 0 ? Math.round((assolits / totalAssoliments) * 100) : 0;
    const percentNoAssolits = totalAssoliments > 0 ? Math.round((noAssolits / totalAssoliments) * 100) : 0;
    
    const ae = filteredData.filter(item => item.assoliment === 'AE').length;
    const an = filteredData.filter(item => item.assoliment === 'AN').length;
    const as = filteredData.filter(item => item.assoliment === 'AS').length;
    const na = filteredData.filter(item => item.assoliment === 'NA').length;
    
    const percentAE = totalAssoliments > 0 ? Math.round((ae / totalAssoliments) * 100) : 0;
    const percentAN = totalAssoliments > 0 ? Math.round((an / totalAssoliments) * 100) : 0;
    const percentAS = totalAssoliments > 0 ? Math.round((as / totalAssoliments) * 100) : 0;
    const percentNA = totalAssoliments > 0 ? Math.round((na / totalAssoliments) * 100) : 0;
    
    const mitjanaGeneral = totalAssoliments > 0 ? 
        (filteredData.reduce((sum, item) => sum + item.valor_numeric, 0) / totalAssoliments).toFixed(2) : '0.00';
    
    // Crear CSV del resumen
    const summaryData = [
        ['Mètrica', 'Valor'],
        ['Total Alumnes', totalAlumnes],
        ['Total Assoliments', totalAssoliments],
        ['Nº Assolits', assolits],
        ['% Assolits', `${percentAssolits}%`],
        ['Nº No Assolits', noAssolits],
        ['% No Assolits', `${percentNoAssolits}%`],
        ['Mitjana General', mitjanaGeneral],
        ['AE (Excel·lent)', `${ae} (${percentAE}%)`],
        ['AN (Notable)', `${an} (${percentAN}%)`],
        ['AS (Assolit)', `${as} (${percentAS}%)`],
        ['NA (No Assolit)', `${na} (${percentNA}%)`]
    ];
    
    const csv = summaryData.map(row => 
        row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    downloadCSV(csv, 'resum_assoliments.csv');
    showStatus('success', 'Resum exportat correctament');
}

function convertToCSV(data) {
    const headers = ['Estudiant', 'Classe', 'Assignatura', 'Trimestre', 'Assoliment', 'Valor'];
    const rows = data.map(item => [
        item.estudiant_nom,
        item.classe,
        item.assignatura_nom,
        item.trimestre,
        item.assoliment,
        item.valor_numeric
    ]);
    
    return [headers, ...rows].map(row => 
        row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

// ===== STATUS MESSAGES =====
function showStatus(type, message) {
    const container = document.getElementById('statusContainer');
    const statusDiv = document.createElement('div');
    statusDiv.className = `status-message status-${type}`;
    
    const icon = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    }[type];
    
    statusDiv.innerHTML = `
        <span>${icon}</span>
        <span>${message}</span>
    `;
    
    container.appendChild(statusDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (statusDiv.parentNode) {
            statusDiv.remove();
        }
    }, 5000);
}

// ===== UTILITY FUNCTIONS =====
function handleFilterChange(event) {
    if (event.target.hasAttribute('data-filter')) {
        // Trigger filter application with a small delay for better UX
        clearTimeout(window.filterTimeout);
        window.filterTimeout = setTimeout(() => {
            aplicarFiltres();
        }, 300);
    }
}

// ===== PROGRESS BAR FUNCTIONS =====
function showProgressBar() {
    const progressBar = document.getElementById('progressBar');
    const progressFill = progressBar.querySelector('.progress-fill');
    const progressText = progressBar.querySelector('.progress-text');
    
    progressBar.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = 'Carregant dades...';
}

function updateProgress(percentage, text) {
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    
    if (progressFill && progressText) {
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = text || `Carregant... ${percentage}%`;
    }
}

function hideProgressBar() {
    const progressBar = document.getElementById('progressBar');
    progressBar.style.display = 'none';
}

// ===== SUMMARY TABLE FUNCTIONS =====
function updateSummaryTable() {
    const container = document.getElementById('summaryTableContainer');
    const tbody = document.getElementById('summaryTableBody');
    
    if (!container || !tbody) return;
    
    // Calcular estadístiques
    const totalAlumnes = new Set(filteredData.map(item => item.estudiant_nom)).size;
    const totalAssoliments = filteredData.length;
    const assolits = filteredData.filter(item => item.assoliment !== 'NA').length;
    const noAssolits = filteredData.filter(item => item.assoliment === 'NA').length;
    const percentAssolits = totalAssoliments > 0 ? Math.round((assolits / totalAssoliments) * 100) : 0;
    const percentNoAssolits = totalAssoliments > 0 ? Math.round((noAssolits / totalAssoliments) * 100) : 0;
    
    // Desglossament per tipus d'assoliment
    const ae = filteredData.filter(item => item.assoliment === 'AE').length;
    const an = filteredData.filter(item => item.assoliment === 'AN').length;
    const as = filteredData.filter(item => item.assoliment === 'AS').length;
    const na = filteredData.filter(item => item.assoliment === 'NA').length;
    
    const percentAE = totalAssoliments > 0 ? Math.round((ae / totalAssoliments) * 100) : 0;
    const percentAN = totalAssoliments > 0 ? Math.round((an / totalAssoliments) * 100) : 0;
    const percentAS = totalAssoliments > 0 ? Math.round((as / totalAssoliments) * 100) : 0;
    const percentNA = totalAssoliments > 0 ? Math.round((na / totalAssoliments) * 100) : 0;
    
    // Mitjana general
    const mitjanaGeneral = totalAssoliments > 0 ? 
        (filteredData.reduce((sum, item) => sum + item.valor_numeric, 0) / totalAssoliments).toFixed(2) : '0.00';
    
    tbody.innerHTML = `
        <tr><td>Total Alumnes</td><td>${totalAlumnes}</td></tr>
        <tr><td>Total Assoliments</td><td>${totalAssoliments}</td></tr>
        <tr><td>Nº Assolits</td><td>${assolits}</td></tr>
        <tr><td>% Assolits</td><td>${percentAssolits}%</td></tr>
        <tr><td>Nº No Assolits</td><td>${noAssolits}</td></tr>
        <tr><td>% No Assolits</td><td>${percentNoAssolits}%</td></tr>
        <tr><td>Mitjana General</td><td>${mitjanaGeneral}</td></tr>
        <tr><td>AE (Excel·lent)</td><td>${ae} (${percentAE}%)</td></tr>
        <tr><td>AN (Notable)</td><td>${an} (${percentAN}%)</td></tr>
        <tr><td>AS (Assolit)</td><td>${as} (${percentAS}%)</td></tr>
        <tr><td>NA (No Assolit)</td><td>${na} (${percentNA}%)</td></tr>
    `;
    
    container.style.display = 'block';
}

// ===== NAVIGATION MARKER =====
function showNavigationMarker() {
    const marker = document.getElementById('navigationMarker');
    if (marker) {
        marker.style.display = 'block';
    }
}

function hideNavigationMarker() {
    const marker = document.getElementById('navigationMarker');
    if (marker) {
        marker.style.display = 'none';
    }
}

// ===== PLACEHOLDER FUNCTIONS FOR OTHER CHARTS =====
function crearGraficTrimestres() {
    const ctx = document.getElementById('trimestresChart');
    if (!ctx) return;
    
    const trimestres = ['1r trim', '2n trim', '3r trim', 'final'];
    const assoliments = ['NA', 'AS', 'AN', 'AE'];
    const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
    
    const datasets = assoliments.map((assoliment, index) => {
        const data = trimestres.map(trimestre => 
            filteredData.filter(item => 
                item.trimestre === trimestre && item.assoliment === assoliment
            ).length
        );
        
        return {
            label: ['No Assolit', 'Assolit', 'Notable', 'Excel·lent'][index],
            data: data,
            backgroundColor: colors[index],
            borderColor: colors[index],
            borderWidth: 2
        };
    });
    
    if (charts.trimestres) {
        charts.trimestres.destroy();
    }
    
    charts.trimestres = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: trimestres,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true
                }
            }
        }
    });
}

function crearGraficEvolucioTemporal() {
    const ctx = document.getElementById('evolucioTemporalChart');
    if (!ctx) return;
    
    const trimestres = ['1r trim', '2n trim', '3r trim', 'final'];
    const classes = [...new Set(filteredData.map(item => item.classe))];
    
    const datasets = classes.map((classe, index) => {
        const data = trimestres.map(trimestre => {
            const items = filteredData.filter(item => 
                item.trimestre === trimestre && item.classe === classe
            );
            if (items.length === 0) return 0;
            const mitjana = items.reduce((sum, item) => sum + item.valor_numeric, 0) / items.length;
            return Math.round(mitjana * 100) / 100;
        });
        
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        return {
            label: classe,
            data: data,
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length] + '20',
            borderWidth: 3,
            fill: false,
            tension: 0.4
        };
    });
    
    if (charts.evolucioTemporal) {
        charts.evolucioTemporal.destroy();
    }
    
    charts.evolucioTemporal = new Chart(ctx, {
        type: 'line',
        data: {
            labels: trimestres,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 3
                }
            }
        }
    });
}

function crearGraficAssignatures() {
    const ctx = document.getElementById('assignaturesChart');
    if (!ctx) return;
    
    const assignatures = [...new Set(filteredData.map(item => item.assignatura_nom))];
    const mitjanes = assignatures.map(assignatura => {
        const data = filteredData.filter(item => item.assignatura_nom === assignatura);
        const mitjana = data.reduce((sum, item) => sum + item.valor_numeric, 0) / data.length;
        return Math.round(mitjana * 100) / 100;
    });
    
    if (charts.assignatures) {
        charts.assignatures.destroy();
    }
    
    charts.assignatures = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: assignatures,
            datasets: [{
                label: 'Rendiment Mitjà',
                data: mitjanes,
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(59, 130, 246, 1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 3,
                    ticks: {
                        stepSize: 0.5
                    }
                }
            }
        }
    });
}

function crearGraficAssolimentsAssignatures() {
    const ctx = document.getElementById('assolimentsAssignaturesChart');
    if (!ctx) return;
    
    const assignatures = [...new Set(filteredData.map(item => item.assignatura_nom))];
    const assoliments = ['NA', 'AS', 'AN', 'AE'];
    const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
    
    const datasets = assoliments.map((assoliment, index) => {
        const data = assignatures.map(assignatura => 
            filteredData.filter(item => 
                item.assignatura_nom === assignatura && item.assoliment === assoliment
            ).length
        );
        
        return {
            label: ['No Assolit', 'Assolit', 'Notable', 'Excel·lent'][index],
            data: data,
            backgroundColor: colors[index],
            borderColor: colors[index],
            borderWidth: 1
        };
    });
    
    if (charts.assolimentsAssignatures) {
        charts.assolimentsAssignatures.destroy();
    }
    
    charts.assolimentsAssignatures = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: assignatures,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true
                }
            }
        }
    });
}

function crearGraficClasses() {
    const ctx = document.getElementById('classesChart');
    if (!ctx) return;
    
    const classes = [...new Set(filteredData.map(item => item.classe))];
    const assoliments = ['NA', 'AS', 'AN', 'AE'];
    const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
    
    const datasets = assoliments.map((assoliment, index) => {
        const data = classes.map(classe => 
            filteredData.filter(item => 
                item.classe === classe && item.assoliment === assoliment
            ).length
        );
        
        return {
            label: ['No Assolit', 'Assolit', 'Notable', 'Excel·lent'][index],
            data: data,
            backgroundColor: colors[index],
            borderColor: colors[index],
            borderWidth: 1
        };
    });
    
    if (charts.classes) {
        charts.classes.destroy();
    }
    
    charts.classes = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: classes,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true
                }
            }
        }
    });
}

function crearGraficDistribucioGrups() {
    const ctx = document.getElementById('distribucioGrupsChart');
    if (!ctx) return;
    
    const classes = [...new Set(filteredData.map(item => item.classe))];
    const counts = classes.map(classe => 
        filteredData.filter(item => item.classe === classe).length
    );
    
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    
    if (charts.distribucioGrups) {
        charts.distribucioGrups.destroy();
    }
    
    charts.distribucioGrups = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: classes,
            datasets: [{
                data: counts,
                backgroundColor: colors.slice(0, classes.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

function crearGraficPerfilIndividual() {
    const ctx = document.getElementById('perfilIndividualChart');
    if (!ctx) return;
    
    const estudiant = document.getElementById('estudiantFilter').value;
    if (!estudiant) {
        // Si no hi ha estudiant seleccionat, mostrar un missatge
        if (charts.perfilIndividual) {
            charts.perfilIndividual.destroy();
        }
        return;
    }
    
    const estudiantData = filteredData.filter(item => 
        item.estudiant_nom.includes(estudiant)
    );
    
    const assignatures = [...new Set(estudiantData.map(item => item.assignatura_nom))];
    const mitjanes = assignatures.map(assignatura => {
        const data = estudiantData.filter(item => item.assignatura_nom === assignatura);
        const mitjana = data.reduce((sum, item) => sum + item.valor_numeric, 0) / data.length;
        return Math.round(mitjana * 100) / 100;
    });
    
    if (charts.perfilIndividual) {
        charts.perfilIndividual.destroy();
    }
    
    charts.perfilIndividual = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: assignatures,
            datasets: [{
                label: `Rendiment de ${estudiant}`,
                data: mitjanes,
                backgroundColor: 'rgba(139, 92, 246, 0.8)',
                borderColor: 'rgba(139, 92, 246, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 3
                }
            }
        }
    });
}

function crearGraficEvolucioIndividual() {
    const ctx = document.getElementById('evolucioIndividualChart');
    if (!ctx) return;
    
    const estudiant = document.getElementById('estudiantFilter').value;
    if (!estudiant) {
        // Si no hi ha estudiant seleccionat, mostrar un missatge
        if (charts.evolucioIndividual) {
            charts.evolucioIndividual.destroy();
        }
        return;
    }
    
    const trimestres = ['1r trim', '2n trim', '3r trim', 'final'];
    const estudiantData = filteredData.filter(item => 
        item.estudiant_nom.includes(estudiant)
    );
    
    const mitjanes = trimestres.map(trimestre => {
        const data = estudiantData.filter(item => item.trimestre === trimestre);
        if (data.length === 0) return 0;
        const mitjana = data.reduce((sum, item) => sum + item.valor_numeric, 0) / data.length;
        return Math.round(mitjana * 100) / 100;
    });
    
    if (charts.evolucioIndividual) {
        charts.evolucioIndividual.destroy();
    }
    
    charts.evolucioIndividual = new Chart(ctx, {
        type: 'line',
        data: {
            labels: trimestres,
            datasets: [{
                label: `Evolució de ${estudiant}`,
                data: mitjanes,
                borderColor: 'rgba(16, 185, 129, 1)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 3
                }
            }
        }
    });
} 

// ===== FUNCIONALITATS DE COMPARATIVES ESTADÍSTIQUES =====

// Inicialitzar funcionalitats de comparatives
function inicialitzarComparatives() {
    console.log('📊 Inicialitzant funcionalitats de comparatives...');
    
    // Event listeners per comparatives
    document.getElementById('generarComparativa').addEventListener('click', generarComparativa);
    document.getElementById('exportarComparativa').addEventListener('click', exportarComparativa);
    
    // Event listeners per vista comparativa detallada
    const toggleButton = document.getElementById('toggleComparativaView');
    const exportButton = document.getElementById('exportComparativaDetallada');
    
    if (toggleButton) {
        toggleButton.addEventListener('click', toggleComparativaView);
    }
    
    if (exportButton) {
        exportButton.addEventListener('click', exportComparativaDetallada);
    }
    
    // Event listeners per comparativa avançada
    const exportAvancadaButton = document.getElementById('exportComparativaAvancada');
    if (exportAvancadaButton) {
        exportAvancadaButton.addEventListener('click', exportComparativaAvancada);
    }
    
    // Carregar opcions dels filtres de comparatives
    carregarOpcionsComparatives();
}

// Carregar opcions dels filtres de comparatives
async function carregarOpcionsComparatives() {
    try {
        console.log('🔄 Carregant opcions per comparatives...');
        
        // Carregar classes des de les dades actuals
        if (currentData.length > 0) {
            const classes = [...new Set(currentData.map(e => e.classe))].sort();
            const classeSelect = document.getElementById('comparativaClasse');
            if (classeSelect) {
                classeSelect.innerHTML = '<option value="">Totes les classes</option>';
                classes.forEach(classe => {
                    classeSelect.innerHTML += `<option value="${classe}">${classe}</option>`;
                });
            }
            
            // Carregar assignatures des de les dades actuals
            const assignatures = [...new Set(currentData.map(e => e.assignatura_nom))].sort();
            const assignaturaSelect = document.getElementById('comparativaAssignatura');
            if (assignaturaSelect) {
                assignaturaSelect.innerHTML = '<option value="">Totes les assignatures</option>';
                assignatures.forEach(ass => {
                    assignaturaSelect.innerHTML += `<option value="${ass}">${ass}</option>`;
                });
            }
        } else {
            // Si no hi ha dades, intentar carregar des del servidor
            const classesResponse = await fetch('/api/estudiants');
            const classesData = await classesResponse.json();
            if (classesData.success) {
                const classes = [...new Set(classesData.data.map(e => e.classe))];
                const classeSelect = document.getElementById('comparativaClasse');
                if (classeSelect) {
                    classeSelect.innerHTML = '<option value="">Totes les classes</option>';
                    classes.forEach(classe => {
                        classeSelect.innerHTML += `<option value="${classe}">${classe}</option>`;
                    });
                }
            }
            
            const assignaturesResponse = await fetch('/api/assignatures');
            const assignaturesData = await assignaturesResponse.json();
            if (assignaturesData.success) {
                const assignaturaSelect = document.getElementById('comparativaAssignatura');
                if (assignaturaSelect) {
                    assignaturaSelect.innerHTML = '<option value="">Totes les assignatures</option>';
                    assignaturesData.data.forEach(ass => {
                        assignaturaSelect.innerHTML += `<option value="${ass.nom}">${ass.nom}</option>`;
                    });
                }
            }
        }
        
        console.log('✅ Opcions de comparatives carregades');
    } catch (error) {
        console.error('❌ Error carregant opcions de comparatives:', error);
        showStatus('error', 'Error carregant opcions de comparatives');
    }
}

// Generar comparativa segons el tipus seleccionat
async function generarComparativa() {
    const tipus = document.getElementById('comparativaType').value;
    const classe = document.getElementById('comparativaClasse').value;
    const assignatura = document.getElementById('comparativaAssignatura').value;
    const trimestre = document.getElementById('comparativaTrimestre').value;
    
    if (!tipus) {
        showStatus('warning', 'Si us plau, selecciona un tipus de comparativa');
        return;
    }
    
    console.log(`🔄 Generant comparativa: ${tipus}`);
    console.log(`📊 Filtres: classe=${classe}, assignatura=${assignatura}, trimestre=${trimestre}`);
    
    showStatus('info', 'Generant comparativa...');
    
    try {
        let url = `/api/estadistiques/comparativa/${tipus}?`;
        const params = new URLSearchParams();
        
        if (classe) params.append('classe', classe);
        if (assignatura) params.append('assignatura', assignatura);
        if (trimestre) params.append('trimestre', trimestre);
        
        url += params.toString();
        
        console.log(`🌐 Cridant API: ${url}`);
        
        const response = await fetch(url);
        const result = await response.json();
        
        console.log('📊 Resposta de la API:', result);
        
        if (result.success) {
            mostrarComparativa(tipus, result.data);
            showStatus('success', 'Comparativa generada correctament');
        } else {
            console.error('❌ Error de l\'API:', result.error);
            showStatus('error', 'Error generant la comparativa: ' + result.error);
        }
    } catch (error) {
        console.error('❌ Error de connexió:', error);
        showStatus('error', 'Error de connexió generant la comparativa');
    }
}

// Mostrar comparativa segons el tipus
function mostrarComparativa(tipus, data) {
    console.log(`📊 Mostrant comparativa de tipus: ${tipus}`, data);
    
    if (!data || data.length === 0) {
        showStatus('warning', 'No hi ha dades disponibles per a aquesta comparativa');
        return;
    }
    
    try {
        switch (tipus) {
            case 'materies':
                mostrarComparativaMateries(data);
                break;
            case 'grups':
                mostrarComparativaGrups(data);
                break;
            case 'temporal':
                mostrarComparativaTemporal(data);
                break;
            case 'multidimensional':
                mostrarComparativaMultidimensional(data);
                break;
            case 'correlacions':
                mostrarComparativaCorrelacions(data);
                break;
            case 'variancia':
                mostrarComparativaVariancia(data);
                break;
            default:
                showStatus('error', 'Tipus de comparativa no reconegut');
        }
    } catch (error) {
        console.error('❌ Error mostrant comparativa:', error);
        showStatus('error', 'Error mostrant la comparativa: ' + error.message);
    }
}

// Comparativa entre materies
function mostrarComparativaMateries(data) {
    // Gràfic principal
    const ctx = document.getElementById('comparativaChart').getContext('2d');
    if (charts.comparativaChart) charts.comparativaChart.destroy();
    
    charts.comparativaChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(item => item.nom),
            datasets: [{
                label: 'Mitjana',
                data: data.map(item => parseFloat(item.mitjana) || 0),
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 2
            }, {
                label: '% Èxit',
                data: data.map(item => parseFloat(item.percentatge_exit) || 0),
                backgroundColor: 'rgba(34, 197, 94, 0.8)',
                borderColor: 'rgba(34, 197, 94, 1)',
                borderWidth: 2,
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Mitjana'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: '% Èxit'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Comparativa de Rendiment per Materia'
                }
            }
        }
    });
    
    // Gràfic detallat
    const ctx2 = document.getElementById('analisiDetalladaChart').getContext('2d');
    if (charts.analisiDetalladaChart) charts.analisiDetalladaChart.destroy();
    
    charts.analisiDetalladaChart = new Chart(ctx2, {
        type: 'radar',
        data: {
            labels: data.map(item => item.nom),
            datasets: [{
                label: 'Mitjana',
                data: data.map(item => parseFloat(item.mitjana) || 0),
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(59, 130, 246, 1)'
            }, {
                label: '% Èxit',
                data: data.map(item => parseFloat(item.percentatge_exit) || 0),
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                borderColor: 'rgba(34, 197, 94, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(34, 197, 94, 1)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Anàlisi Detallada per Materia'
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
    
    // Taula de resultats
    actualitzarTaulaComparativa(data.map(item => ({
        metrica: item.nom,
        valor: `${parseFloat(item.mitjana || 0).toFixed(2)}`,
        comparacio: `${parseFloat(item.percentatge_exit || 0).toFixed(1)}% èxit`,
        significancia: parseFloat(item.percentatge_exit || 0) >= 80 ? 'Alta' : 
                      parseFloat(item.percentatge_exit || 0) >= 60 ? 'Mitjana' : 'Baixa'
    })));
}

// Comparativa entre grups
function mostrarComparativaGrups(data) {
    // Gràfic principal
    const ctx = document.getElementById('comparativaChart').getContext('2d');
    if (charts.comparativaChart) charts.comparativaChart.destroy();
    
    charts.comparativaChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(item => item.classe),
            datasets: [{
                label: 'Mitjana',
                data: data.map(item => parseFloat(item.mitjana) || 0),
                backgroundColor: 'rgba(168, 85, 247, 0.8)',
                borderColor: 'rgba(168, 85, 247, 1)',
                borderWidth: 2
            }, {
                label: 'Desviació Estàndard',
                data: data.map(item => parseFloat(item.desviacio_estandard) || 0),
                backgroundColor: 'rgba(251, 146, 60, 0.8)',
                borderColor: 'rgba(251, 146, 60, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Comparativa de Rendiment per Grup'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Gràfic detallat
    const ctx2 = document.getElementById('analisiDetalladaChart').getContext('2d');
    if (charts.analisiDetalladaChart) charts.analisiDetalladaChart.destroy();
    
    charts.analisiDetalladaChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: data.map(item => item.classe),
            datasets: [{
                data: data.map(item => parseInt(item.total_estudiants) || 0),
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(168, 85, 247, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(251, 146, 60, 0.8)',
                    'rgba(239, 68, 68, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribució d\'Estudiants per Grup'
                }
            }
        }
    });
    
    // Taula de resultats
    actualitzarTaulaComparativa(data.map(item => ({
        metrica: item.classe,
        valor: `${parseFloat(item.mitjana || 0).toFixed(2)}`,
        comparacio: `${parseFloat(item.percentatge_exit || 0).toFixed(1)}% èxit`,
        significancia: parseFloat(item.percentatge_exit || 0) >= 80 ? 'Alta' : 
                      parseFloat(item.percentatge_exit || 0) >= 60 ? 'Mitjana' : 'Baixa'
    })));
}

// Comparativa temporal
function mostrarComparativaTemporal(data) {
    // Gràfic principal
    const ctx = document.getElementById('comparativaChart').getContext('2d');
    if (charts.comparativaChart) charts.comparativaChart.destroy();
    
    charts.comparativaChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(item => item.trimestre),
            datasets: [{
                label: 'Mitjana',
                data: data.map(item => parseFloat(item.mitjana) || 0),
                borderColor: 'rgba(59, 130, 246, 1)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                fill: true
            }, {
                label: '% Èxit',
                data: data.map(item => parseFloat(item.percentatge_exit) || 0),
                borderColor: 'rgba(34, 197, 94, 1)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderWidth: 3,
                fill: true,
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Mitjana'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: '% Èxit'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Evolució Temporal del Rendiment'
                }
            }
        }
    });
    
    // Gràfic detallat
    const ctx2 = document.getElementById('analisiDetalladaChart').getContext('2d');
    if (charts.analisiDetalladaChart) charts.analisiDetalladaChart.destroy();
    
    charts.analisiDetalladaChart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: data.map(item => item.trimestre),
            datasets: [{
                label: 'Excel·lents',
                data: data.map(item => parseInt(item.excelents) || 0),
                backgroundColor: 'rgba(34, 197, 94, 0.8)'
            }, {
                label: 'Notables',
                data: data.map(item => parseInt(item.notables) || 0),
                backgroundColor: 'rgba(59, 130, 246, 0.8)'
            }, {
                label: 'Suficients',
                data: data.map(item => parseInt(item.suficients) || 0),
                backgroundColor: 'rgba(251, 146, 60, 0.8)'
            }, {
                label: 'No Assolits',
                data: data.map(item => parseInt(item.no_assoliments) || 0),
                backgroundColor: 'rgba(239, 68, 68, 0.8)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribució d\'Assoliments per Trimestre'
                }
            },
            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    stacked: true
                }
            }
        }
    });
    
    // Taula de resultats
    actualitzarTaulaComparativa(data.map(item => ({
        metrica: item.trimestre,
        valor: `${parseFloat(item.mitjana || 0).toFixed(2)}`,
        comparacio: `${parseFloat(item.percentatge_exit || 0).toFixed(1)}% èxit`,
        significancia: parseFloat(item.percentatge_exit || 0) >= 80 ? 'Alta' : 
                      parseFloat(item.percentatge_exit || 0) >= 60 ? 'Mitjana' : 'Baixa'
    })));
}

// Comparativa multidimensional
function mostrarComparativaMultidimensional(data) {
    // Crear heatmap
    const ctx = document.getElementById('comparativaChart').getContext('2d');
    if (charts.comparativaChart) charts.comparativaChart.destroy();
    
    // Agrupar dades per assignatura i classe
    const assignatures = [...new Set(data.map(item => item.assignatura_nom))];
    const classes = [...new Set(data.map(item => item.classe))];
    
    const heatmapData = assignatures.map(ass => {
        return classes.map(classe => {
            const item = data.find(d => d.assignatura_nom === ass && d.classe === classe);
            return item ? parseFloat(item.mitjana) || 0 : 0;
        });
    });
    
    charts.comparativaChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: assignatures,
            datasets: classes.map((classe, index) => ({
                label: classe,
                data: heatmapData.map(row => row[index]),
                backgroundColor: `hsl(${index * 60}, 70%, 60%)`,
                borderColor: `hsl(${index * 60}, 70%, 40%)`,
                borderWidth: 1
            }))
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Comparativa Multidimensional: Assignatura vs Classe'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Gràfic detallat
    const ctx2 = document.getElementById('analisiDetalladaChart').getContext('2d');
    if (charts.analisiDetalladaChart) charts.analisiDetalladaChart.destroy();
    
    charts.analisiDetalladaChart = new Chart(ctx2, {
        type: 'scatter',
        data: {
            datasets: classes.map((classe, index) => ({
                label: classe,
                data: data.filter(item => item.classe === classe).map(item => ({
                    x: parseFloat(item.mitjana) || 0,
                    y: parseFloat(item.percentatge_exit) || 0
                })),
                backgroundColor: `hsl(${index * 60}, 70%, 60%)`,
                borderColor: `hsl(${index * 60}, 70%, 40%)`
            }))
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Correlació: Mitjana vs % Èxit per Classe'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Mitjana'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: '% Èxit'
                    }
                }
            }
        }
    });
    
    // Taula de resultats
    actualitzarTaulaComparativa(data.map(item => ({
        metrica: `${item.assignatura_nom} - ${item.classe}`,
        valor: `${parseFloat(item.mitjana || 0).toFixed(2)}`,
        comparacio: `${parseFloat(item.percentatge_exit || 0).toFixed(1)}% èxit`,
        significancia: parseFloat(item.percentatge_exit || 0) >= 80 ? 'Alta' : 
                      parseFloat(item.percentatge_exit || 0) >= 60 ? 'Mitjana' : 'Baixa'
    })));
}

// Comparativa de correlacions
function mostrarComparativaCorrelacions(data) {
    // Gràfic principal - Matriu de correlacions
    const ctx = document.getElementById('comparativaChart').getContext('2d');
    if (charts.comparativaChart) charts.comparativaChart.destroy();
    
    const assignatures = [...new Set([...data.map(item => item.assignatura1), ...data.map(item => item.assignatura2)])];
    const correlacioMatrix = assignatures.map(ass1 => 
        assignatures.map(ass2 => {
            if (ass1 === ass2) return 1;
            const item = data.find(d => 
                (d.assignatura1 === ass1 && d.assignatura2 === ass2) ||
                (d.assignatura1 === ass2 && d.assignatura2 === ass1)
            );
            return item ? Math.abs(parseFloat(item.correlacio)) : 0;
        })
    );
    
    charts.comparativaChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: assignatures,
            datasets: assignatures.map((ass, index) => ({
                label: ass,
                data: correlacioMatrix[index],
                backgroundColor: `hsla(${index * 45}, 70%, 60%, 0.8)`,
                borderColor: `hsla(${index * 45}, 70%, 40%, 1)`,
                borderWidth: 1
            }))
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Matriu de Correlacions entre Materies'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1
                }
            }
        }
    });
    
    // Gràfic detallat
    const ctx2 = document.getElementById('analisiDetalladaChart').getContext('2d');
    if (charts.analisiDetalladaChart) charts.analisiDetalladaChart.destroy();
    
    charts.analisiDetalladaChart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: data.map(item => `${item.assignatura1} ↔ ${item.assignatura2}`),
            datasets: [{
                label: 'Correlació',
                data: data.map(item => parseFloat(item.correlacio) || 0),
                backgroundColor: data.map(item => {
                    const corr = parseFloat(item.correlacio) || 0;
                    return corr > 0.7 ? 'rgba(34, 197, 94, 0.8)' :
                           corr > 0.4 ? 'rgba(251, 146, 60, 0.8)' :
                           'rgba(239, 68, 68, 0.8)';
                }),
                borderColor: data.map(item => {
                    const corr = parseFloat(item.correlacio) || 0;
                    return corr > 0.7 ? 'rgba(34, 197, 94, 1)' :
                           corr > 0.4 ? 'rgba(251, 146, 60, 1)' :
                           'rgba(239, 68, 68, 1)';
                }),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Correlacions entre Parells de Materies'
                }
            },
            scales: {
                y: {
                    min: -1,
                    max: 1
                }
            }
        }
    });
    
    // Taula de resultats
    actualitzarTaulaComparativa(data.map(item => ({
        metrica: `${item.assignatura1} ↔ ${item.assignatura2}`,
        valor: `${(parseFloat(item.correlacio) || 0).toFixed(3)}`,
        comparacio: `${parseInt(item.estudiants_comuns)} estudiants`,
        significancia: Math.abs(parseFloat(item.correlacio) || 0) > 0.7 ? 'Alta' : 
                      Math.abs(parseFloat(item.correlacio) || 0) > 0.4 ? 'Mitjana' : 'Baixa'
    })));
}

// Comparativa d'anàlisi de variància
function mostrarComparativaVariancia(data) {
    const grups = data.grups;
    const estadistics = data.estadistics;
    
    // Gràfic principal
    const ctx = document.getElementById('comparativaChart').getContext('2d');
    if (charts.comparativaChart) charts.comparativaChart.destroy();
    
    charts.comparativaChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: grups.map(item => item.classe),
            datasets: [{
                label: 'Mitjana',
                data: grups.map(item => parseFloat(item.mitjana) || 0),
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 2
            }, {
                label: 'Desviació Estàndard',
                data: grups.map(item => parseFloat(item.desviacio_estandard) || 0),
                backgroundColor: 'rgba(251, 146, 60, 0.8)',
                borderColor: 'rgba(251, 146, 60, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Anàlisi de Variància per Grup'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Gràfic detallat
    const ctx2 = document.getElementById('analisiDetalladaChart').getContext('2d');
    if (charts.analisiDetalladaChart) charts.analisiDetalladaChart.destroy();
    
    charts.analisiDetalladaChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: ['Variància entre grups', 'Variància dins grups'],
            datasets: [{
                data: [estadistics.ssb, estadistics.ssw],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(168, 85, 247, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Descomposició de la Variància'
                }
            }
        }
    });
    
    // Taula de resultats
    const taulaData = [
        {
            metrica: 'Estadístic F',
            valor: estadistics.f_statistic.toFixed(3),
            comparacio: estadistics.significancia,
            significancia: estadistics.f_statistic > 3.0 ? 'Significativa' : 'No significativa'
        },
        {
            metrica: 'R² (Coeficient de determinació)',
            valor: (estadistics.r_squared * 100).toFixed(1) + '%',
            comparacio: `${estadistics.total_observacions} observacions`,
            significancia: estadistics.r_squared > 0.3 ? 'Alta' : 
                          estadistics.r_squared > 0.1 ? 'Mitjana' : 'Baixa'
        },
        {
            metrica: 'Mitjana Global',
            valor: estadistics.mitjana_global.toFixed(2),
            comparacio: `${estadistics.nombre_grups} grups`,
            significancia: 'Referència'
        }
    ];
    
    actualitzarTaulaComparativa(taulaData);
}

// Actualitzar taula de comparativa
function actualitzarTaulaComparativa(data) {
    const tbody = document.getElementById('comparativaTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = data.map(item => `
        <tr>
            <td>${item.metrica}</td>
            <td>${item.valor}</td>
            <td>${item.comparacio}</td>
            <td>
                <span class="percentage ${item.significancia === 'Alta' ? 'high' : 
                                         item.significancia === 'Mitjana' ? 'medium' : 
                                         item.significancia === 'Baixa' ? 'low' : ''}">
                    ${item.significancia}
                </span>
            </td>
        </tr>
    `).join('');
}

// Actualitzar taula comparativa detallada
function actualitzarTaulaComparativaDetallada() {
    const tbody = document.getElementById('comparativaDetalladaTableBody');
    if (!tbody) return;
    
    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">No hi ha dades disponibles</td></tr>';
        actualitzarVistaAgrupada([]);
        return;
    }
    
    // Agrupar per assignatura i trimestre
    const grups = {};
    filteredData.forEach(item => {
        const key = `${item.assignatura_nom}|${item.trimestre}`;
        if (!grups[key]) {
            grups[key] = {
                assignatura: item.assignatura_nom,
                trimestre: item.trimestre,
                total: 0,
                na: 0,
                as: 0,
                an: 0,
                ae: 0
            };
        }
        grups[key].total++;
        
        switch (item.assoliment) {
            case 'NA': grups[key].na++; break;
            case 'AS': grups[key].as++; break;
            case 'AN': grups[key].an++; break;
            case 'AE': grups[key].ae++; break;
        }
    });
    
    // Calcular percentatges i ordenar
    const resultats = Object.values(grups).map(grup => ({
        ...grup,
        percentNA: grup.total > 0 ? Math.round((grup.na / grup.total) * 100) : 0,
        percentAS: grup.total > 0 ? Math.round((grup.as / grup.total) * 100) : 0,
        percentAN: grup.total > 0 ? Math.round((grup.an / grup.total) * 100) : 0,
        percentAE: grup.total > 0 ? Math.round((grup.ae / grup.total) * 100) : 0,
        percentAssolits: grup.total > 0 ? Math.round(((grup.as + grup.an + grup.ae) / grup.total) * 100) : 0
    })).sort((a, b) => {
        // Ordenar per assignatura i després per trimestre
        if (a.assignatura !== b.assignatura) {
            return a.assignatura.localeCompare(b.assignatura);
        }
        const trimestreOrder = { '1r trim': 1, '2n trim': 2, '3r trim': 3, 'final': 4 };
        return (trimestreOrder[a.trimestre] || 0) - (trimestreOrder[b.trimestre] || 0);
    });
    
    // Actualitzar taula tradicional
    tbody.innerHTML = resultats.map(item => `
        <tr>
            <td>${item.assignatura}</td>
            <td>${item.trimestre}</td>
            <td>${item.total}</td>
            <td class="percentage ${item.percentNA <= 20 ? 'high' : item.percentNA <= 40 ? 'medium' : 'low'}">${item.percentNA}%</td>
            <td class="percentage ${item.percentAS >= 30 ? 'high' : item.percentAS >= 15 ? 'medium' : 'low'}">${item.percentAS}%</td>
            <td class="percentage ${item.percentAN >= 20 ? 'high' : item.percentAN >= 10 ? 'medium' : 'low'}">${item.percentAN}%</td>
            <td class="percentage ${item.percentAE >= 10 ? 'high' : item.percentAE >= 5 ? 'medium' : 'low'}">${item.percentAE}%</td>
            <td class="percentage ${item.percentAssolits >= 80 ? 'high' : item.percentAssolits >= 60 ? 'medium' : 'low'}">${item.percentAssolits}%</td>
        </tr>
    `).join('');
    
    // Actualitzar vista agrupada
    actualitzarVistaAgrupada(resultats);
}

// Actualitzar vista agrupada per assignatura
function actualitzarVistaAgrupada(resultats) {
    const content = document.getElementById('comparativaGroupedContent');
    if (!content) return;
    
    if (resultats.length === 0) {
        content.innerHTML = '<div class="text-center" style="padding: var(--space-xl); color: var(--neutral-500);">No hi ha dades disponibles</div>';
        return;
    }
    
    // Agrupar per assignatura
    const assignatures = {};
    resultats.forEach(item => {
        if (!assignatures[item.assignatura]) {
            assignatures[item.assignatura] = [];
        }
        assignatures[item.assignatura].push(item);
    });
    
    // Generar HTML per cada assignatura
    const assignaturesHTML = Object.entries(assignatures).map(([assignatura, items]) => {
        // Calcular estadístiques totals de l'assignatura
        const totalStats = {
            total: items.reduce((sum, item) => sum + item.total, 0),
            na: items.reduce((sum, item) => sum + item.na, 0),
            as: items.reduce((sum, item) => sum + item.as, 0),
            an: items.reduce((sum, item) => sum + item.an, 0),
            ae: items.reduce((sum, item) => sum + item.ae, 0)
        };
        
        totalStats.percentNA = totalStats.total > 0 ? Math.round((totalStats.na / totalStats.total) * 100) : 0;
        totalStats.percentAS = totalStats.total > 0 ? Math.round((totalStats.as / totalStats.total) * 100) : 0;
        totalStats.percentAN = totalStats.total > 0 ? Math.round((totalStats.an / totalStats.total) * 100) : 0;
        totalStats.percentAE = totalStats.total > 0 ? Math.round((totalStats.ae / totalStats.total) * 100) : 0;
        totalStats.percentAssolits = totalStats.total > 0 ? Math.round(((totalStats.as + totalStats.an + totalStats.ae) / totalStats.total) * 100) : 0;
        
        // Generar HTML dels trimestres
        const trimestresHTML = items.map(item => `
            <div class="comparativa-trimestre">
                <div class="comparativa-trimestre-header">
                    <span class="comparativa-trimestre-title">${item.trimestre}</span>
                    <span class="comparativa-trimestre-total">${item.total} estudiants</span>
                </div>
                <div class="comparativa-progress-bars">
                    <div class="comparativa-progress-item">
                        <span class="comparativa-progress-label">NA</span>
                        <div class="comparativa-progress-bar">
                            <div class="comparativa-progress-fill na" style="width: ${item.percentNA}%"></div>
                        </div>
                        <span class="comparativa-progress-value">${item.percentNA}%</span>
                    </div>
                    <div class="comparativa-progress-item">
                        <span class="comparativa-progress-label">AS</span>
                        <div class="comparativa-progress-bar">
                            <div class="comparativa-progress-fill as" style="width: ${item.percentAS}%"></div>
                        </div>
                        <span class="comparativa-progress-value">${item.percentAS}%</span>
                    </div>
                    <div class="comparativa-progress-item">
                        <span class="comparativa-progress-label">AN</span>
                        <div class="comparativa-progress-bar">
                            <div class="comparativa-progress-fill an" style="width: ${item.percentAN}%"></div>
                        </div>
                        <span class="comparativa-progress-value">${item.percentAN}%</span>
                    </div>
                    <div class="comparativa-progress-item">
                        <span class="comparativa-progress-label">AE</span>
                        <div class="comparativa-progress-bar">
                            <div class="comparativa-progress-fill ae" style="width: ${item.percentAE}%"></div>
                        </div>
                        <span class="comparativa-progress-value">${item.percentAE}%</span>
                    </div>
                </div>
                <div class="comparativa-summary">
                    <div class="comparativa-summary-value">${item.percentAssolits}%</div>
                    <div class="comparativa-summary-label">Assolits</div>
                </div>
            </div>
        `).join('');
        
        return `
            <div class="comparativa-group">
                <div class="comparativa-group-header">
                    <h4 class="comparativa-group-title">
                        <svg class="icon" viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px;">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        ${assignatura}
                    </h4>
                    <div class="comparativa-group-stats">
                        <div class="comparativa-stat">
                            <div class="comparativa-stat-label">Total</div>
                            <div class="comparativa-stat-value">${totalStats.total}</div>
                        </div>
                        <div class="comparativa-stat">
                            <div class="comparativa-stat-label">% Assolits</div>
                            <div class="comparativa-stat-value">${totalStats.percentAssolits}%</div>
                        </div>
                        <div class="comparativa-stat">
                            <div class="comparativa-stat-label">% NA</div>
                            <div class="comparativa-stat-value">${totalStats.percentNA}%</div>
                        </div>
                    </div>
                </div>
                <div class="comparativa-trimestres">
                    ${trimestresHTML}
                </div>
            </div>
        `;
    }).join('');
    
    content.innerHTML = assignaturesHTML;
}

// Actualitzar comparativa avançada
function actualitzarComparativaAvancada() {
    const content = document.getElementById('comparativaAvancadaContent');
    if (!content) return;
    
    if (filteredData.length === 0) {
        content.innerHTML = '<div class="text-center" style="padding: var(--space-xl); color: var(--neutral-500);">No hi ha dades disponibles</div>';
        return;
    }
    
    // Agrupar per assignatura i trimestre
    const grups = {};
    filteredData.forEach(item => {
        const key = `${item.assignatura_nom}|${item.trimestre}`;
        if (!grups[key]) {
            grups[key] = {
                assignatura: item.assignatura_nom,
                trimestre: item.trimestre,
                total: 0,
                na: 0,
                as: 0,
                an: 0,
                ae: 0
            };
        }
        grups[key].total++;
        
        switch (item.assoliment) {
            case 'NA': grups[key].na++; break;
            case 'AS': grups[key].as++; break;
            case 'AN': grups[key].an++; break;
            case 'AE': grups[key].ae++; break;
        }
    });
    
    // Calcular percentatges
    const resultats = Object.values(grups).map(grup => ({
        ...grup,
        percentNA: grup.total > 0 ? Math.round((grup.na / grup.total) * 100) : 0,
        percentAS: grup.total > 0 ? Math.round((grup.as / grup.total) * 100) : 0,
        percentAN: grup.total > 0 ? Math.round((grup.an / grup.total) * 100) : 0,
        percentAE: grup.total > 0 ? Math.round((grup.ae / grup.total) * 100) : 0,
        percentAssolits: grup.total > 0 ? Math.round(((grup.as + grup.an + grup.ae) / grup.total) * 100) : 0
    }));
    
    // Agrupar per assignatura
    const assignatures = {};
    resultats.forEach(item => {
        if (!assignatures[item.assignatura]) {
            assignatures[item.assignatura] = [];
        }
        assignatures[item.assignatura].push(item);
    });
    
    // Generar HTML per cada assignatura
    const assignaturesHTML = Object.entries(assignatures).map(([assignatura, items]) => {
        // Calcular estadístiques totals de l'assignatura
        const totalStats = {
            total: items.reduce((sum, item) => sum + item.total, 0),
            na: items.reduce((sum, item) => sum + item.na, 0),
            as: items.reduce((sum, item) => sum + item.as, 0),
            an: items.reduce((sum, item) => sum + item.an, 0),
            ae: items.reduce((sum, item) => sum + item.ae, 0)
        };
        
        totalStats.percentNA = totalStats.total > 0 ? Math.round((totalStats.na / totalStats.total) * 100) : 0;
        totalStats.percentAS = totalStats.total > 0 ? Math.round((totalStats.as / totalStats.total) * 100) : 0;
        totalStats.percentAN = totalStats.total > 0 ? Math.round((totalStats.an / totalStats.total) * 100) : 0;
        totalStats.percentAE = totalStats.total > 0 ? Math.round((totalStats.ae / totalStats.total) * 100) : 0;
        totalStats.percentAssolits = totalStats.total > 0 ? Math.round(((totalStats.as + totalStats.an + totalStats.ae) / totalStats.total) * 100) : 0;
        
        // Crear mapa de trimestres per accés ràpid
        const trimestresMap = {};
        items.forEach(item => {
            trimestresMap[item.trimestre] = item;
        });
        
        // Definir ordre dels trimestres
        const trimestresOrder = ['1r trim', '2n trim', '3r trim', 'final'];
        
        // Generar HTML dels trimestres
        const trimestresHTML = trimestresOrder.map(trimestre => {
            const item = trimestresMap[trimestre];
            if (!item) {
                return `
                    <div class="comparativa-avancada-trimestre">
                        <div class="comparativa-avancada-trimestre-header">
                            <div class="comparativa-avancada-trimestre-title">${trimestre}</div>
                            <div class="comparativa-avancada-trimestre-total">0 estudiants</div>
                        </div>
                        <div class="comparativa-avancada-progress-bars">
                            <div class="comparativa-avancada-progress-item">
                                <div class="comparativa-avancada-progress-label">
                                    <span>NA</span>
                                    <span>0%</span>
                                </div>
                                <div class="comparativa-avancada-progress-bar">
                                    <div class="comparativa-avancada-progress-fill na" style="width: 0%"></div>
                                </div>
                            </div>
                            <div class="comparativa-avancada-progress-item">
                                <div class="comparativa-avancada-progress-label">
                                    <span>AS</span>
                                    <span>0%</span>
                                </div>
                                <div class="comparativa-avancada-progress-bar">
                                    <div class="comparativa-avancada-progress-fill as" style="width: 0%"></div>
                                </div>
                            </div>
                            <div class="comparativa-avancada-progress-item">
                                <div class="comparativa-avancada-progress-label">
                                    <span>AN</span>
                                    <span>0%</span>
                                </div>
                                <div class="comparativa-avancada-progress-bar">
                                    <div class="comparativa-avancada-progress-fill an" style="width: 0%"></div>
                                </div>
                            </div>
                            <div class="comparativa-avancada-progress-item">
                                <div class="comparativa-avancada-progress-label">
                                    <span>AE</span>
                                    <span>0%</span>
                                </div>
                                <div class="comparativa-avancada-progress-bar">
                                    <div class="comparativa-avancada-progress-fill ae" style="width: 0%"></div>
                                </div>
                            </div>
                        </div>
                        <div class="comparativa-avancada-summary">
                            <div class="comparativa-avancada-summary-value">0%</div>
                            <div class="comparativa-avancada-summary-label">Assolits</div>
                        </div>
                    </div>
                `;
            }
            
            return `
                <div class="comparativa-avancada-trimestre">
                    <div class="comparativa-avancada-trimestre-header">
                        <div class="comparativa-avancada-trimestre-title">${item.trimestre}</div>
                        <div class="comparativa-avancada-trimestre-total">${item.total} estudiants</div>
                    </div>
                    <div class="comparativa-avancada-progress-bars">
                        <div class="comparativa-avancada-progress-item">
                            <div class="comparativa-avancada-progress-label">
                                <span>NA</span>
                                <span>${item.percentNA}%</span>
                            </div>
                            <div class="comparativa-avancada-progress-bar">
                                <div class="comparativa-avancada-progress-fill na" style="width: ${item.percentNA}%"></div>
                            </div>
                        </div>
                        <div class="comparativa-avancada-progress-item">
                            <div class="comparativa-avancada-progress-label">
                                <span>AS</span>
                                <span>${item.percentAS}%</span>
                            </div>
                            <div class="comparativa-avancada-progress-bar">
                                <div class="comparativa-avancada-progress-fill as" style="width: ${item.percentAS}%"></div>
                            </div>
                        </div>
                        <div class="comparativa-avancada-progress-item">
                            <div class="comparativa-avancada-progress-label">
                                <span>AN</span>
                                <span>${item.percentAN}%</span>
                            </div>
                            <div class="comparativa-avancada-progress-bar">
                                <div class="comparativa-avancada-progress-fill an" style="width: ${item.percentAN}%"></div>
                            </div>
                        </div>
                        <div class="comparativa-avancada-progress-item">
                            <div class="comparativa-avancada-progress-label">
                                <span>AE</span>
                                <span>${item.percentAE}%</span>
                            </div>
                            <div class="comparativa-avancada-progress-bar">
                                <div class="comparativa-avancada-progress-fill ae" style="width: ${item.percentAE}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="comparativa-avancada-summary">
                        <div class="comparativa-avancada-summary-value">${item.percentAssolits}%</div>
                        <div class="comparativa-avancada-summary-label">Assolits</div>
                    </div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="comparativa-avancada-materia">
                <div class="comparativa-avancada-materia-header">
                    <h3 class="comparativa-avancada-materia-title">
                        <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        ${assignatura}
                    </h3>
                    <div class="comparativa-avancada-materia-stats">
                        <div class="comparativa-avancada-stat">
                            <div class="comparativa-avancada-stat-label">Total</div>
                            <div class="comparativa-avancada-stat-value">${totalStats.total}</div>
                        </div>
                        <div class="comparativa-avancada-stat">
                            <div class="comparativa-avancada-stat-label">% Assolits</div>
                            <div class="comparativa-avancada-stat-value">${totalStats.percentAssolits}%</div>
                        </div>
                        <div class="comparativa-avancada-stat">
                            <div class="comparativa-avancada-stat-label">% NA</div>
                            <div class="comparativa-avancada-stat-value">${totalStats.percentNA}%</div>
                        </div>
                    </div>
                </div>
                <div class="comparativa-avancada-trimestres">
                    ${trimestresHTML}
                </div>
            </div>
        `;
    }).join('');
    
    content.innerHTML = assignaturesHTML;
}

// Canviar vista de comparativa detallada
function toggleComparativaView() {
    const tableView = document.getElementById('comparativaTableView');
    const groupedView = document.getElementById('comparativaGroupedView');
    const toggleButton = document.getElementById('toggleComparativaView');
    
    if (tableView.style.display === 'none') {
        // Mostrar vista de taula
        tableView.style.display = 'block';
        groupedView.style.display = 'none';
        toggleButton.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
            </svg>
            Canviar Vista
        `;
        toggleButton.title = 'Canviar a vista agrupada';
    } else {
        // Mostrar vista agrupada
        tableView.style.display = 'none';
        groupedView.style.display = 'block';
        toggleButton.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 6h2v2H4zm0 5h2v2H4zm0 5h2v2H4zm3-10h14v2H7zm0 5h14v2H7zm0 5h14v2H7z"/>
            </svg>
            Canviar Vista
        `;
        toggleButton.title = 'Canviar a vista de taula';
    }
}

// Exportar comparativa detallada
function exportComparativaDetallada() {
    const tbody = document.getElementById('comparativaDetalladaTableBody');
    if (!tbody) {
        showStatus('warning', 'No hi ha dades per exportar');
        return;
    }
    
    const rows = Array.from(tbody.querySelectorAll('tr'));
    if (rows.length === 0 || (rows.length === 1 && rows[0].textContent.includes('Carregant'))) {
        showStatus('warning', 'No hi ha dades per exportar');
        return;
    }
    
    const csvData = [
        ['Comparativa per Assignatura i Trimestre'],
        [''],
        ['Assignatura', 'Trimestre', 'Total', 'NA (%)', 'AS (%)', 'AN (%)', 'AE (%)', '% Assolits']
    ];
    
    rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        if (cells.length === 8) {
            csvData.push([
                cells[0].textContent,
                cells[1].textContent,
                cells[2].textContent,
                cells[3].textContent,
                cells[4].textContent,
                cells[5].textContent,
                cells[6].textContent,
                cells[7].textContent
            ]);
        }
    });
    
    const csv = csvData.map(row => 
        row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    downloadCSV(csv, `comparativa_detallada_${new Date().toISOString().split('T')[0]}.csv`);
    showStatus('success', 'Comparativa detallada exportada correctament');
}

// Exportar comparativa avançada
function exportComparativaAvancada() {
    if (filteredData.length === 0) {
        showStatus('warning', 'No hi ha dades per exportar');
        return;
    }
    
    // Agrupar per assignatura i trimestre
    const grups = {};
    filteredData.forEach(item => {
        const key = `${item.assignatura_nom}|${item.trimestre}`;
        if (!grups[key]) {
            grups[key] = {
                assignatura: item.assignatura_nom,
                trimestre: item.trimestre,
                total: 0,
                na: 0,
                as: 0,
                an: 0,
                ae: 0
            };
        }
        grups[key].total++;
        
        switch (item.assoliment) {
            case 'NA': grups[key].na++; break;
            case 'AS': grups[key].as++; break;
            case 'AN': grups[key].an++; break;
            case 'AE': grups[key].ae++; break;
        }
    });
    
    // Calcular percentatges
    const resultats = Object.values(grups).map(grup => ({
        ...grup,
        percentNA: grup.total > 0 ? Math.round((grup.na / grup.total) * 100) : 0,
        percentAS: grup.total > 0 ? Math.round((grup.as / grup.total) * 100) : 0,
        percentAN: grup.total > 0 ? Math.round((grup.an / grup.total) * 100) : 0,
        percentAE: grup.total > 0 ? Math.round((grup.ae / grup.total) * 100) : 0,
        percentAssolits: grup.total > 0 ? Math.round(((grup.as + grup.an + grup.ae) / grup.total) * 100) : 0
    })).sort((a, b) => {
        if (a.assignatura !== b.assignatura) {
            return a.assignatura.localeCompare(b.assignatura);
        }
        const trimestreOrder = { '1r trim': 1, '2n trim': 2, '3r trim': 3, 'final': 4 };
        return (trimestreOrder[a.trimestre] || 0) - (trimestreOrder[b.trimestre] || 0);
    });
    
    const csvData = [
        ['Comparativa Avançada per Assignatura i Trimestre'],
        [''],
        ['Assignatura', 'Trimestre', 'Total', 'NA (%)', 'AS (%)', 'AN (%)', 'AE (%)', '% Assolits']
    ];
    
    resultats.forEach(item => {
        csvData.push([
            item.assignatura,
            item.trimestre,
            item.total,
            item.percentNA + '%',
            item.percentAS + '%',
            item.percentAN + '%',
            item.percentAE + '%',
            item.percentAssolits + '%'
        ]);
    });
    
    const csv = csvData.map(row => 
        row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    downloadCSV(csv, `comparativa_avancada_${new Date().toISOString().split('T')[0]}.csv`);
    showStatus('success', 'Comparativa avançada exportada correctament');
}

// Exportar comparativa
function exportarComparativa() {
    const tipus = document.getElementById('comparativaType').value;
    if (!tipus) {
        showStatus('warning', 'Si us plau, genera una comparativa abans d\'exportar');
        return;
    }
    
    // Crear CSV amb les dades de la comparativa
    const tbody = document.getElementById('comparativaTableBody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    const csvData = [
        ['Comparativa Estadística', tipus],
        [''],
        ['Mètrica', 'Valor', 'Comparació', 'Significància']
    ];
    
    rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        if (cells.length === 4) {
            csvData.push([
                cells[0].textContent,
                cells[1].textContent,
                cells[2].textContent,
                cells[3].textContent
            ]);
        }
    });
    
    const csv = csvData.map(row => 
        row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    downloadCSV(csv, `comparativa_${tipus}_${new Date().toISOString().split('T')[0]}.csv`);
    showStatus('success', 'Comparativa exportada correctament');
}

 