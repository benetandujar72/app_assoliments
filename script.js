// Variables globals
let dadesBrutes = [];
let dadesFiltered = [];
let charts = {};

// Configuració d'assignatures i mapejats
const assignatures = {
    'LIN': { nom: 'Llengua', cols: [2, 3, 4, 5] },
    'ANG': { nom: 'Anglès', cols: [6, 7, 8, 9] },
    'FRA': { nom: 'Francès', cols: [10, 11, 12, 13] },
    'MAT': { nom: 'Matemàtiques', cols: [14, 15, 16, 17] },
    'MUS': { nom: 'Música', cols: [18, 19, 20, 21] },
    'EC': { nom: 'Espai Creatiu', cols: [22, 23, 24, 25] },
    'FIS': { nom: 'Ed. Física', cols: [26, 27, 28, 29] },
    'EG': { nom: 'Espai Globalitzat', cols: [30, 31, 32, 33, 34, 35, 36, 37] }
};

const trimestres = ['1', '2', '3', 'FINAL'];
const valorsAssoliment = { 'NA': 0, 'AS': 1, 'AN': 2, 'AE': 3 };

// ========================================
// INICIALITZACIÓ I CONFIGURACIÓ
// ========================================



function mostrarMissatgeCarregaInicial() {
    const uploadArea = document.getElementById('uploadArea');
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
    const selectFileBtn = document.getElementById('selectFileBtn');

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
        processFile(files[0]);
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
        processFile(file);
    }
}

// ========================================
// PROCESSAMENT DE FITXERS
// ========================================

function processFile(file) {
    if (!file.name.toLowerCase().endsWith('.csv')) {
        mostrarError('Si us plau, selecciona un fitxer CSV vàlid.');
        return;
    }

    console.log('📁 Processant fitxer:', file.name, 'Mida:', file.size, 'bytes');
    
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div style="font-size: 3em; margin-bottom: 20px;">⏳</div>
            <h3 style="color: #667eea; margin-bottom: 15px;">Carregant ${file.name}...</h3>
            <p style="color: #666;">Si us plau, espera mentre carreguem les dades al servidor</p>
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

    // Crear FormData per enviar el fitxer
    const formData = new FormData();
    formData.append('file', file);

    // Enviar el fitxer al servidor
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

            // Carregar les dades del servidor i inicialitzar el dashboard
            setTimeout(() => {
                carregarDadesDelServidor();
            }, 1000);
            
        } else {
            throw new Error(data.error || 'Error desconegut');
        }
    })
    .catch(error => {
        console.error('❌ Error carregant fitxer:', error);
        mostrarError('Error carregant el fitxer: ' + error.message);
    });
}

