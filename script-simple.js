// Variables globals
let dadesBrutes = [];
let dadesFiltered = [];
let charts = {};

// ========================================
// INICIALITZACIÓ I CONFIGURACIÓ
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicialitzant aplicació...');
    
    // Verificar dades existents
    verificarDadesExistents();
});

function verificarDadesExistents() {
    console.log('🔍 Verificant dades existents...');
    
    const uploadArea = document.getElementById('uploadArea');
    if (!uploadArea) {
        console.error('❌ No s\'ha trobat uploadArea');
        return;
    }
    
    uploadArea.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 3em; margin-bottom: 20px;">📊</div>
            <h3 style="color: #667eea; margin-bottom: 15px;">Benvingut al Dashboard d'Assoliments</h3>
            <p style="font-size: 1.2em; margin-bottom: 20px; color: #555;">
                Per començar, carrega el fitxer CSV amb les dades d'assoliments
            </p>
            <button class="btn" id="selectFileBtn" style="font-size: 16px; padding: 15px 30px;">
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
        </div>
    `;
    
    setupFileUpload();
}

function setupFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const selectFileBtn = document.getElementById('selectFileBtn');
    
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    

}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processFile(file);
    }
}

function processFile(file) {
    console.log('📁 Processant fitxer:', file.name);
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('Si us plau, selecciona un fitxer CSV vàlid.');
        return;
    }
    
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div style="font-size: 3em; margin-bottom: 20px;">⏳</div>
            <h3 style="color: #667eea; margin-bottom: 15px;">Carregant ${file.name}...</h3>
            <p style="color: #666;">Si us plau, espera mentre carreguem les dades al servidor</p>
        </div>
    `;

    const formData = new FormData();
    formData.append('file', file);

    fetch('/api/upload/csv', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('✅ Fitxer carregat correctament:', data);
            
            uploadArea.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 3em; margin-bottom: 20px;">✅</div>
                    <h3 style="color: #2ecc71; margin-bottom: 15px;">Fitxer carregat correctament!</h3>
                    <p style="color: #666; margin-bottom: 20px;">
                        S'han carregat <strong>${data.data.estudiantsInsertats} estudiants</strong><br>
                        amb <strong>${data.data.assolimentsInsertats} assoliments</strong>
                    </p>
                    <p style="color: #888; font-size: 14px;">Inicialitzant dashboard...</p>
                </div>
            `;

            setTimeout(() => {
                carregarDadesDelServidor();
            }, 1000);
            
        } else {
            throw new Error(data.error || 'Error desconegut');
        }
    })
    .catch(error => {
        console.error('❌ Error carregant fitxer:', error);
        alert('Error carregant el fitxer: ' + error.message);
    });
}

function carregarDadesDelServidor() {
    console.log('📡 Carregant dades del servidor...');
    
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div style="font-size: 3em; margin-bottom: 20px;">📊</div>
            <h3 style="color: #667eea; margin-bottom: 15px;">Carregant dades...</h3>
            <p style="color: #666;">Obtenint dades de la base de dades</p>
        </div>
    `;

    fetch('/api/assoliments?limit=10000')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('✅ Dades carregades:', data.data.length, 'assoliments');
                
                // Processar les dades
                dadesBrutes = data.data.map(row => ({
                    grup: row.classe,
                    alumne: row.nom,
                    assignaturaNom: row.assignatura_nom,
                    trimestre: row.trimestre,
                    assoliment: row.assoliment,
                    valorNumeric: row.valor_numeric
                }));
                
                dadesFiltered = [...dadesBrutes];
                
                console.log('📊 Dades processades:', dadesBrutes.length, 'registres');
                
                // Inicialitzar dashboard
                inicialitzarDashboard();
                
            } else {
                throw new Error(data.error || 'Error carregant dades');
            }
        })
        .catch(error => {
            console.error('❌ Error carregant dades:', error);
            alert('Error carregant dades: ' + error.message);
        });
}

function inicialitzarDashboard() {
    console.log('🎯 Inicialitzant dashboard...');
    
    const uploadSection = document.getElementById('uploadSection');
    const dashboard = document.getElementById('dashboard');
    
    if (uploadSection) uploadSection.style.display = 'none';
    if (dashboard) dashboard.classList.remove('hidden');
    
    // Omplir filtres
    omplirFiltres();
    
    // Actualitzar estadístiques i gràfics
    actualitzarEstadistiques();
    actualitzarGrafics();
    actualitzarTaulaDetallada();
    
    console.log('✅ Dashboard inicialitzat correctament');
}

