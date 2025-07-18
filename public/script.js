// Variables globals
let dadesBrutes = [];
let dadesFiltered = [];
let charts = {};

// Configuració d'assignatures i mapejats
const assignatures = {
    'LIN': { nom: 'Llengua', cols: ['LIN1', 'LIN2', 'LIN3', 'LINF'] },
    'ANG': { nom: 'Anglès', cols: ['ANG1', 'ANG2', 'ANG3', 'ANGF'] },
    'FRA': { nom: 'Francès', cols: ['FRA1', 'FRA2', 'FRA3', 'FRAF'] },
    'MAT': { nom: 'Matemàtiques', cols: ['MAT1', 'MAT2', 'MAT3', 'MATF'] },
    'MUS': { nom: 'Música', cols: ['MUS1', 'MUS2', 'MUS3', 'MUSF'] },
    'EC': { nom: 'Espai Creatiu', cols: ['EC1', 'EC2', 'EC3', 'ECF'] },
    'FIS': { nom: 'Educació Física', cols: ['FIS1', 'FIS2', 'FIS3', 'FISF'] },
    'EG': { nom: 'Espai Globalitzat', cols: ['EG0', 'EG1', 'EX1', 'EG2', 'EX2', 'EG3', 'EG4', 'EGF'] }
};

const trimestres = ['1', '2', '3', 'FINAL'];
const valorsAssoliment = { 'NA': 0, 'AS': 1, 'AN': 2, 'AE': 3 };

// ========================================
// INICIALITZACIÓ I CONFIGURACIÓ
// ========================================

// Esperar a que el DOM esté cargado
window.addEventListener('DOMContentLoaded', () => {
    // Botón para seleccionar CSV
    const selectCsvBtn = document.getElementById('selectCsvBtn');
    const fileInput = document.getElementById('fileInput');
    if (selectCsvBtn && fileInput) {
        selectCsvBtn.addEventListener('click', () => fileInput.click());
    }

    // Botón para resetear filtros
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }

    // Botón para exportar datos
    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', exportData);
    }

    // Botones de pestañas
    const tabGeneral = document.getElementById('tabGeneral');
    if (tabGeneral) tabGeneral.addEventListener('click', () => showTab('general'));
    const tabTrimestres = document.getElementById('tabTrimestres');
    if (tabTrimestres) tabTrimestres.addEventListener('click', () => showTab('trimestres'));
    const tabAssignatures = document.getElementById('tabAssignatures');
    if (tabAssignatures) tabAssignatures.addEventListener('click', () => showTab('assignatures'));
    const tabGrups = document.getElementById('tabGrups');
    if (tabGrups) tabGrups.addEventListener('click', () => showTab('grups'));
    const tabIndividual = document.getElementById('tabIndividual');
    if (tabIndividual) tabIndividual.addEventListener('click', () => showTab('individual'));
    const tabTaula = document.getElementById('tabTaula');
    if (tabTaula) tabTaula.addEventListener('click', () => showTab('taula'));

    // Botón para exportar la tabla detallada
    const exportTaulaBtn = document.getElementById('exportTaulaBtn');
    if (exportTaulaBtn) {
        exportTaulaBtn.addEventListener('click', exportTaula);
    }

    // Evento para cargar el CSV
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                uploadCSV(file);
            }
        });
    }

    // Configurar drag and drop
    setupDragAndDrop();
});

