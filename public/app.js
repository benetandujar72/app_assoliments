// Variables globals
let dadesBrutes = [];
let dadesFiltered = [];
let charts = {};
let currentFilters = {};

// Configuració de l'API
const API_BASE_URL = '/api';

// ========================================
// INICIALITZACIÓ I CONFIGURACIÓ
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    setupFileUpload();
    mostrarMissatgeCarregaInicial();
    checkDatabaseStatus();
});

async function checkDatabaseStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/upload/status`);
        const data = await response.json();
        
        if (data.success && data.data.total_estudiants > 0) {
            // Hi ha dades a la base de dades, carregar-les
            await carregarDades();
            inicialitzarDashboard();
        }
    } catch (error) {
        console.log('No hi ha dades a la base de dades o error de connexió');
    }
}

function mostrarMissatgeCarregaInicial() {
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 3em; margin-bottom: 20px;">📊</div>
            <h3 style="color: #667eea; margin-bottom: 15px;">Benvingut al Dashboard d'Assoliments</h3>
            <p style="font-size: 1.2em; margin-bottom: 20px; color: #555;">
                Per començar, carrega el fitxer CSV amb les dades d'assoliments
            </p>
            <button class="btn" onclick="document.getElementById('fileInput').click()" style="font-size: 16px; padding: 15px 30px;">
                📁 Seleccionar Fitxer CSV
            </button>
            <input type="file" id="fileInput" accept=".csv" />
            <div style="margin-top: 25px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea;">
                <p style="color: #666; font-size: 14px; margin-bottom: 8px;"><strong>Format esperat del CSV:</strong></p>
                <ul style="color: #666; font-size: 13px; text-align: left; margin: 0; padding-left: 20px;">
                    <li>Columna 0: CLASSE (grup de l'alumne)</li>
                    <li>Columna 1: NOM (nom complet de l'alumne)</li>
                    <li>Columnes 2-37: Assoliments per assignatura i trimestre</li>
                    <li>Valors vàlids: NA, AS, AN, AE</li>
                </ul>
            </div>
            <div style="margin-top: 15px; padding: 10px; background: #e8f5e8; border-radius: 6px;">
                <p style="color: #2e7d32; font-size: 12px; margin: 0;">
                    💡 <strong>Consell:</strong> També pots arrossegar el fitxer directament aquí
                </p>
            </div>
        </div>
    `;
    setupFileUpload();
}

function setupFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');

    if (fileInput) {
        const newFileInput = fileInput.cloneNode(true);
        fileInput.parentNode.replaceChild(newFileInput, fileInput);
        newFileInput.addEventListener('change', handleFileSelect);
    }
    
    if (uploadArea) {
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
        uploadArea.addEventListener('click', handleAreaClick);
    }
}

// ========================================
// GESTIÓ D'EVENTS DE CÀRREGA
// ========================================

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        uploadFile(files[0]);
    }
}

function handleAreaClick(e) {
    if (!e.target.classList.contains('btn')) {
        document.getElementById('fileInput').click();
    }
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        uploadFile(file);
    }
}

// ========================================
// UPLOAD DE FITXERS
// ========================================

async function uploadFile(file) {
    if (!file.name.toLowerCase().endsWith('.csv')) {
        mostrarError('Si us plau, selecciona un fitxer CSV vàlid.');
        return;
    }

    console.log('📁 Pujant fitxer:', file.name, 'Mida:', file.size, 'bytes');
    
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div style="font-size: 3em; margin-bottom: 20px;">⏳</div>
            <h3 style="color: #667eea; margin-bottom: 15px;">Pujant ${file.name}...</h3>
            <p style="color: #666;">Si us plau, espera mentre processem les dades</p>
            <div style="margin-top: 20px;">
                <div style="width: 200px; height: 4px; background: #e9ecef; border-radius: 2px; margin: 0 auto; overflow: hidden;">
                    <div style="width: 100%; height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); animation: loading 2s infinite;"></div>
                </div>
            </div>
        </div>
        <style>
            @keyframes loading {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
        </style>
    `;

    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/upload/csv`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ Fitxer processat correctament:', result.data);
            await carregarDades();
            inicialitzarDashboard();
            mostrarNotificacioExit('Fitxer processat correctament!');
        } else {
            throw new Error(result.error || 'Error processant el fitxer');
        }

    } catch (error) {
        console.error('❌ Error pujant el fitxer:', error);
        mostrarError('Error pujant el fitxer: ' + error.message);
        mostrarMissatgeCarregaInicial();
    }
}