function omplirFiltres() {
    console.log('🔧 Omplint filtres...');
    
    // Carregar classes
    fetch('/api/estudiants/classes')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const classes = data.data;
                const grupFilter = document.getElementById('grupFilter');
                if (grupFilter) {
                    grupFilter.innerHTML = '<option value="">Tots els grups</option>' + 
                        classes.map(classe => `<option value="${classe}">${classe}</option>`).join('');
                }
                console.log('✅ Classes carregades:', classes);
            }
        })
        .catch(error => {
            console.error('❌ Error carregant classes:', error);
        });

    // Carregar alumnes
    carregarAlumnes();
    
    // Carregar assignatures
    const assignatures = [...new Set(dadesBrutes.map(row => row.assignaturaNom))].sort();
    const assignaturaFilter = document.getElementById('assignaturaFilter');
    if (assignaturaFilter) {
        assignaturaFilter.innerHTML = '<option value="">Totes les assignatures</option>' + 
            assignatures.map(assignatura => `<option value="${assignatura}">${assignatura}</option>`).join('');
    }
    
    // Afegir event listeners
    const filters = ['grupFilter', 'alumneFilter', 'assignaturaFilter', 'trimestreFilter', 'assolimentFilter'];
    filters.forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
            element.addEventListener('change', aplicarFiltres);
        }
    });
    
    console.log('✅ Filtres omplerts');
}

function carregarAlumnes(classe = '') {
    let url = '/api/estudiants?limit=1000';
    if (classe) {
        url += `&classe=${encodeURIComponent(classe)}`;
    }
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const alumnes = data.data.map(estudiant => estudiant.nom).sort();
                const alumneFilter = document.getElementById('alumneFilter');
                if (alumneFilter) {
                    alumneFilter.innerHTML = '<option value="">Tots els alumnes</option>' + 
                        alumnes.map(alumne => `<option value="${alumne}">${alumne}</option>`).join('');
                }
                console.log('✅ Alumnes carregats:', alumnes.length, 'alumnes');
            }
        })
        .catch(error => {
            console.error('❌ Error carregant alumnes:', error);
        });
}

function aplicarFiltres() {
    console.log('🔍 Aplicant filtres...');
    
    const grup = document.getElementById('grupFilter')?.value || '';
    const alumne = document.getElementById('alumneFilter')?.value || '';
    const assignatura = document.getElementById('assignaturaFilter')?.value || '';
    const trimestre = document.getElementById('trimestreFilter')?.value || '';
    const assoliment = document.getElementById('assolimentFilter')?.value || '';
    
    dadesFiltered = dadesBrutes.filter(row => {
        if (grup && row.grup !== grup) return false;
        if (alumne && row.alumne !== alumne) return false;
        if (assignatura && row.assignaturaNom !== assignatura) return false;
        if (trimestre && row.trimestre !== trimestre) return false;
        if (assoliment && row.assoliment !== assoliment) return false;
        return true;
    });
    
    console.log('📊 Dades filtrades:', dadesFiltered.length, 'registres');
    
    actualitzarEstadistiques();
    actualitzarGrafics();
    actualitzarTaulaDetallada();
}