function verificarDadesExistents() {
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div style="font-size: 3em; margin-bottom: 20px;">🔍</div>
            <h3 style="color: #667eea; margin-bottom: 15px;">Verificant dades...</h3>
            <p style="color: #666;">Comprovant si ja hi ha dades a la base de dades</p>
        </div>
    `;
    fetch('/api/upload/status')
        .then(response => response.json())
        .then(data => {
            if (data.success && Number(data.data.total_estudiants) > 0) {
                uploadArea.innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        <div style="font-size: 3em; margin-bottom: 20px;">📊</div>
                        <h3 style="color: #2ecc71; margin-bottom: 15px;">Dades trobades!</h3>
                        <p style="color: #666; margin-bottom: 20px;">
                            Ja hi ha <strong>${data.data.total_estudiants} estudiants</strong><br>
                            amb <strong>${data.data.total_assoliments} assoliments</strong> carregats
                        </p>
                        <div style="margin-top: 20px;">
                            <button class="btn" id="btnCarregarDashboard" style="margin-right: 10px;">
                                📊 Carregar Dashboard
                            </button>
                            <button class="btn" id="btnCarregarNouCSV" style="background: #95a5a6;">
                                🔄 Carregar Nou CSV
                            </button>
                        </div>
                    </div>
                `;
                document.getElementById('btnCarregarDashboard').onclick = carregarDadesDelServidor;
                document.getElementById('btnCarregarNouCSV').onclick = mostrarMissatgeCarregaInicial;
            } else {
                mostrarMissatgeCarregaInicial();
            }
        })
        .catch(error => {
            mostrarMissatgeCarregaInicial();
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

    // Carregar dades d'assoliments amb més detall
    fetch('/api/assoliments?limit=10000')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('✅ Dades carregades:', data.data.length, 'assoliments');
                
                // Convertir les dades del servidor al format esperat pel dashboard
                dadesBrutes = data.data.map(item => ({
                    grup: item.classe,
                    alumne: item.estudiant_nom,
                    assignatura: item.assignatura_codi,
                    assignaturaNom: item.assignatura_nom,
                    trimestre: item.trimestre,
                    assoliment: item.assoliment,
                    valorNumeric: item.valor_numeric
                }));
                
                dadesFiltered = [...dadesBrutes];
                
                uploadArea.innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        <div style="font-size: 3em; margin-bottom: 20px;">✅</div>
                        <h3 style="color: #2ecc71; margin-bottom: 15px;">Dades carregades correctament!</h3>
                        <p style="color: #666; margin-bottom: 20px;">
                            S'han carregat <strong>${dadesBrutes.length} assoliments</strong><br>
                            de <strong>${[...new Set(dadesBrutes.map(r => r.alumne))].length} alumnes</strong><br>
                            en <strong>${[...new Set(dadesBrutes.map(r => r.grup))].length} grups</strong>
                        </p>
                        <p style="color: #888; font-size: 14px;">Inicialitzant dashboard...</p>
                    </div>
                `;

                setTimeout(() => {
                    inicialitzarDashboard();
                }, 1000);
                
            } else {
                throw new Error(data.error || 'Error carregant dades');
            }
        })
        .catch(error => {
            console.error('❌ Error carregant dades:', error);
            mostrarError('Error carregant dades del servidor: ' + error.message);
            mostrarMissatgeCarregaInicial();
        });
}

function mostrarError(missatge) {
    const uploadSection = document.getElementById('uploadSection');
    
    const existingErrors = uploadSection.querySelectorAll('.error');
    existingErrors.forEach(error => error.remove());
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <span style="font-size: 24px; margin-right: 10px;">❌</span>
            <strong>Error:</strong>
        </div>
        <p style="margin-bottom: 15px;">${missatge}</p>
        <details style="margin-top: 15px;">
            <summary style="cursor: pointer; font-weight: 600; color: #fff;">Solucions possibles</summary>
            <ul style="margin: 10px 0; padding-left: 20px; line-height: 1.6;">
                <li>Assegura't que el fitxer és un CSV vàlid</li>
                <li>Verifica que la primera columna conté el grup (CLASSE)</li>
                <li>Verifica que la segona columna conté el nom de l'alumne (NOM)</li>
                <li>Comprova que els valors d'assoliment són: NA, AS, AN, AE</li>
                <li>Assegura't que el fitxer està codificat en UTF-8</li>
            </ul>
        </details>
        <button class="btn" onclick="this.parentElement.remove(); mostrarMissatgeCarregaInicial();" style="margin-top: 15px; background: #fff; color: #e74c3c; border: 2px solid #fff;">
            🔄 Tornar a intentar
        </button>
    `;
    uploadSection.insertBefore(errorDiv, uploadSection.firstChild);
}

// ========================================
// INICIALITZACIÓ DEL DASHBOARD
// ========================================

function inicialitzarDashboard() {
    try {
        console.log('🚀 Inicialitzant dashboard...');
        debugDades();
        omplirFiltres();
        actualitzarEstadistiques();
        crearGrafics();
        actualitzarTaulaDetallada();
        
        // Amagar la secció de càrrega i mostrar el dashboard
        document.getElementById('uploadSection').style.display = 'none';
        document.getElementById('dashboard').classList.remove('hidden');
        
        // Configurar events per als filtres
        ['grupFilter', 'alumneFilter', 'assignaturaFilter', 'trimestreFilter', 'assolimentFilter'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', aplicarFiltres);
            }
        });
        
        // Configurar events per als botons
        const resetBtn = document.querySelector('button[onclick="resetFilters()"]');
        const exportBtn = document.querySelector('button[onclick="exportData()"]');
        const exportTaulaBtn = document.querySelector('button[onclick="exportTaula()"]');
        
        if (resetBtn) resetBtn.addEventListener('click', resetFilters);
        if (exportBtn) exportBtn.addEventListener('click', exportData);
        if (exportTaulaBtn) exportTaulaBtn.addEventListener('click', exportTaula);
        
        setTimeout(() => {
            afegirFuncionalitatExtra();
        }, 100);
        
        mostrarNotificacioExit();
        
    } catch (error) {
        console.error('❌ Error inicialitzant dashboard:', error);
        mostrarError('Error inicialitzant el dashboard: ' + error.message);
    }
}