// ========================================
// CARREGA DE DADES DES DE L'API
// ========================================

async function carregarDades() {
    try {
        mostrarLoading(true);
        
        // Carregar assoliments
        const assolimentsResponse = await fetch(`${API_BASE_URL}/assoliments`);
        const assolimentsData = await assolimentsResponse.json();
        
        if (!assolimentsData.success) {
            throw new Error('Error carregant assoliments');
        }

        dadesBrutes = assolimentsData.data;
        dadesFiltered = [...dadesBrutes];
        
        console.log('📊 Dades carregades:', dadesBrutes.length, 'assoliments');
        
        // Carregar filtres
        await carregarFiltres();
        
        // Actualitzar estadístiques i gràfics
        actualitzarEstadistiques();
        actualitzarGrafics();
        
        mostrarLoading(false);
        
    } catch (error) {
        console.error('❌ Error carregant dades:', error);
        mostrarError('Error carregant les dades: ' + error.message);
        mostrarLoading(false);
    }
}

async function carregarFiltres() {
    try {
        // Carregar grups
        const grups = [...new Set(dadesBrutes.map(d => d.classe))].sort();
        const grupFilter = document.getElementById('grupFilter');
        grupFilter.innerHTML = '<option value="">Tots els grups</option>';
        grups.forEach(grup => {
            const option = document.createElement('option');
            option.value = grup;
            option.textContent = grup;
            grupFilter.appendChild(option);
        });

        // Carregar alumnes
        const alumnes = [...new Set(dadesBrutes.map(d => d.estudiant_nom))].sort();
        const alumneFilter = document.getElementById('alumneFilter');
        alumneFilter.innerHTML = '<option value="">Tots els alumnes</option>';
        alumnes.forEach(alumne => {
            const option = document.createElement('option');
            option.value = alumne;
            option.textContent = alumne;
            alumneFilter.appendChild(option);
        });

        // Carregar assignatures
        const assignatures = [...new Set(dadesBrutes.map(d => d.assignatura_codi))].sort();
        const assignaturaFilter = document.getElementById('assignaturaFilter');
        assignaturaFilter.innerHTML = '<option value="">Totes les assignatures</option>';
        assignatures.forEach(assignatura => {
            const option = document.createElement('option');
            option.value = assignatura;
            option.textContent = assignatura;
            assignaturaFilter.appendChild(option);
        });

        // Configurar events dels filtres
        document.querySelectorAll('.filter-group select').forEach(select => {
            select.addEventListener('change', aplicarFiltres);
        });

    } catch (error) {
        console.error('Error carregant filtres:', error);
    }
}

// ========================================
// FILTRES I BÚSQUEDA
// ========================================

function aplicarFiltres() {
    const grup = document.getElementById('grupFilter').value;
    const alumne = document.getElementById('alumneFilter').value;
    const assignatura = document.getElementById('assignaturaFilter').value;
    const trimestre = document.getElementById('trimestreFilter').value;
    const assoliment = document.getElementById('assolimentFilter').value;

    currentFilters = { grup, alumne, assignatura, trimestre, assoliment };

    dadesFiltered = dadesBrutes.filter(d => {
        if (grup && d.classe !== grup) return false;
        if (alumne && d.estudiant_nom !== alumne) return false;
        if (assignatura && d.assignatura_codi !== assignatura) return false;
        if (trimestre && d.trimestre !== trimestre) return false;
        if (assoliment && d.assoliment !== assoliment) return false;
        return true;
    });

    console.log('🔍 Filtres aplicats:', currentFilters, 'Resultats:', dadesFiltered.length);
    
    actualitzarEstadistiques();
    actualitzarGrafics();
}

