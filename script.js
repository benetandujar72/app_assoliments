// ===== VARIABLES GLOBALS =====
let currentData = [];
let filteredData = [];
let charts = {};
let currentTab = 'general';

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
    
    // Mostrar mensaje de bienvenida
    showStatus('info', 'Benvingut al Dashboard d\'Assoliments. Carrega un fitxer CSV per començar.');
});

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
    const formData = new FormData();
    const blob = new Blob([csvData], { type: 'text/csv' });
    formData.append('file', blob, fileName);
    
    try {
        const response = await fetch('/api/upload/csv', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Fitxer carregat correctament:', result);
            showStatus('success', result.message);
            
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
    }
}

// ===== DATA LOADING =====
async function carregarDadesDelServidor() {
    console.log('📡 Carregant dades del servidor...');
    
    try {
        const response = await fetch('/api/assoliments?limit=10000');
        const result = await response.json();
        
        if (result.success) {
            currentData = result.data;
            filteredData = [...currentData];
            console.log(`✅ Dades carregades: ${currentData.length} assoliments`);
            
            inicialitzarDashboard();
        } else {
            throw new Error(result.error || 'Error carregant dades');
        }
    } catch (error) {
        console.error('❌ Error carregant dades:', error);
        showStatus('error', 'Error carregant dades: ' + error.message);
    }
}

// ===== DASHBOARD INITIALIZATION =====
function inicialitzarDashboard() {
    console.log('🚀 Inicialitzant dashboard...');
    
    // Mostrar seccions
    document.getElementById('filtersSection').style.display = 'block';
    document.getElementById('tabsSection').style.display = 'block';
    
    // Omplir filtres
    omplirFiltres();
    
    // Afegir event listeners als filtres
    afegirEventListenersFiltres();
    
    // Actualitzar gràfics
    actualitzarGraficos();
    
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
    }
}

function resetFiltres() {
    document.querySelectorAll('[data-filter]').forEach(select => {
        select.value = '';
    });
    filteredData = [...currentData];
    actualitzarGraficos();
    actualitzarTaula();
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