// Función para subir el CSV
function uploadCSV(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    // Mostrar loading
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        uploadArea.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 3em; margin-bottom: 20px;">⏳</div>
                <h3 style="color: #667eea; margin-bottom: 15px;">Pujant ${file.name}...</h3>
                <p style="color: #666;">Si us plau, espera mentre processem les dades</p>
            </div>
        `;
    }

    fetch('/api/upload/csv', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('Fitxer carregat correctament!');
            // Recargar la página para mostrar los datos
            window.location.reload();
        } else {
            alert('Error: ' + (data.error || 'No s\'ha pogut carregar el fitxer.'));
        }
    })
    .catch(err => {
        alert('Error de xarxa o servidor: ' + err.message);
    });
}

function setupDragAndDrop() {
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.currentTarget.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                uploadCSV(files[0]);
            }
        });
    }
}

// ========================================
// GESTIÓ DE FILTRES
// ========================================

function resetFilters() {
    document.getElementById('grupFilter').value = '';
    document.getElementById('alumneFilter').value = '';
    document.getElementById('assignaturaFilter').value = '';
    document.getElementById('trimestreFilter').value = '';
    document.getElementById('assolimentFilter').value = '';
    
    // Recargar datos
    carregarDades();
}

function exportData() {
    // Función para exportar datos filtrados
    alert('Funció d\'exportació en desenvolupament');
}

function exportTaula() {
    // Función para exportar tabla detallada
    alert('Funció d\'exportació de taula en desenvolupament');
}

// ========================================
// NAVEGACIÓ I UTILITATS
// ========================================

function showTab(tabName) {
    // Ocultar todas las pestañas
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.add('hidden');
    });
    
    // Quitar active de todos los tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Mostrar la pestaña seleccionada
    const targetPane = document.getElementById(tabName + '-tab');
    if (targetPane) {
        targetPane.classList.remove('hidden');
    }
    
    // Activar el tab correspondiente
    const targetTab = document.getElementById('tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
    if (targetTab) {
        targetTab.classList.add('active');
    }
}

// ========================================
// CARREGA DE DADES
// ========================================

function carregarDades() {
    // Cargar datos desde la API
    fetch('/api/assoliments')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                dadesBrutes = data.data;
                dadesFiltered = [...dadesBrutes];
                actualitzarInterficie();
            }
        })
        .catch(err => {
            console.error('Error carregant dades:', err);
        });
}

function actualitzarInterficie() {
    // Actualizar estadísticas
    actualitzarEstadistiques();
    
    // Actualizar filtros
    omplirFiltres();
    
    // Crear gráficos
    crearGrafics();
    
    // Actualizar tabla
    actualitzarTaulaDetallada();
}

function actualitzarEstadistiques() {
    const stats = {
        AE: dadesFiltered.filter(row => row.assoliment === 'AE').length,
        AN: dadesFiltered.filter(row => row.assoliment === 'AN').length,
        AS: dadesFiltered.filter(row => row.assoliment === 'AS').length,
        NA: dadesFiltered.filter(row => row.assoliment === 'NA').length
    };

    const totalExcellent = document.getElementById('totalExcellent');
    const totalNotable = document.getElementById('totalNotable');
    const totalSufficient = document.getElementById('totalSufficient');
    const totalNoAssoliment = document.getElementById('totalNoAssoliment');

    if (totalExcellent) totalExcellent.textContent = stats.AE;
    if (totalNotable) totalNotable.textContent = stats.AN;
    if (totalSufficient) totalSufficient.textContent = stats.AS;
    if (totalNoAssoliment) totalNoAssoliment.textContent = stats.NA;
}

function omplirFiltres() {
    // Llenar filtros con datos disponibles
    const grups = [...new Set(dadesBrutes.map(row => row.grup))].sort();
    const grupSelect = document.getElementById('grupFilter');
    if (grupSelect) {
        grupSelect.innerHTML = '<option value="">Tots els grups</option>';
        grups.forEach(grup => {
            const option = document.createElement('option');
            option.value = grup;
            option.textContent = grup;
            grupSelect.appendChild(option);
        });
    }

    // Configurar eventos de filtros
    ['grupFilter', 'alumneFilter', 'assignaturaFilter', 'trimestreFilter', 'assolimentFilter'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', aplicarFiltres);
        }
    });
}

function aplicarFiltres() {
    const grupFilter = document.getElementById('grupFilter').value;
    const alumneFilter = document.getElementById('alumneFilter').value;
    const assignaturaFilter = document.getElementById('assignaturaFilter').value;
    const trimestreFilter = document.getElementById('trimestreFilter').value;
    const assolimentFilter = document.getElementById('assolimentFilter').value;

    dadesFiltered = dadesBrutes.filter(row => {
        let passaFiltres = true;

        if (grupFilter && row.grup !== grupFilter) passaFiltres = false;
        if (alumneFilter && row.alumne !== alumneFilter) passaFiltres = false;
        if (assignaturaFilter && row.assignaturaNom !== assignaturaFilter) passaFiltres = false;
        if (trimestreFilter && row.trimestre !== trimestreFilter) passaFiltres = false;
        if (assolimentFilter && row.assoliment !== assolimentFilter) passaFiltres = false;

        return passaFiltres;
    });

    actualitzarEstadistiques();
    actualitzarGrafics();
    actualitzarTaulaDetallada();
}

function actualitzarGrafics() {
    // Destruir gráficos existentes
    Object.keys(charts).forEach(key => {
        if (charts[key] && typeof charts[key].destroy === 'function') {
            charts[key].destroy();
        }
    });
    charts = {};

    // Crear nuevos gráficos
    crearGrafics();
}

function crearGrafics() {
    // Crear gráficos básicos
    crearGraficDistribucioGlobal();
    crearGraficEvolucioTrimestre();
    crearGraficRankingAssignatures();
    crearGraficExitGrups();
}

function crearGraficDistribucioGlobal() {
    const ctx = document.getElementById('distribucioGlobalChart');
    if (!ctx) return;

    const stats = {
        AE: dadesFiltered.filter(row => row.assoliment === 'AE').length,
        AN: dadesFiltered.filter(row => row.assoliment === 'AN').length,
        AS: dadesFiltered.filter(row => row.assoliment === 'AS').length,
        NA: dadesFiltered.filter(row => row.assoliment === 'NA').length
    };

    charts.distribucioGlobal = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Excel·lent (AE)', 'Notable (AN)', 'Suficient (AS)', 'No Assoliment (NA)'],
            datasets: [{
                data: [stats.AE, stats.AN, stats.AS, stats.NA],
                backgroundColor: ['#3498db', '#2ecc71', '#f39c12', '#e74c3c'],
                borderWidth: 3,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 20, font: { size: 12 } }
                }
            }
        }
    });
}

function crearGraficEvolucioTrimestre() {
    const ctx = document.getElementById('evolucioTrimestreChart');
    if (!ctx) return;

    const trimestres = ['1', '2', '3', 'FINAL'];
    const data = {
        AE: trimestres.map(t => dadesFiltered.filter(row => row.trimestre === t && row.assoliment === 'AE').length),
        AN: trimestres.map(t => dadesFiltered.filter(row => row.trimestre === t && row.assoliment === 'AN').length),
        AS: trimestres.map(t => dadesFiltered.filter(row => row.trimestre === t && row.assoliment === 'AS').length),
        NA: trimestres.map(t => dadesFiltered.filter(row => row.trimestre === t && row.assoliment === 'NA').length)
    };

    charts.evolucioTrimestre = new Chart(ctx, {
        type: 'line',
        data: {
            labels: trimestres.map(t => t === 'FINAL' ? 'Final' : `${t}r Trim.`),
            datasets: [
                { label: 'Excel·lent', data: data.AE, borderColor: '#3498db', backgroundColor: '#3498db20', fill: true },
                { label: 'Notable', data: data.AN, borderColor: '#2ecc71', backgroundColor: '#2ecc7120', fill: true },
                { label: 'Suficient', data: data.AS, borderColor: '#f39c12', backgroundColor: '#f39c1220', fill: true },
                { label: 'No Assoliment', data: data.NA, borderColor: '#e74c3c', backgroundColor: '#e74c3c20', fill: true }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
        }
    });
}

function crearGraficRankingAssignatures() {
    const assignatures = [...new Set(dadesFiltered.map(row => row.assignaturaNom))];
    const ranking = assignatures.map(assignatura => {
        const dades = dadesFiltered.filter(row => row.assignaturaNom === assignatura);
        const total = dades.length;
        const positius = dades.filter(row => ['AE', 'AN'].includes(row.assoliment)).length;
        return {
            assignatura,
            percentatge: total > 0 ? (positius / total * 100) : 0
        };
    }).sort((a, b) => b.percentatge - a.percentatge);

    const ctx = document.getElementById('rankingAssignaturesChart');
    if (!ctx) return;

    charts.rankingAssignatures = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ranking.map(r => r.assignatura),
            datasets: [{
                label: '% Assoliments Positius',
                data: ranking.map(r => r.percentatge),
                backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                x: { beginAtZero: true, max: 100 }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function crearGraficExitGrups() {
    const grups = [...new Set(dadesFiltered.map(row => row.grup))].sort();
    const exitData = grups.map(grup => {
        const dades = dadesFiltered.filter(row => row.grup === grup);
        const total = dades.length;
        const positius = dades.filter(row => ['AE', 'AN'].includes(row.assoliment)).length;
        return total > 0 ? (positius / total * 100) : 0;
    });

    const ctx = document.getElementById('exitGrupsChart');
    if (!ctx) return;

    charts.exitGrups = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: grups,
            datasets: [{
                label: '% Èxit',
                data: exitData,
                backgroundColor: ['#667eea', '#764ba2', '#f093fb'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, max: 100 } },
            plugins: { legend: { display: false } }
        }
    });
}

function actualitzarTaulaDetallada() {
    const tbody = document.getElementById('taulaBody');
    const count = document.getElementById('taulaCount');
    
    if (!tbody || !count) return;
    
    tbody.innerHTML = '';
    count.textContent = `${dadesFiltered.length} registres`;
    
    const dataToShow = dadesFiltered.slice(0, 1000);
    
    dataToShow.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="cursor: pointer;">${row.alumne}</td>
            <td>${row.grup}</td>
            <td>${row.assignaturaNom}</td>
            <td>${row.trimestre === 'FINAL' ? 'Final' : `${row.trimestre}r Trim.`}</td>
            <td><span class="assoliment-badge assoliment-${row.assoliment}">${row.assoliment}</span></td>
        `;
        tbody.appendChild(tr);
    });
    
    if (dadesFiltered.length > 1000) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td colspan="5" style="text-align: center; font-style: italic; color: #7f8c8d;">
                ... i ${dadesFiltered.length - 1000} registres més
            </td>
        `;
        tbody.appendChild(tr);
    }
}

// Cargar datos al iniciar
window.addEventListener('load', () => {
    carregarDades();
});