function actualitzarEstadistiques() {
    const stats = {
        excellent: dadesFiltered.filter(row => row.assoliment === 'AE').length,
        notable: dadesFiltered.filter(row => row.assoliment === 'AN').length,
        sufficient: dadesFiltered.filter(row => row.assoliment === 'AS').length,
        noAchievement: dadesFiltered.filter(row => row.assoliment === 'NA').length
    };
    
    const elements = {
        'totalExcellent': stats.excellent,
        'totalNotable': stats.notable,
        'totalSufficient': stats.sufficient,
        'totalNoAssoliment': stats.noAchievement
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
    
    console.log('📈 Estadístiques actualitzades:', stats);
}

function actualitzarGrafics() {
    console.log('📊 Actualitzant gràfics...');
    
    // Destruir gràfics existents
    Object.values(charts).forEach(chart => {
        if (chart && chart.destroy) {
            chart.destroy();
        }
    });
    charts = {};
    
    // Crear gràfics bàsics
    crearGraficDistribucioGlobal();
    crearGraficEvolucioTrimestre();
    
    console.log('✅ Gràfics actualitzats');
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
                backgroundColor: ['#2ecc71', '#f39c12', '#3498db', '#e74c3c'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function crearGraficEvolucioTrimestre() {
    const ctx = document.getElementById('evolucioTrimestreChart');
    if (!ctx) return;
    
    const trimestreStats = {};
    dadesFiltered.forEach(row => {
        if (!trimestreStats[row.trimestre]) {
            trimestreStats[row.trimestre] = { AE: 0, AN: 0, AS: 0, NA: 0 };
        }
        trimestreStats[row.trimestre][row.assoliment]++;
    });
    
    const labels = Object.keys(trimestreStats).sort();
    const datasets = [
        { label: 'Excel·lent (AE)', data: labels.map(t => trimestreStats[t]?.AE || 0), borderColor: '#2ecc71', backgroundColor: 'rgba(46, 204, 113, 0.1)' },
        { label: 'Notable (AN)', data: labels.map(t => trimestreStats[t]?.AN || 0), borderColor: '#f39c12', backgroundColor: 'rgba(243, 156, 18, 0.1)' },
        { label: 'Suficient (AS)', data: labels.map(t => trimestreStats[t]?.AS || 0), borderColor: '#3498db', backgroundColor: 'rgba(52, 152, 219, 0.1)' },
        { label: 'No Assoliment (NA)', data: labels.map(t => trimestreStats[t]?.NA || 0), borderColor: '#e74c3c', backgroundColor: 'rgba(231, 76, 60, 0.1)' }
    ];
    
    charts.evolucioTrimestre = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

function actualitzarTaulaDetallada() {
    const tbody = document.getElementById('taulaBody');
    const countSpan = document.getElementById('taulaCount');
    
    if (!tbody || !countSpan) return;
    
    tbody.innerHTML = '';
    
    dadesFiltered.slice(0, 50).forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.alumne}</td>
            <td>${row.grup}</td>
            <td>${row.assignaturaNom}</td>
            <td>${row.trimestre}</td>
            <td><span class="badge ${row.assoliment.toLowerCase()}">${row.assoliment}</span></td>
        `;
        tbody.appendChild(tr);
    });
    
    countSpan.innerHTML = `
        <span class="material-icons" style="vertical-align: middle; margin-right: 5px; font-size: 16px;">assessment</span>
        ${dadesFiltered.length} registres
    `;
}

// Funcions de pestanyes simplificades
function showTab(tabName) {
    console.log('🔄 Canviant a pestanya:', tabName);
    
    document.querySelectorAll('.tab-pane').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const tabPane = document.getElementById(tabName + '-tab');
    if (tabPane) {
        tabPane.classList.remove('hidden');
    }
    
    const tabButton = document.querySelector(`button[data-tab="${tabName}"]`);
    if (tabButton) {
        tabButton.classList.add('active');
    }
    
    console.log('✅ Pestanya canviada a:', tabName);
}

function resetFilters() {
    document.getElementById('grupFilter').value = '';
    document.getElementById('alumneFilter').value = '';
    document.getElementById('assignaturaFilter').value = '';
    document.getElementById('trimestreFilter').value = '';
    document.getElementById('assolimentFilter').value = '';
    
    dadesFiltered = [...dadesBrutes];
    actualitzarEstadistiques();
    actualitzarGrafics();
    actualitzarTaulaDetallada();
    
    console.log('🔄 Filtres reiniciats');
}

// ========================================
// EVENT LISTENERS
// ========================================

// Afegir event listeners quan carregui la pàgina
document.addEventListener('DOMContentLoaded', function() {
    // Event listeners per als botons de pestanyes
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            if (tabName) {
                showTab(tabName);
            }
        });
    });

    // Event listener per al botó de seleccionar fitxer
    const selectFileBtn = document.getElementById('selectFileBtn');
    if (selectFileBtn) {
        selectFileBtn.addEventListener('click', function() {
            document.getElementById('fileInput').click();
        });
    }

    // Event listener per al botó de reiniciar filtres
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }
}); 