function resetFilters() {
    document.getElementById('grupFilter').value = '';
    document.getElementById('alumneFilter').value = '';
    document.getElementById('assignaturaFilter').value = '';
    document.getElementById('trimestreFilter').value = '';
    document.getElementById('assolimentFilter').value = '';
    
    currentFilters = {};
    dadesFiltered = [...dadesBrutes];
    
    actualitzarEstadistiques();
    actualitzarGrafics();
}

// ========================================
// ESTADÍSTIQUES
// ========================================

function actualitzarEstadistiques() {
    const stats = {
        excellent: dadesFiltered.filter(d => d.assoliment === 'AE').length,
        notable: dadesFiltered.filter(d => d.assoliment === 'AN').length,
        sufficient: dadesFiltered.filter(d => d.assoliment === 'AS').length,
        noAssoliment: dadesFiltered.filter(d => d.assoliment === 'NA').length
    };

    document.getElementById('totalExcellent').textContent = stats.excellent;
    document.getElementById('totalNotable').textContent = stats.notable;
    document.getElementById('totalSufficient').textContent = stats.sufficient;
    document.getElementById('totalNoAssoliment').textContent = stats.noAssoliment;
}

// ========================================
// GRÀFICS
// ========================================

function actualitzarGrafics() {
    destruirTotselGrafics();
    crearGrafics();
}