function debugDades() {
    console.log('🔍 DEBUG - Estat de les dades:');
    console.log('Total dades brutes:', dadesBrutes.length);
    console.log('Total dades filtrades:', dadesFiltered.length);
    
    if (dadesFiltered.length > 0) {
        console.log('Mostra d\'una dada:', dadesFiltered[0]);
        
        const grups = [...new Set(dadesFiltered.map(row => row.grup))];
        const assignatures = [...new Set(dadesFiltered.map(row => row.assignaturaNom))];
        const trimestres = [...new Set(dadesFiltered.map(row => row.trimestre))];
        
        console.log('Grups detectats:', grups);
        console.log('Assignatures detectades:', assignatures);
        console.log('Trimestres detectats:', trimestres);
    }
}

function afegirFuncionalitatExtra() {
    // Afegir funcionalitats addicionals aquí si cal
    console.log('✨ Funcionalitats extra afegides');
}

function mostrarNotificacioExit() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2ecc71;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.innerHTML = `
        <div style="display: flex; align-items: center;">
            <span style="font-size: 20px; margin-right: 10px;">✅</span>
            <div>
                <strong>Dashboard carregat!</strong><br>
                <small>Les dades estan disponibles per a l'anàlisi</small>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========================================
// GESTIÓ DE FILTRES
// ========================================

function omplirFiltres() {
    // Carregar classes des del servidor
    fetch('/api/estudiants/classes')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const classes = data.data;
                const grupFilter = document.getElementById('grupFilter');
                grupFilter.innerHTML = '<option value="">Tots els grups</option>' + 
                    classes.map(classe => `<option value="${classe}">${classe}</option>`).join('');
                
                console.log('✅ Classes carregades:', classes);
            }
        })
        .catch(error => {
            console.error('❌ Error carregant classes:', error);
        });

    // Carregar alumnes des del servidor (sense filtre inicial)
    carregarAlumnes();
    
    // Carregar assignatures des de les dades locals
    const assignatures = [...new Set(dadesBrutes.map(row => row.assignaturaNom))].sort();
    const assignaturaFilter = document.getElementById('assignaturaFilter');
    assignaturaFilter.innerHTML = '<option value="">Totes les assignatures</option>' + 
        assignatures.map(assignatura => `<option value="${assignatura}">${assignatura}</option>`).join('');
    
    // Afegir event listeners per aplicar filtres automàticament
    document.getElementById('grupFilter').addEventListener('change', aplicarFiltres);
    document.getElementById('alumneFilter').addEventListener('change', aplicarFiltres);
    document.getElementById('assignaturaFilter').addEventListener('change', aplicarFiltres);
    document.getElementById('trimestreFilter').addEventListener('change', aplicarFiltres);
    document.getElementById('assolimentFilter').addEventListener('change', aplicarFiltres);
    
    console.log('✅ Filtres omplerts i event listeners afegits');
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
                alumneFilter.innerHTML = '<option value="">Tots els alumnes</option>' + 
                    alumnes.map(alumne => `<option value="${alumne}">${alumne}</option>`).join('');
                
                console.log('✅ Alumnes carregats:', alumnes.length, 'alumnes');
            }
        })
        .catch(error => {
            console.error('❌ Error carregant alumnes:', error);
        });
}

function aplicarFiltres() {
    const grup = document.getElementById('grupFilter').value;
    const alumne = document.getElementById('alumneFilter').value;
    const assignatura = document.getElementById('assignaturaFilter').value;
    const trimestre = document.getElementById('trimestreFilter').value;
    const assoliment = document.getElementById('assolimentFilter').value;
    
    // Si s'ha canviat la classe, recarregar alumnes
    if (grup !== this.lastSelectedGrup) {
        this.lastSelectedGrup = grup;
        carregarAlumnes(grup);
    }
    
    dadesFiltered = dadesBrutes.filter(row => {
        if (grup && row.grup !== grup) return false;
        if (alumne && row.alumne !== alumne) return false;
        if (assignatura && row.assignaturaNom !== assignatura) return false;
        
        // Mapejar els valors del filtro als valors del CSV
        if (trimestre) {
            let trimestreValue;
            switch(trimestre) {
                case '1': trimestreValue = '1r trim'; break;
                case '2': trimestreValue = '2n trim'; break;
                case '3': trimestreValue = '3r trim'; break;
                case 'FINAL': trimestreValue = 'final'; break;
                default: trimestreValue = trimestre;
            }
            if (row.trimestre !== trimestreValue) return false;
        }
        
        if (assoliment && row.assoliment !== assoliment) return false;
        return true;
    });
    
    actualitzarEstadistiques();
    
    // Actualitzar només els gràfics de la pestanya activa
    const tabName = obtenirPestanyaActiva();
    actualitzarGraficsPestanya(tabName);
    
    actualitzarTaulaDetallada();
}

function resetFilters() {
    document.getElementById('grupFilter').value = '';
    document.getElementById('alumneFilter').value = '';
    document.getElementById('assignaturaFilter').value = '';
    document.getElementById('trimestreFilter').value = '';
    document.getElementById('assolimentFilter').value = '';
    
    dadesFiltered = [...dadesBrutes];
    actualitzarEstadistiques();
    
    // Actualitzar només els gràfics de la pestanya activa
    const tabName = obtenirPestanyaActiva();
    actualitzarGraficsPestanya(tabName);
    
    actualitzarTaulaDetallada();
}

// ========================================
// ESTADÍSTIQUES
// ========================================

function actualitzarEstadistiques() {
    const stats = {
        excellent: dadesFiltered.filter(row => row.assoliment === 'AE').length,
        notable: dadesFiltered.filter(row => row.assoliment === 'AN').length,
        sufficient: dadesFiltered.filter(row => row.assoliment === 'AS').length,
        noAchievement: dadesFiltered.filter(row => row.assoliment === 'NA').length
    };
    
    document.getElementById('totalExcellent').textContent = stats.excellent;
    document.getElementById('totalNotable').textContent = stats.notable;
    document.getElementById('totalSufficient').textContent = stats.sufficient;
    document.getElementById('totalNoAssoliment').textContent = stats.noAchievement;
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
        if (chart && chart.destroy) {
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
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function crearGraficRankingAssignatures() {
    const ctx = document.getElementById('rankingAssignaturesChart');
    if (!ctx) return;
    
    const assignaturaStats = {};
    dadesFiltered.forEach(row => {
        if (!assignaturaStats[row.assignaturaNom]) {
            assignaturaStats[row.assignaturaNom] = { total: 0, assolits: 0 };
        }
        assignaturaStats[row.assignaturaNom].total++;
        if (['AE', 'AN', 'AS'].includes(row.assoliment)) {
            assignaturaStats[row.assignaturaNom].assolits++;
        }
    });
    
    const labels = Object.keys(assignaturaStats);
    const data = labels.map(assignatura => {
        const stats = assignaturaStats[assignatura];
        return (stats.assolits / stats.total * 100).toFixed(1);
    });
    
    charts.rankingAssignatures = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Percentatge d\'Assoliment (%)',
                data,
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: '#667eea',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function crearGraficExitGrups() {
    const ctx = document.getElementById('exitGrupsChart');
    if (!ctx) return;
    
    const grupStats = {};
    dadesFiltered.forEach(row => {
        if (!grupStats[row.grup]) {
            grupStats[row.grup] = { total: 0, assolits: 0 };
        }
        grupStats[row.grup].total++;
        if (['AE', 'AN', 'AS'].includes(row.assoliment)) {
            grupStats[row.grup].assolits++;
        }
    });
    
    const labels = Object.keys(grupStats);
    const data = labels.map(grup => {
        const stats = grupStats[grup];
        return (stats.assolits / stats.total * 100).toFixed(1);
    });
    
    charts.exitGrups = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#f5576c'],
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

// Funcions per als altres gràfics (implementades completament)
function crearGraficComparativaTrimestre() {
    const ctx = document.getElementById('comparativaTrimestreChart');
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
        { label: 'Excel·lent (AE)', data: labels.map(t => trimestreStats[t]?.AE || 0), backgroundColor: '#2ecc71' },
        { label: 'Notable (AN)', data: labels.map(t => trimestreStats[t]?.AN || 0), backgroundColor: '#f39c12' },
        { label: 'Suficient (AS)', data: labels.map(t => trimestreStats[t]?.AS || 0), backgroundColor: '#3498db' },
        { label: 'No Assoliment (NA)', data: labels.map(t => trimestreStats[t]?.NA || 0), backgroundColor: '#e74c3c' }
    ];
    
    charts.comparativaTrimestre = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true }
            }
        }
    });
}

function crearGraficProgressio() {
    const ctx = document.getElementById('progressioChart');
    if (!ctx) return;
    
    const trimestreOrder = ['1r trim', '2n trim', '3r trim', 'final'];
    const progressio = {};
    
    dadesFiltered.forEach(row => {
        if (!progressio[row.trimestre]) {
            progressio[row.trimestre] = { total: 0, assolits: 0 };
        }
        progressio[row.trimestre].total++;
        if (['AE', 'AN', 'AS'].includes(row.assoliment)) {
            progressio[row.trimestre].assolits++;
        }
    });
    
    const labels = trimestreOrder.filter(t => progressio[t]);
    const data = labels.map(trimestre => {
        const stats = progressio[trimestre];
        return (stats.assolits / stats.total * 100).toFixed(1);
    });
    
    charts.progressio = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Percentatge d\'Assoliment (%)',
                data,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    max: 100,
                    ticks: { callback: value => value + '%' }
                }
            }
        }
    });
}

function crearGraficAssolimentsAssignatura() {
    const ctx = document.getElementById('assolimentsAssignaturaChart');
    if (!ctx) return;
    
    const assignaturaStats = {};
    dadesFiltered.forEach(row => {
        if (!assignaturaStats[row.assignaturaNom]) {
            assignaturaStats[row.assignaturaNom] = { AE: 0, AN: 0, AS: 0, NA: 0 };
        }
        assignaturaStats[row.assignaturaNom][row.assoliment]++;
    });
    
    const labels = Object.keys(assignaturaStats);
    const datasets = [
        { label: 'Excel·lent (AE)', data: labels.map(a => assignaturaStats[a]?.AE || 0), backgroundColor: '#2ecc71' },
        { label: 'Notable (AN)', data: labels.map(a => assignaturaStats[a]?.AN || 0), backgroundColor: '#f39c12' },
        { label: 'Suficient (AS)', data: labels.map(a => assignaturaStats[a]?.AS || 0), backgroundColor: '#3498db' },
        { label: 'No Assoliment (NA)', data: labels.map(a => assignaturaStats[a]?.NA || 0), backgroundColor: '#e74c3c' }
    ];
    
    charts.assolimentsAssignatura = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true }
            }
        }
    });
}

function crearGraficDificultats() {
    const ctx = document.getElementById('dificultatsChart');
    if (!ctx) return;
    
    const assignaturaStats = {};
    dadesFiltered.forEach(row => {
        if (!assignaturaStats[row.assignaturaNom]) {
            assignaturaStats[row.assignaturaNom] = { total: 0, noAssolits: 0 };
        }
        assignaturaStats[row.assignaturaNom].total++;
        if (row.assoliment === 'NA') {
            assignaturaStats[row.assignaturaNom].noAssolits++;
        }
    });
    
    const labels = Object.keys(assignaturaStats);
    const data = labels.map(assignatura => {
        const stats = assignaturaStats[assignatura];
        return (stats.noAssolits / stats.total * 100).toFixed(1);
    });
    
    charts.dificultats = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: ['#e74c3c', '#f39c12', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#1abc9c', '#34495e']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: context => `${context.label}: ${context.parsed}% de No Assoliments`
                    }
                }
            }
        }
    });
}

function crearGraficComparativaGrups() {
    const ctx = document.getElementById('comparativaGrupsChart');
    if (!ctx) return;
    
    const grupStats = {};
    dadesFiltered.forEach(row => {
        if (!grupStats[row.grup]) {
            grupStats[row.grup] = { AE: 0, AN: 0, AS: 0, NA: 0 };
        }
        grupStats[row.grup][row.assoliment]++;
    });
    
    const labels = Object.keys(grupStats);
    const datasets = [
        { label: 'Excel·lent (AE)', data: labels.map(g => grupStats[g]?.AE || 0), backgroundColor: '#2ecc71' },
        { label: 'Notable (AN)', data: labels.map(g => grupStats[g]?.AN || 0), backgroundColor: '#f39c12' },
        { label: 'Suficient (AS)', data: labels.map(g => grupStats[g]?.AS || 0), backgroundColor: '#3498db' },
        { label: 'No Assoliment (NA)', data: labels.map(g => grupStats[g]?.NA || 0), backgroundColor: '#e74c3c' }
    ];
    
    charts.comparativaGrups = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true }
            }
        }
    });
}

function crearGraficRendimentGrups() {
    const ctx = document.getElementById('rendimentGrupsChart');
    if (!ctx) return;
    
    const grupStats = {};
    dadesFiltered.forEach(row => {
        if (!grupStats[row.grup]) {
            grupStats[row.grup] = { total: 0, assolits: 0 };
        }
        grupStats[row.grup].total++;
        if (['AE', 'AN', 'AS'].includes(row.assoliment)) {
            grupStats[row.grup].assolits++;
        }
    });
    
    const labels = Object.keys(grupStats);
    const data = labels.map(grup => {
        const stats = grupStats[grup];
        return (stats.assolits / stats.total * 100).toFixed(1);
    });
    
    charts.rendimentGrups = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Percentatge d\'Assoliment (%)',
                data,
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: '#667eea',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    max: 100,
                    ticks: { callback: value => value + '%' }
                }
            }
        }
    });
}

function crearGraficPerfilIndividual() {
    const ctx = document.getElementById('perfilIndividualChart');
    if (!ctx) return;
    
    // Obtenir l'alumne seleccionat o el primer alumne disponible
    const alumneSeleccionat = document.getElementById('alumneFilter').value;
    const alumne = alumneSeleccionat || (dadesFiltered.length > 0 ? dadesFiltered[0].alumne : '');
    
    if (!alumne) return;
    
    const alumneData = dadesFiltered.filter(row => row.alumne === alumne);
    const assignaturaStats = {};
    
    alumneData.forEach(row => {
        if (!assignaturaStats[row.assignaturaNom]) {
            assignaturaStats[row.assignaturaNom] = { AE: 0, AN: 0, AS: 0, NA: 0 };
        }
        assignaturaStats[row.assignaturaNom][row.assoliment]++;
    });
    
    const labels = Object.keys(assignaturaStats);
    const datasets = [
        { label: 'Excel·lent (AE)', data: labels.map(a => assignaturaStats[a]?.AE || 0), backgroundColor: '#2ecc71' },
        { label: 'Notable (AN)', data: labels.map(a => assignaturaStats[a]?.AN || 0), backgroundColor: '#f39c12' },
        { label: 'Suficient (AS)', data: labels.map(a => assignaturaStats[a]?.AS || 0), backgroundColor: '#3498db' },
        { label: 'No Assoliment (NA)', data: labels.map(a => assignaturaStats[a]?.NA || 0), backgroundColor: '#e74c3c' }
    ];
    
    charts.perfilIndividual = new Chart(ctx, {
        type: 'radar',
        data: {
            labels,
            datasets: [{
                label: 'Assoliments per Assignatura',
                data: labels.map(assignatura => {
                    const stats = assignaturaStats[assignatura];
                    const total = stats.AE + stats.AN + stats.AS + stats.NA;
                    if (total === 0) return 0;
                    return ((stats.AE * 4 + stats.AN * 3 + stats.AS * 2 + stats.NA * 1) / total).toFixed(1);
                }),
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                pointBackgroundColor: '#667eea'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 4,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function crearGraficEvolucioPersonal() {
    const ctx = document.getElementById('evolucioPersonalChart');
    if (!ctx) return;
    
    // Obtenir l'alumne seleccionat o el primer alumne disponible
    const alumneSeleccionat = document.getElementById('alumneFilter').value;
    const alumne = alumneSeleccionat || (dadesFiltered.length > 0 ? dadesFiltered[0].alumne : '');
    
    if (!alumne) return;
    
    const alumneData = dadesFiltered.filter(row => row.alumne === alumne);
    const trimestreOrder = ['1r trim', '2n trim', '3r trim', 'final'];
    const evolucion = {};
    
    alumneData.forEach(row => {
        if (!evolucion[row.trimestre]) {
            evolucion[row.trimestre] = { total: 0, puntuacio: 0 };
        }
        evolucion[row.trimestre].total++;
        const puntuacio = row.assoliment === 'AE' ? 4 : row.assoliment === 'AN' ? 3 : row.assoliment === 'AS' ? 2 : 1;
        evolucion[row.trimestre].puntuacio += puntuacio;
    });
    
    const labels = trimestreOrder.filter(t => evolucion[t]);
    const data = labels.map(trimestre => {
        const stats = evolucion[trimestre];
        return (stats.puntuacio / stats.total).toFixed(2);
    });
    
    charts.evolucioPersonal = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Mitjana per Trimestre',
                data,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    max: 4,
                    ticks: {
                        stepSize: 1,
                        callback: value => {
                            if (value === 4) return 'Excel·lent';
                            if (value === 3) return 'Notable';
                            if (value === 2) return 'Suficient';
                            if (value === 1) return 'No Assoliment';
                            return value;
                        }
                    }
                }
            }
        }
    });
}

// ========================================
// PESTANYES
// ========================================

function showTab(tabName) {
    console.log('🔄 Canviant a pestanya:', tabName);
    
    // Amagar totes les pestanyes
    document.querySelectorAll('.tab-pane').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Desactivar totes les pestanyes
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Mostrar la pestanya seleccionada
    const tabPane = document.getElementById(tabName + '-tab');
    if (tabPane) {
        tabPane.classList.remove('hidden');
    } else {
        console.error('❌ No s\'ha trobat la pestanya:', tabName + '-tab');
    }
    
    // Activar el botó de la pestanya seleccionada
    const tabButton = document.querySelector(`button[data-tab="${tabName}"]`);
    if (tabButton) {
        tabButton.classList.add('active');
    } else {
        console.error('❌ No s\'ha trobat el botó de la pestanya:', tabName);
    }
    
    // Actualitzar només els gràfics de la pestanya seleccionada
    setTimeout(() => {
        actualitzarGraficsPestanya(tabName);
    }, 100);
}

function obtenirPestanyaActiva() {
    const pestanyaActiva = document.querySelector('.tab.active');
    if (pestanyaActiva) {
        const dataTab = pestanyaActiva.getAttribute('data-tab');
        if (dataTab) {
            return dataTab;
        }
    }
    return 'general'; // Per defecte
}

function actualitzarGraficsPestanya(tabName) {
    console.log('📊 Actualitzant gràfics per pestanya:', tabName);
    
    // Si no hi ha dades, no fer res
    if (!dadesFiltered || dadesFiltered.length === 0) {
        console.log('⚠️ No hi ha dades per mostrar gràfics');
        return;
    }
    
    // Destruir només els gràfics de la pestanya actual
    const graficsPestanya = {
        'general': ['distribucioGlobal', 'evolucioTrimestre', 'rankingAssignatures', 'exitGrups'],
        'trimestres': ['comparativaTrimestre', 'progressio'],
        'assignatures': ['assolimentsAssignatura', 'dificultats'],
        'grups': ['comparativaGrups', 'rendimentGrups'],
        'individual': ['perfilIndividual', 'evolucioPersonal'],
        'taula': []
    };
    
    const graficsADestruir = graficsPestanya[tabName] || [];
    graficsADestruir.forEach(graficName => {
        if (charts[graficName] && charts[graficName].destroy) {
            charts[graficName].destroy();
            delete charts[graficName];
        }
    });
    
    // Crear només els gràfics de la pestanya seleccionada
    try {
        switch(tabName) {
            case 'general':
                crearGraficDistribucioGlobal();
                crearGraficEvolucioTrimestre();
                crearGraficRankingAssignatures();
                crearGraficExitGrups();
                break;
            case 'trimestres':
                crearGraficComparativaTrimestre();
                crearGraficProgressio();
                break;
            case 'assignatures':
                crearGraficAssolimentsAssignatura();
                crearGraficDificultats();
                break;
            case 'grups':
                crearGraficComparativaGrups();
                crearGraficRendimentGrups();
                break;
            case 'individual':
                crearGraficPerfilIndividual();
                crearGraficEvolucioPersonal();
                break;
            case 'taula':
                actualitzarTaulaDetallada();
                break;
            default:
                console.log('⚠️ Pestanya desconeguda:', tabName);
                break;
        }
        console.log('✅ Gràfics actualitzats per pestanya:', tabName);
    } catch (error) {
        console.error('❌ Error actualitzant gràfics per pestanya:', tabName, error);
    }
}

// ========================================
// EXPORTACIÓ
// ========================================

function exportData() {
    const csvContent = 'data:text/csv;charset=utf-8,' + 
        'Grup,Alumne,Assignatura,Trimestre,Assoliment\n' +
        dadesFiltered.map(row => 
            `${row.grup},${row.alumne},${row.assignaturaNom},${row.trimestre},${row.assoliment}`
        ).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'assoliments_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ========================================
// TAULA DETALLADA
// ========================================

function actualitzarTaulaDetallada() {
    const tbody = document.getElementById('taulaBody');
    const countSpan = document.getElementById('taulaCount');
    
    if (!tbody || !countSpan) return;
    
    tbody.innerHTML = '';
    
    dadesFiltered.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.alumne}</td>
            <td>${row.grup}</td>
            <td>${row.assignaturaNom}</td>
            <td>${row.trimestre}</td>
            <td>
                <span class="badge ${row.assoliment.toLowerCase()}">
                    ${row.assoliment}
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    countSpan.innerHTML = `
        <span class="material-icons" style="vertical-align: middle; margin-right: 5px; font-size: 16px;">assessment</span>
        ${dadesFiltered.length} registres
    `;
}

function exportTaula() {
    const csvContent = 'data:text/csv;charset=utf-8,' + 
        'Alumne,Grup,Assignatura,Trimestre,Assoliment\n' +
        dadesFiltered.map(row => 
            `${row.alumne},${row.grup},${row.assignaturaNom},${row.trimestre},${row.assoliment}`
        ).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'taula_assoliments.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ========================================
// EVENT LISTENERS
// ========================================

// Event listeners per als botons de pestanyes
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicialitzant aplicació...');
    
    // Siempre inicializar la comprobación de datos existentes
    verificarDadesExistents();
    
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

    // Event listener per al botó d'exportar dades
    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', exportData);
    }

    // Event listener per al botó d'exportar taula
    const exportTaulaBtn = document.getElementById('exportTaulaBtn');
    if (exportTaulaBtn) {
        exportTaulaBtn.addEventListener('click', exportTaula);
    }
}); 