function destruirTotselGrafics() {
    Object.values(charts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
    charts = {};
}

function crearGrafics() {
    crearGraficDistribucioGlobal();
    crearGraficEvolucioTrimestre();
    crearGraficRankingAssignatures();
    crearGraficExitGrups();
    crearGraficComparativaTrimestre();
    crearGraficProgressio();
    crearGraficAssolimentsAssignatura();
    crearGraficDificultats();
    crearGraficComparativaGrups();
    crearGraficRendimentGrups();
    crearGraficPerfilIndividual();
    crearGraficEvolucioPersonal();
}

function crearGraficDistribucioGlobal() {
    const ctx = document.getElementById('distribucioGlobalChart');
    if (!ctx) return;

    const stats = {
        AE: dadesFiltered.filter(d => d.assoliment === 'AE').length,
        AN: dadesFiltered.filter(d => d.assoliment === 'AN').length,
        AS: dadesFiltered.filter(d => d.assoliment === 'AS').length,
        NA: dadesFiltered.filter(d => d.assoliment === 'NA').length
    };

    charts.distribucioGlobal = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Excel·lent (AE)', 'Notable (AN)', 'Suficient (AS)', 'No Assoliment (NA)'],
            datasets: [{
                data: [stats.AE, stats.AN, stats.AS, stats.NA],
                backgroundColor: ['#4CAF50', '#2196F3', '#FF9800', '#F44336'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function crearGraficEvolucioTrimestre() {
    const ctx = document.getElementById('evolucioTrimestreChart');
    if (!ctx) return;

    const trimestres = ['1', '2', '3', 'FINAL'];
    const mitjanes = trimestres.map(trimestre => {
        const dades = dadesFiltered.filter(d => d.trimestre === trimestre);
        return dades.length > 0 ? dades.reduce((sum, d) => sum + d.valor_numeric, 0) / dades.length : 0;
    });

    charts.evolucioTrimestre = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['1r Trimestre', '2n Trimestre', '3r Trimestre', 'Final'],
            datasets: [{
                label: 'Mitjana d\'Assoliments',
                data: mitjanes,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.4,
                fill: true
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

function crearGraficRankingAssignatures() {
    const ctx = document.getElementById('rankingAssignaturesChart');
    if (!ctx) return;

    const assignatures = {};
    dadesFiltered.forEach(d => {
        if (!assignatures[d.assignatura_codi]) {
            assignatures[d.assignatura_codi] = [];
        }
        assignatures[d.assignatura_codi].push(d.valor_numeric);
    });

    const mitjanes = Object.entries(assignatures).map(([codi, valors]) => ({
        codi,
        mitjana: valors.reduce((sum, v) => sum + v, 0) / valors.length
    })).sort((a, b) => b.mitjana - a.mitjana);

    charts.rankingAssignatures = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: mitjanes.map(a => a.codi),
            datasets: [{
                label: 'Mitjana d\'Assoliments',
                data: mitjanes.map(a => a.mitjana),
                backgroundColor: '#FF8A65',
                borderColor: '#FFAB91',
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

function crearGraficExitGrups() {
    const ctx = document.getElementById('exitGrupsChart');
    if (!ctx) return;

    const grups = {};
    dadesFiltered.forEach(d => {
        if (!grups[d.classe]) {
            grups[d.classe] = { total: 0, exit: 0 };
        }
        grups[d.classe].total++;
        if (d.assoliment === 'AE' || d.assoliment === 'AN') {
            grups[d.classe].exit++;
        }
    });

    const percentatges = Object.entries(grups).map(([grup, stats]) => ({
        grup,
        percentatge: (stats.exit / stats.total) * 100
    })).sort((a, b) => b.percentatge - a.percentatge);

    charts.exitGrups = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: percentatges.map(p => p.grup),
            datasets: [{
                label: 'Percentatge d\'Èxit (%)',
                data: percentatges.map(p => p.percentatge),
                backgroundColor: '#90CAF9',
                borderColor: '#64B5F6',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// Implementar altres gràfics de manera similar...
function crearGraficComparativaTrimestre() {
    // Implementació similar per comparativa de trimestres
}

function crearGraficProgressio() {
    // Implementació similar per progressió temporal
}

function crearGraficAssolimentsAssignatura() {
    // Implementació similar per assoliments per assignatura
}

function crearGraficDificultats() {
    // Implementació similar per assignatures amb dificultats
}

function crearGraficComparativaGrups() {
    // Implementació similar per comparativa entre grups
}

function crearGraficRendimentGrups() {
    // Implementació similar per rendiment per grup
}

function crearGraficPerfilIndividual() {
    // Implementació similar per perfil individual
}

function crearGraficEvolucioPersonal() {
    // Implementació similar per evolució personal
}

// ========================================
// NAVEGACIÓ DE PESTANYES
// ========================================

function showTab(tabName) {
    // Amagar totes les pestanyes
    document.querySelectorAll('.tab-pane').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Desactivar totes les pestanyes
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Mostrar pestanya seleccionada
    document.getElementById(tabName + '-tab').classList.remove('hidden');
    
    // Activar pestanya seleccionada
    event.target.classList.add('active');
}

// ========================================
// EXPORTACIÓ DE DADES
// ========================================

function exportData() {
    const csvContent = generarCSV(dadesFiltered);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'assoliments_export.csv';
    link.click();
}

function generarCSV(dades) {
    const headers = ['Estudiant', 'Classe', 'Assignatura', 'Trimestre', 'Assoliment'];
    const rows = dades.map(d => [d.estudiant_nom, d.classe, d.assignatura_nom, d.trimestre, d.assoliment]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// ========================================
// UTILITATS
// ========================================

function mostrarError(missatge) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.innerHTML = `<strong>Error:</strong> ${missatge}`;
    
    const container = document.querySelector('.container');
    container.insertBefore(errorDiv, container.firstChild);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function mostrarNotificacioExit(missatge) {
    const notificacioDiv = document.createElement('div');
    notificacioDiv.className = 'error';
    notificacioDiv.style.background = 'linear-gradient(135deg, #C8E6C9, #A5D6A7)';
    notificacioDiv.style.color = '#2E7D32';
    notificacioDiv.style.borderLeftColor = '#4CAF50';
    notificacioDiv.innerHTML = `<strong>Èxit:</strong> ${missatge}`;
    
    const container = document.querySelector('.container');
    container.insertBefore(notificacioDiv, container.firstChild);
    
    setTimeout(() => {
        notificacioDiv.remove();
    }, 3000);
}

function mostrarLoading(mostrar) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const dashboard = document.getElementById('dashboard');
    
    if (mostrar) {
        loadingSpinner.classList.remove('hidden');
        dashboard.classList.add('hidden');
    } else {
        loadingSpinner.classList.add('hidden');
        dashboard.classList.remove('hidden');
    }
}

function inicialitzarDashboard() {
    document.getElementById('uploadSection').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
} 