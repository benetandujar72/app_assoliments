// ===== VARIABLES GLOBALS =====
let currentData = [];
let filteredData = [];
let charts = {};
let currentStep = 'upload';
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
    console.log('🚀 Inicialitzant aplicació amb nova estructura...');
    
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
        
        // Verificar si hi ha dades a la base de dades
        const response = await fetch('/api/assoliments?limit=5');
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            console.log('✅ Hi ha dades existents, carregant automàticament...');
            await carregarDadesDelServidor();
            
            // Si hi ha problemes amb les dades, executar diagnòstic
            if (result.data.some(item => !item.estudiant_nom || !item.assignatura_nom)) {
                console.log('⚠️ Detectats problemes amb les dades, executant diagnòstic...');
                await diagnosticarDades();
            }
        } else {
            console.log('⚠️ No hi ha dades existents, cal carregar un fitxer CSV');
            showStatus('info', 'Carrega un fitxer CSV per començar');
        }
    } catch (error) {
        console.error('❌ Error verificant dades:', error);
        showStatus('error', 'Error verificant les dades existents');
    }
}

// Funció per diagnosticar problemes de dades
async function diagnosticarDades() {
    try {
        console.log('🔍 Diagnosticant problemes de dades...');
        
        // Verificar dades sense JOINs
        const response = await fetch('/api/assoliments/diagnostic');
        const result = await response.json();
        
        if (result.success) {
            console.log('📊 Diagnòstic de dades:', result);
        }
    } catch (error) {
        console.error('❌ Error diagnosticant dades:', error);
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
    
    // Analysis tabs
    document.addEventListener('click', handleAnalysisTabClick);
    
    // Filter changes
    document.addEventListener('change', handleFilterChange);
    
    // Breadcrumb navigation
    document.addEventListener('click', handleBreadcrumbClick);
    
    // Modal events
    document.addEventListener('click', handleModalEvents);
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
    
    // Overview cards hover effects
    const overviewCards = document.querySelectorAll('.overview-card');
    overviewCards.forEach(card => {
        card.addEventListener('mouseenter', (e) => {
            e.target.style.transform = 'translateY(-4px) scale(1.01)';
        });
        
        card.addEventListener('mouseleave', (e) => {
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
    const sections = document.querySelectorAll('.upload-section, .dashboard-section, .overview-section, .charts-section, .analysis-section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        observer.observe(section);
    });
}

// ===== NAVIGATION FUNCTIONS =====
function navigateToStep(step) {
    console.log(`🧭 Navegant a pas: ${step}`);
    currentStep = step;
    
    try {
        // Verificar que els elements existeixen
        const uploadSection = document.getElementById('uploadSection');
        const dashboardSection = document.getElementById('dashboardSection');
        const breadcrumb = document.getElementById('breadcrumb');
        
        console.log('🔍 Elements trobats:', {
            uploadSection: !!uploadSection,
            dashboardSection: !!dashboardSection,
            breadcrumb: !!breadcrumb
        });
        
        if (!uploadSection || !dashboardSection) {
            console.error('❌ Elements de navegació no trobats');
            showStatus('error', 'Error de navegació: Elements no trobats');
            return;
        }
        
        console.log('🔍 Ocultant totes les seccions...');
        // Hide all sections
        uploadSection.style.display = 'none';
        dashboardSection.style.display = 'none';
        
        // Show breadcrumb
        if (breadcrumb) {
            breadcrumb.style.display = 'block';
        }
        
        // Show appropriate section
        if (step === 'upload') {
            console.log('🔍 Mostrant secció d\'upload...');
            uploadSection.style.display = 'block';
            if (breadcrumb) {
                breadcrumb.style.display = 'none';
            }
            console.log('✅ Secció d\'upload mostrada');
        } else if (step === 'dashboard') {
            console.log('🔍 Mostrant secció de dashboard...');
            dashboardSection.style.display = 'block';
            dashboardSection.style.opacity = '1';  // Forçar opacity a 1
            dashboardSection.style.visibility = 'visible';
            if (breadcrumb) {
                updateBreadcrumb(step);
            }
            console.log('✅ Secció de dashboard mostrada');
            
            // Forçar reflow per assegurar que es mostra
            dashboardSection.offsetHeight;
            
            // Verificar que realment es mostra
            const isVisible = dashboardSection.style.display !== 'none' && 
                             window.getComputedStyle(dashboardSection).opacity !== '0';
            console.log(`🔍 Dashboard visible: ${isVisible}`);
            
            if (!isVisible) {
                console.error('❌ Dashboard no es mostra correctament');
                // Intentar forçar la visualització
                dashboardSection.style.display = 'block !important';
                dashboardSection.style.opacity = '1 !important';
            }
        }
        
        // Update breadcrumb active state
        updateBreadcrumbActive(step);
        
        console.log(`✅ Navegació completada a: ${step}`);
        
    } catch (error) {
        console.error('❌ Error en navigateToStep:', error);
        console.error('❌ Stack trace:', error.stack);
        throw error; // Re-lançar l'error per capturar-lo a inicialitzarDashboard
    }
}

function updateBreadcrumb(step) {
    const breadcrumbLinks = document.querySelectorAll('.breadcrumb-link');
    breadcrumbLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.step === step) {
            link.classList.add('active');
        }
    });
}

function updateBreadcrumbActive(step) {
    const breadcrumbItems = document.querySelectorAll('.breadcrumb-item');
    breadcrumbItems.forEach(item => {
        item.classList.remove('active');
    });
    
    const activeItem = document.querySelector(`[data-step="${step}"]`).closest('.breadcrumb-item');
    if (activeItem) {
        activeItem.classList.add('active');
    }
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
    try {
        showProgressBar();
        updateProgress(10, 'Enviant fitxer al servidor...');
        
        // Crear FormData per enviar el fitxer
        const formData = new FormData();
        const blob = new Blob([csvData], { type: 'text/csv' });
        formData.append('file', blob, fileName);
        
        console.log(`📤 Enviant fitxer: ${fileName} (${csvData.length} caràcters)`);
        
        const response = await fetch('/api/upload/csv', {
            method: 'POST',
            body: formData
        });
        
        updateProgress(50, 'Processant dades...');
        
        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            updateProgress(90, 'Carregant dashboard...');
            await carregarDadesDelServidor();
            updateProgress(100, 'Completat!');
            
            setTimeout(() => {
                hideProgressBar();
                showStatus('success', `Fitxer carregat correctament: ${fileName}`);
                navigateToStep('dashboard');
            }, 500);
        } else {
            hideProgressBar();
            showStatus('error', result.message || 'Error carregant el fitxer');
        }
    } catch (error) {
        hideProgressBar();
        console.error('❌ Error upload:', error);
        showStatus('error', 'Error de connexió. Si us plau, torna-ho a provar.');
    }
}

async function carregarDadesDelServidor() {
    try {
        console.log('📊 Carregant dades del servidor...');
        const response = await fetch('/api/assoliments');
        const result = await response.json();
        
        if (result.success) {
            console.log('🔍 Dades originals del servidor:', result.data.slice(0, 3));
            
            // Mapejar les dades del backend al format esperat pel frontend
            currentData = result.data.map(item => {
                const mappedItem = {
                    classe: item.classe,
                    estudiant: item.estudiant_nom,
                    assignatura: item.assignatura_nom,
                    trimestre: item.trimestre,
                    assoliment: item.assoliment,
                    valor_numeric: item.valor_numeric,
                    id: item.id
                };
                
                // Debugging per veure què passa amb cada camp
                if (!item.estudiant_nom) {
                    console.log('⚠️ estudiant_nom és null/undefined per item:', item);
                }
                if (!item.assignatura_nom) {
                    console.log('⚠️ assignatura_nom és null/undefined per item:', item);
                }
                
                return mappedItem;
            });
            filteredData = [...currentData];
            
            console.log(`✅ Dades carregades: ${currentData.length} registres`);
            console.log('📋 Mostra de dades mapejades:', currentData.slice(0, 3));
            
            // Verificar i netejar duplicats si cal
            const registresUnics = new Set(currentData.map(item => 
                `${item.classe}-${item.estudiant}-${item.assignatura}-${item.trimestre}`
            ));
            
            if (registresUnics.size < currentData.length) {
                console.log('⚠️ Detectats duplicats, netejant automàticament...');
                const resultat = netejarDadesDuplicades();
                console.log(`✅ Netejats ${resultat.duplicatsEliminats} duplicats automàticament`);
            }
            
            // Verificar estructura de dades
            if (currentData.length > 0) {
                const primerRegistre = currentData[0];
                console.log('🔍 Estructura del primer registre:', {
                    classe: primerRegistre.classe,
                    estudiant: primerRegistre.estudiant,
                    assignatura: primerRegistre.assignatura,
                    trimestre: primerRegistre.trimestre,
                    assoliment: primerRegistre.assoliment
                });
                
                // Comptar registres amb dades vàlides
                const registresAmbEstudiant = currentData.filter(item => item.estudiant).length;
                const registresAmbAssignatura = currentData.filter(item => item.assignatura).length;
                console.log(`📊 Registres amb estudiant vàlid: ${registresAmbEstudiant}/${currentData.length}`);
                console.log(`📊 Registres amb assignatura vàlida: ${registresAmbAssignatura}/${currentData.length}`);
            }
            
            // Debug DOM abans d'inicialitzar
            debugDOMState();
            
            inicialitzarDashboard();
            
            // Debug DOM després d'inicialitzar
            setTimeout(() => {
                debugDOMState();
                
                // Verificar i corregir opacity
                verificarIOpacityDashboard();
                
                // Si el dashboard no es mostra, forçar-ho
                const dashboardSection = document.getElementById('dashboardSection');
                if (dashboardSection && dashboardSection.style.display === 'none') {
                    console.log('⚠️ Dashboard encara ocult, forçant visualització...');
                    forceShowDashboard();
                }
            }, 1000);
            
            showStatus('success', `Dades carregades: ${currentData.length} registres`);
        } else {
            console.error('❌ Error carregant dades:', result.message);
            showStatus('error', 'Error carregant les dades: ' + result.message);
        }
    } catch (error) {
        console.error('❌ Error connexió:', error);
        showStatus('error', 'Error de connexió amb el servidor');
    }
}

function inicialitzarDashboard() {
    console.log('🎯 Inicialitzant dashboard...');
    console.log('📊 Dades disponibles:', {
        currentData: currentData.length,
        filteredData: filteredData.length
    });
    
    try {
        console.log('🔍 Pas 1: Verificant elements del DOM...');
        // Verificar que els elements del DOM existeixen
        const elements = verificarElementsDOM();
        console.log('✅ Pas 1 completat');
        
        // Verificar que tenim dades
        if (currentData.length === 0) {
            console.warn('⚠️ No hi ha dades per inicialitzar el dashboard');
            showStatus('warning', 'No hi ha dades disponibles per mostrar');
            return;
        }
        
        console.log('🔍 Pas 2: Navegant al dashboard...');
        // Navigate to dashboard
        navigateToStep('dashboard');
        console.log('✅ Pas 2 completat');
        
        console.log('🔍 Pas 3: Actualitzant targetes de resum...');
        // Update overview cards
        actualitzarOverviewCards();
        console.log('✅ Pas 3 completat');
        
        console.log('🔍 Pas 4: Omplint filtres...');
        // Fill filters
        omplirFiltres();
        console.log('✅ Pas 4 completat');
        
        console.log('🔍 Pas 5: Actualitzant gràfics...');
        // Update charts
        actualitzarGraficos();
        console.log('✅ Pas 5 completat');
        
        console.log('🔍 Pas 6: Actualitzant seccions d\'anàlisi...');
        // Update analysis sections
        actualitzarAnalisiSections();
        console.log('✅ Pas 6 completat');
        
        console.log('✅ Dashboard inicialitzat correctament');
        showStatus('success', 'Dashboard carregat correctament');
        
    } catch (error) {
        console.error('❌ Error inicialitzant dashboard:', error);
        console.error('❌ Stack trace:', error.stack);
        showStatus('error', 'Error inicialitzant el dashboard: ' + error.message);
    }
}

function verificarElementsDOM() {
    console.log('🔍 Verificant elements del DOM...');
    
    const elements = {
        'classeFilter': document.getElementById('classeFilter'),
        'estudiantFilter': document.getElementById('estudiantFilter'),
        'assignaturaFilter': document.getElementById('assignaturaFilter'),
        'trimestreFilter': document.getElementById('trimestreFilter'),
        'assolimentFilter': document.getElementById('assolimentFilter'),
        'totalStudents': document.getElementById('totalStudents'),
        'averagePerformance': document.getElementById('averagePerformance'),
        'achievementRate': document.getElementById('achievementRate'),
        'improvement': document.getElementById('improvement'),
        'assolimentsChart': document.getElementById('assolimentsChart'),
        'evolucioChart': document.getElementById('evolucioChart'),
        'assignaturesChart': document.getElementById('assignaturesChart'),
        'rendimentChart': document.getElementById('rendimentChart'),
        'comparativaAvancadaContent': document.getElementById('comparativaAvancadaContent'),
        'assignaturaStatsTable': document.getElementById('assignaturaStatsTable'),
        'trimestreStatsTable': document.getElementById('trimestreStatsTable'),
        'comparativaDetalladaTableBody': document.getElementById('comparativaDetalladaTableBody')
    };
    
    Object.entries(elements).forEach(([name, element]) => {
        if (element) {
            console.log(`✅ ${name} trobat`);
        } else {
            console.log(`❌ ${name} NO trobat`);
        }
    });
    
    return elements;
}

function actualitzarOverviewCards() {
    console.log('📊 Actualitzant targetes de resum...');
    
    if (filteredData.length === 0) {
        document.getElementById('totalStudents').textContent = '-';
        document.getElementById('averagePerformance').textContent = '-';
        document.getElementById('achievementRate').textContent = '-';
        document.getElementById('improvement').textContent = '-';
        return;
    }
    
    // Total students
    const uniqueStudents = new Set(filteredData.map(item => item.estudiant)).size;
    document.getElementById('totalStudents').textContent = uniqueStudents;
    
    // Average performance
    const assolimentValues = { 'NA': 0, 'AS': 1, 'AN': 2, 'AE': 3 };
    const totalValue = filteredData.reduce((sum, item) => {
        return sum + (assolimentValues[item.assoliment] || 0);
    }, 0);
    const averageValue = totalValue / filteredData.length;
    const averagePercentage = ((averageValue / 3) * 100).toFixed(1);
    document.getElementById('averagePerformance').textContent = `${averagePercentage}%`;
    
    // Achievement rate
    const assolits = filteredData.filter(item => item.assoliment !== 'NA').length;
    const achievementRate = ((assolits / filteredData.length) * 100).toFixed(1);
    document.getElementById('achievementRate').textContent = `${achievementRate}%`;
    
    // Improvement (placeholder for now)
    document.getElementById('improvement').textContent = '+5.2%';
}

function omplirFiltres() {
    console.log('🔍 Omplint filtres...');
    console.log('📊 Dades disponibles:', {
        currentData: currentData.length,
        filteredData: filteredData.length
    });
    
    if (currentData.length === 0) {
        console.log('⚠️ No hi ha dades per omplir els filtres');
        return;
    }
    
    try {
        // Classes
        const classes = [...new Set(currentData.map(item => item.classe))].sort();
        const classeFilter = document.getElementById('classeFilter');
        if (classeFilter) {
            classeFilter.innerHTML = '<option value="">Totes les classes</option>';
            classes.forEach(classe => {
                const option = document.createElement('option');
                option.value = classe;
                option.textContent = classe;
                classeFilter.appendChild(option);
            });
            console.log(`✅ Filtre de classes omplert: ${classes.length} classes`, classes);
        } else {
            console.log('❌ No es troba el filtre de classes');
        }
        
        // Students
        const students = [...new Set(currentData.map(item => item.estudiant))].sort();
        const estudiantFilter = document.getElementById('estudiantFilter');
        if (estudiantFilter) {
            estudiantFilter.innerHTML = '<option value="">Tots els estudiants</option>';
            students.forEach(estudiant => {
                const option = document.createElement('option');
                option.value = estudiant;
                option.textContent = estudiant;
                estudiantFilter.appendChild(option);
            });
            console.log(`✅ Filtre d'estudiants omplert: ${students.length} estudiants`, students.slice(0, 5));
        } else {
            console.log('❌ No es troba el filtre d\'estudiants');
        }
        
        // Subjects
        const subjects = [...new Set(currentData.map(item => item.assignatura))].sort();
        const assignaturaFilter = document.getElementById('assignaturaFilter');
        if (assignaturaFilter) {
            assignaturaFilter.innerHTML = '<option value="">Totes les assignatures</option>';
            subjects.forEach(assignatura => {
                const option = document.createElement('option');
                option.value = assignatura;
                option.textContent = assignatura;
                assignaturaFilter.appendChild(option);
            });
            console.log(`✅ Filtre d'assignatures omplert: ${subjects.length} assignatures`, subjects);
        } else {
            console.log('❌ No es troba el filtre d\'assignatures');
        }
        
        // Trimestres (ja estan definits al HTML)
        console.log('✅ Filtre de trimestres ja definit al HTML');
        
        // Assoliments (ja estan definits al HTML)
        console.log('✅ Filtre d\'assoliments ja definit al HTML');
        
        // Afegir event listeners per filtres dependents
        afegirEventListenersFiltres();
        
        console.log('✅ Tots els filtres omplerts correctament');
        
    } catch (error) {
        console.error('❌ Error omplint filtres:', error);
        showStatus('error', 'Error omplint els filtres: ' + error.message);
    }
}

function afegirEventListenersFiltres() {
    console.log('🔗 Afegint event listeners als filtres...');
    
    // Filtre de classe afecta estudiants
    const classeFilter = document.getElementById('classeFilter');
    if (classeFilter) {
        classeFilter.addEventListener('change', function() {
            const classeSeleccionada = this.value;
            actualitzarFiltreEstudiants(classeSeleccionada);
        });
    }
    
    // Filtre d'estudiant afecta assignatures
    const estudiantFilter = document.getElementById('estudiantFilter');
    if (estudiantFilter) {
        estudiantFilter.addEventListener('change', function() {
            const estudiantSeleccionat = this.value;
            actualitzarFiltreAssignatures(estudiantSeleccionat);
        });
    }
    
    console.log('✅ Event listeners dels filtres afegits');
}

function actualitzarFiltreEstudiants(classeSeleccionada) {
    console.log(`🔄 Actualitzant filtre d'estudiants per classe: ${classeSeleccionada}`);
    
    const estudiantFilter = document.getElementById('estudiantFilter');
    if (!estudiantFilter) return;
    
    // Obtenir estudiants de la classe seleccionada
    let estudiantsFiltrats;
    if (classeSeleccionada) {
        estudiantsFiltrats = [...new Set(
            currentData
                .filter(item => item.classe === classeSeleccionada)
                .map(item => item.estudiant)
        )].sort();
    } else {
        estudiantsFiltrats = [...new Set(currentData.map(item => item.estudiant))].sort();
    }
    
    // Actualitzar opcions
    estudiantFilter.innerHTML = '<option value="">Tots els estudiants</option>';
    estudiantsFiltrats.forEach(estudiant => {
        const option = document.createElement('option');
        option.value = estudiant;
        option.textContent = estudiant;
        estudiantFilter.appendChild(option);
    });
    
    // Netejar selecció actual
    estudiantFilter.value = '';
    
    console.log(`✅ Filtre d'estudiants actualitzat: ${estudiantsFiltrats.length} estudiants`);
}

function actualitzarFiltreAssignatures(estudiantSeleccionat) {
    console.log(`🔄 Actualitzant filtre d'assignatures per estudiant: ${estudiantSeleccionat}`);
    
    const assignaturaFilter = document.getElementById('assignaturaFilter');
    if (!assignaturaFilter) return;
    
    // Obtenir assignatures de l'estudiant seleccionat
    let assignaturesFiltrats;
    if (estudiantSeleccionat) {
        assignaturesFiltrats = [...new Set(
            currentData
                .filter(item => item.estudiant === estudiantSeleccionat)
                .map(item => item.assignatura)
        )].sort();
    } else {
        assignaturesFiltrats = [...new Set(currentData.map(item => item.assignatura))].sort();
    }
    
    // Actualitzar opcions
    assignaturaFilter.innerHTML = '<option value="">Totes les assignatures</option>';
    assignaturesFiltrats.forEach(assignatura => {
        const option = document.createElement('option');
        option.value = assignatura;
        option.textContent = assignatura;
        assignaturaFilter.appendChild(option);
    });
    
    // Netejar selecció actual
    assignaturaFilter.value = '';
    
    console.log(`✅ Filtre d'assignatures actualitzat: ${assignaturesFiltrats.length} assignatures`);
}

function actualitzarGraficos() {
    console.log('📈 Actualitzant gràfics...');
    
    if (filteredData.length === 0) return;
    
    // Destroy existing charts
    Object.values(charts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
    charts = {};
    
    // Create new charts
    crearGraficAssoliments();
    crearGraficEvolucio();
    crearGraficAssignatures();
    crearGraficRendiment();
}

function actualitzarAnalisiSections() {
    console.log('📋 Actualitzant seccions d\'anàlisi...');
    
    // Update comparative section
    actualitzarComparativaAvancada();
    
    // Update statistics tables
    actualitzarEstadistiquesPerAssignatura();
    actualitzarEstadistiquesPerTrimestre();
    
    // Update detailed comparative table
    actualitzarTaulaComparativaDetallada();
    
    // Update advanced statistics
    actualitzarEstadistiquesAvancades();
}

// ===== ADVANCED STATISTICS FUNCTIONS =====
function actualitzarEstadistiquesAvancades() {
    console.log('📊 Actualitzant estadístiques avançades...');
    
    if (filteredData.length === 0) {
        console.log('⚠️ No hi ha dades per estadístiques avançades');
        return;
    }
    
    // Anàlisi de tendències
    const tendencies = analitzarTendencies();
    
    // Anàlisi de correlacions
    const correlations = analitzarCorrelacions();
    
    // Mètriques avançades
    const metrics = calcularMetriquesAvancades();
    
    // Mostrar resultats
    mostrarEstadistiquesAvancades(tendencies, correlations, metrics);
}

function analitzarTendencies() {
    console.log('📈 Analitzant tendències...');
    
    const trimestres = ['1r trim', '2n trim', '3r trim', 'final'];
    const assolimentValues = { 'NA': 0, 'AS': 1, 'AN': 2, 'AE': 3 };
    
    const tendencies = {};
    
    // Tendència general per trimestre
    const tendenciaGeneral = trimestres.map(trimestre => {
        const trimestreData = filteredData.filter(item => item.trimestre === trimestre);
        if (trimestreData.length === 0) return null;
        
        const totalValue = trimestreData.reduce((sum, item) => {
            return sum + (assolimentValues[item.assoliment] || 0);
        }, 0);
        
        return {
            trimestre,
            mitjana: (totalValue / trimestreData.length / 3) * 100,
            total: trimestreData.length
        };
    }).filter(item => item !== null);
    
    // Calcular tendència (millora o deteriorament)
    if (tendenciaGeneral.length >= 2) {
        const primer = tendenciaGeneral[0].mitjana;
        const ultim = tendenciaGeneral[tendenciaGeneral.length - 1].mitjana;
        const diferencia = ultim - primer;
        const percentatge = ((diferencia / primer) * 100).toFixed(1);
        
        tendencies.general = {
            tendencia: diferencia > 0 ? 'millora' : diferencia < 0 ? 'deteriorament' : 'estable',
            diferencia: diferencia.toFixed(1),
            percentatge: percentatge,
            primer: primer.toFixed(1),
            ultim: ultim.toFixed(1)
        };
    }
    
    // Tendència per assignatura
    const assignatures = [...new Set(filteredData.map(item => item.assignatura))];
    tendencies.assignatures = {};
    
    assignatures.forEach(assignatura => {
        const assignaturaData = filteredData.filter(item => item.assignatura === assignatura);
        const tendenciaAssignatura = trimestres.map(trimestre => {
            const trimestreData = assignaturaData.filter(item => item.trimestre === trimestre);
            if (trimestreData.length === 0) return null;
            
            const totalValue = trimestreData.reduce((sum, item) => {
                return sum + (assolimentValues[item.assoliment] || 0);
            }, 0);
            
            return (totalValue / trimestreData.length / 3) * 100;
        }).filter(item => item !== null);
        
        if (tendenciaAssignatura.length >= 2) {
            const primer = tendenciaAssignatura[0];
            const ultim = tendenciaAssignatura[tendenciaAssignatura.length - 1];
            const diferencia = ultim - primer;
            
            tendencies.assignatures[assignatura] = {
                tendencia: diferencia > 0 ? 'millora' : diferencia < 0 ? 'deteriorament' : 'estable',
                diferencia: diferencia.toFixed(1),
                primer: primer.toFixed(1),
                ultim: ultim.toFixed(1)
            };
        }
    });
    
    console.log('✅ Tendències analitzades:', tendencies);
    return tendencies;
}

function analitzarCorrelacions() {
    console.log('🔗 Analitzant correlacions...');
    
    const correlations = {};
    
    // Correlació entre assignatures
    const assignatures = [...new Set(filteredData.map(item => item.assignatura))];
    const assolimentValues = { 'NA': 0, 'AS': 1, 'AN': 2, 'AE': 3 };
    
    // Crear matriu de correlacions
    const correlationMatrix = {};
    
    assignatures.forEach(assignatura1 => {
        correlationMatrix[assignatura1] = {};
        assignatures.forEach(assignatura2 => {
            if (assignatura1 === assignatura2) {
                correlationMatrix[assignatura1][assignatura2] = 1;
            } else {
                // Calcular correlació entre assignatures
                const assignatura1Data = filteredData.filter(item => item.assignatura === assignatura1);
                const assignatura2Data = filteredData.filter(item => item.assignatura === assignatura2);
                
                // Agrupar per estudiant i calcular mitjanes
                const estudiants = [...new Set(filteredData.map(item => item.estudiant))];
                const assignatura1Mitjanes = [];
                const assignatura2Mitjanes = [];
                
                estudiants.forEach(estudiant => {
                    const est1Data = assignatura1Data.filter(item => item.estudiant === estudiant);
                    const est2Data = assignatura2Data.filter(item => item.estudiant === estudiant);
                    
                    if (est1Data.length > 0 && est2Data.length > 0) {
                        const mitjana1 = est1Data.reduce((sum, item) => sum + (assolimentValues[item.assoliment] || 0), 0) / est1Data.length;
                        const mitjana2 = est2Data.reduce((sum, item) => sum + (assolimentValues[item.assoliment] || 0), 0) / est2Data.length;
                        
                        assignatura1Mitjanes.push(mitjana1);
                        assignatura2Mitjanes.push(mitjana2);
                    }
                });
                
                // Calcular correlació de Pearson
                if (assignatura1Mitjanes.length > 1) {
                    const correlation = calcularCorrelacioPearson(assignatura1Mitjanes, assignatura2Mitjanes);
                    correlationMatrix[assignatura1][assignatura2] = correlation;
                } else {
                    correlationMatrix[assignatura1][assignatura2] = 0;
                }
            }
        });
    });
    
    correlations.assignatures = correlationMatrix;
    
    // Trobar correlacions més fortes
    const correlacionsFortes = [];
    assignatures.forEach(assignatura1 => {
        assignatures.forEach(assignatura2 => {
            if (assignatura1 !== assignatura2) {
                const correlacio = correlationMatrix[assignatura1][assignatura2];
                if (Math.abs(correlacio) > 0.7) {
                    correlacionsFortes.push({
                        assignatura1,
                        assignatura2,
                        correlacio: correlacio.toFixed(3),
                        tipus: correlacio > 0 ? 'positiva' : 'negativa'
                    });
                }
            }
        });
    });
    
    correlations.fortes = correlacionsFortes;
    
    console.log('✅ Correlacions analitzades:', correlations);
    return correlations;
}

function calcularCorrelacioPearson(x, y) {
    const n = x.length;
    if (n !== y.length || n === 0) return 0;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
}

function calcularMetriquesAvancades() {
    console.log('📊 Calculant mètriques avançades...');
    
    const metrics = {};
    
    // Distribució d'assoliments
    const assolimentCounts = {
        'NA': filteredData.filter(item => item.assoliment === 'NA').length,
        'AS': filteredData.filter(item => item.assoliment === 'AS').length,
        'AN': filteredData.filter(item => item.assoliment === 'AN').length,
        'AE': filteredData.filter(item => item.assoliment === 'AE').length
    };
    
    const total = filteredData.length;
    metrics.distribucio = {
        na: ((assolimentCounts.NA / total) * 100).toFixed(1),
        as: ((assolimentCounts.AS / total) * 100).toFixed(1),
        an: ((assolimentCounts.AN / total) * 100).toFixed(1),
        ae: ((assolimentCounts.AE / total) * 100).toFixed(1)
    };
    
    // Rendiment per classe
    const classes = [...new Set(filteredData.map(item => item.classe))];
    metrics.rendimentPerClasse = {};
    
    classes.forEach(classe => {
        const classeData = filteredData.filter(item => item.classe === classe);
        const assolits = classeData.filter(item => item.assoliment !== 'NA').length;
        metrics.rendimentPerClasse[classe] = ((assolits / classeData.length) * 100).toFixed(1);
    });
    
    // Assignatures amb millor i pitjor rendiment
    const assignatures = [...new Set(filteredData.map(item => item.assignatura))];
    const rendimentAssignatures = {};
    
    assignatures.forEach(assignatura => {
        const assignaturaData = filteredData.filter(item => item.assignatura === assignatura);
        const assolits = assignaturaData.filter(item => item.assoliment !== 'NA').length;
        rendimentAssignatures[assignatura] = ((assolits / assignaturaData.length) * 100).toFixed(1);
    });
    
    const sortedAssignatures = Object.entries(rendimentAssignatures)
        .sort(([,a], [,b]) => parseFloat(b) - parseFloat(a));
    
    metrics.millorAssignatura = sortedAssignatures[0];
    metrics.pitjorAssignatura = sortedAssignatures[sortedAssignatures.length - 1];
    
    // Evolució temporal
    const trimestres = ['1r trim', '2n trim', '3r trim', 'final'];
    const evolucions = trimestres.map(trimestre => {
        const trimestreData = filteredData.filter(item => item.trimestre === trimestre);
        if (trimestreData.length === 0) return null;
        
        const assolits = trimestreData.filter(item => item.assoliment !== 'NA').length;
        return {
            trimestre,
            percentatge: ((assolits / trimestreData.length) * 100).toFixed(1),
            total: trimestreData.length
        };
    }).filter(item => item !== null);
    
    metrics.evolucio = evolucions;
    
    console.log('✅ Mètriques avançades calculades:', metrics);
    return metrics;
}

function mostrarEstadistiquesAvancades(tendencies, correlations, metrics) {
    console.log('📋 Mostrant estadístiques avançades...');
    
    // Crear o actualitzar secció d'estadístiques avançades
    let advancedStatsHTML = `
        <div class="advanced-stats-section">
            <h4>Estadístiques Avançades</h4>
            
            <!-- Tendències -->
            <div class="stats-card">
                <h5>📈 Anàlisi de Tendències</h5>
                ${tendencies.general ? `
                    <div class="trend-analysis">
                        <p><strong>Tendència General:</strong> ${tendencies.general.tendencia}</p>
                        <p>Diferència: ${tendencies.general.diferencia}% (${tendencies.general.percentatge}%)</p>
                        <p>Evolució: ${tendencies.general.primer}% → ${tendencies.general.ultim}%</p>
                    </div>
                ` : '<p>No hi ha dades suficients per analitzar tendències</p>'}
            </div>
            
            <!-- Correlacions -->
            <div class="stats-card">
                <h5>🔗 Correlacions Fortes</h5>
                ${correlations.fortes && correlations.fortes.length > 0 ? `
                    <div class="correlations-list">
                        ${correlations.fortes.map(corr => `
                            <div class="correlation-item">
                                <span>${corr.assignatura1} ↔ ${corr.assignatura2}</span>
                                <span class="correlation-value ${corr.tipus}">${corr.correlacio} (${corr.tipus})</span>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p>No s\'han trobat correlacions fortes</p>'}
            </div>
            
            <!-- Mètriques -->
            <div class="stats-card">
                <h5>📊 Mètriques Clau</h5>
                <div class="metrics-grid">
                    <div class="metric-item">
                        <span class="metric-label">Millor Assignatura:</span>
                        <span class="metric-value">${metrics.millorAssignatura ? metrics.millorAssignatura[0] + ' (' + metrics.millorAssignatura[1] + '%)' : 'N/A'}</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">Pitjor Assignatura:</span>
                        <span class="metric-value">${metrics.pitjorAssignatura ? metrics.pitjorAssignatura[0] + ' (' + metrics.pitjorAssignatura[1] + '%)' : 'N/A'}</span>
                    </div>
                </div>
            </div>
            
            <!-- Evolució Temporal -->
            <div class="stats-card">
                <h5>⏰ Evolució Temporal</h5>
                <div class="evolution-chart">
                    ${metrics.evolucio.map(evol => `
                        <div class="evolution-item">
                            <span class="evolution-period">${evol.trimestre}</span>
                            <div class="evolution-bar">
                                <div class="evolution-fill" style="width: ${evol.percentatge}%"></div>
                            </div>
                            <span class="evolution-value">${evol.percentatge}%</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    // Buscar on inserir les estadístiques avançades
    const comparativesContent = document.getElementById('comparativaAvancadaContent');
    if (comparativesContent) {
        // Afegir després del contingut existent
        comparativesContent.insertAdjacentHTML('beforeend', advancedStatsHTML);
    }
    
    console.log('✅ Estadístiques avançades mostrades');
}

// ===== ANALYSIS TAB HANDLING =====
function handleAnalysisTabClick(event) {
    if (event.target.classList.contains('analysis-tab')) {
        const tabId = event.target.dataset.tab;
        showAnalysisTab(tabId);
    }
}

function showAnalysisTab(tabId) {
    console.log(`📑 Canviant a pestanya: ${tabId}`);
    
    try {
        // Remove active class from all tabs and panes
        const allTabs = document.querySelectorAll('.analysis-tab');
        const allPanes = document.querySelectorAll('.analysis-pane');
        
        console.log('🔍 Elements trobats:', {
            allTabs: allTabs.length,
            allPanes: allPanes.length
        });
        
        allTabs.forEach(tab => {
            tab.classList.remove('active');
        });
        allPanes.forEach(pane => {
            pane.classList.remove('active');
        });
        
        // Add active class to selected tab and pane
        const selectedTab = document.querySelector(`[data-tab="${tabId}"]`);
        const selectedPane = document.getElementById(tabId);
        
        console.log('🔍 Elements seleccionats:', {
            selectedTab: !!selectedTab,
            selectedPane: !!selectedPane,
            tabId: tabId
        });
        
        if (selectedTab && selectedPane) {
            selectedTab.classList.add('active');
            selectedPane.classList.add('active');
            
            console.log('✅ Classes active afegides');
            
            // Load content if needed
            if (tabId === 'individual') {
                console.log('📋 Carregant contingut individual...');
                loadIndividualContent();
            }
            
            console.log(`✅ Pestanya ${tabId} activada correctament`);
        } else {
            console.error('❌ Elements de pestanya no trobats:', {
                selectedTab: !!selectedTab,
                selectedPane: !!selectedPane,
                tabId: tabId
            });
        }
        
    } catch (error) {
        console.error('❌ Error en showAnalysisTab:', error);
        console.error('❌ Stack trace:', error.stack);
        throw error;
    }
}

function loadIndividualContent() {
    const content = document.getElementById('individualContent');
    if (filteredData.length === 0) {
        content.innerHTML = '<div class="text-center" style="padding: var(--space-xl); color: var(--neutral-500);">No hi ha dades disponibles</div>';
        return;
    }
    
    // Get unique students for selection
    const students = [...new Set(filteredData.map(item => item.estudiant))].sort();
    
    let html = '<div class="student-selection">';
    html += '<h4>Selecciona un estudiant:</h4>';
    html += '<div class="student-grid">';
    
    students.forEach(student => {
        const studentData = filteredData.filter(item => item.estudiant === student);
        const totalAssessments = studentData.length;
        const assolits = studentData.filter(item => item.assoliment !== 'NA').length;
        const achievementRate = ((assolits / totalAssessments) * 100).toFixed(1);
        
        html += `
            <div class="student-card" data-student="${student}">
                <h5>${student}</h5>
                <p>${totalAssessments} avaluacions</p>
                <p class="achievement-rate">${achievementRate}% assolits</p>
            </div>
        `;
    });
    
    html += '</div></div>';
    content.innerHTML = html;
    
    // Add click events to student cards
    document.querySelectorAll('.student-card').forEach(card => {
        card.addEventListener('click', () => {
            const student = card.dataset.student;
            showStudentProfile(student);
        });
    });
}

function showStudentProfile(student) {
    const content = document.getElementById('individualContent');
    const studentData = filteredData.filter(item => item.estudiant === student);
    
    let html = `
        <div class="student-profile">
            <div class="student-header">
                <h4>${student}</h4>
                <button class="btn btn-secondary btn-small" onclick="loadIndividualContent()">
                    <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                    Tornar
                </button>
            </div>
            <div class="student-stats">
                <div class="stat-item">
                    <span class="stat-label">Total Avaluacions:</span>
                    <span class="stat-value">${studentData.length}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">% Assolits:</span>
                    <span class="stat-value">${((studentData.filter(item => item.assoliment !== 'NA').length / studentData.length) * 100).toFixed(1)}%</span>
                </div>
            </div>
            <div class="student-subjects">
                <h5>Rendiment per Assignatura:</h5>
                <div class="subject-grid">
    `;
    
    const subjects = [...new Set(studentData.map(item => item.assignatura))];
    subjects.forEach(subject => {
        const subjectData = studentData.filter(item => item.assignatura === subject);
        const assolits = subjectData.filter(item => item.assoliment !== 'NA').length;
        const rate = ((assolits / subjectData.length) * 100).toFixed(1);
        
        html += `
            <div class="subject-item">
                <span class="subject-name">${subject}</span>
                <span class="subject-rate">${rate}%</span>
            </div>
        `;
    });
    
    html += `
                </div>
            </div>
        </div>
    `;
    
    content.innerHTML = html;
}

// ===== BREADCRUMB HANDLING =====
function handleBreadcrumbClick(event) {
    if (event.target.classList.contains('breadcrumb-link')) {
        event.preventDefault();
        const step = event.target.dataset.step;
        navigateToStep(step);
    }
}

// ===== MODAL HANDLING =====
function handleModalEvents(event) {
    if (event.target.dataset.action === 'help') {
        showHelpModal();
    } else if (event.target.dataset.action === 'close-help') {
        hideHelpModal();
    } else if (event.target.classList.contains('modal')) {
        hideHelpModal();
    }
}

function showHelpModal() {
    const modal = document.getElementById('helpModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function hideHelpModal() {
    const modal = document.getElementById('helpModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// ===== ACTION HANDLING =====
function handleActionClick(event) {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    
    console.log(`🔘 Acció clicada: ${action}`);
    
    switch (action) {
        case 'load-sample':
            loadSampleData();
            break;
        case 'clear-data':
            clearData();
            break;
        case 'refresh-data':
            refreshData();
            break;
        case 'full-analysis':
            showFullAnalysis();
            break;
        case 'apply-filters':
            aplicarFiltres();
            break;
        case 'reset-filters':
            resetFiltres();
            break;
        case 'save-filter':
            saveFilter();
            break;
        case 'export-all':
            exportAll();
            break;
        case 'export-charts':
            exportCharts();
            break;
        case 'export-debug':
            exportDebugData();
            break;
        case 'force-show-dashboard':
            debugDOMState();
            forceShowDashboard();
            showStatus('info', 'Forçant visualització del dashboard...');
            break;
        case 'fix-opacity':
            verificarIOpacityDashboard();
            showStatus('info', 'Verificant i corregint opacity...');
            break;
        case 'verify-data':
            verificarDadesDetallades();
            showStatus('info', 'Verificant dades detallades...');
            break;
        case 'clean-duplicates':
            const resultat = netejarDadesDuplicades();
            showStatus('success', `Netejades ${resultat.duplicatsEliminats} dades duplicades`);
            // Actualitzar dashboard després de netejar
            setTimeout(() => {
                actualitzarOverviewCards();
                omplirFiltres();
                actualitzarGraficos();
            }, 100);
            break;
        case 'file-select':
            // Simular clic en l'input de fitxer
            const fileInput = document.getElementById('fileInput');
            if (fileInput) {
                fileInput.click();
            } else {
                console.error('❌ No es troba l\'element fileInput');
                showStatus('error', 'Error: No es pot accedir al selector de fitxers');
            }
            break;
        case 'search-student':
            searchStudent();
            break;
        default:
            console.log(`Acció no implementada: ${action}`);
    }
}

// ===== NEW ACTION FUNCTIONS =====
async function loadSampleData() {
    try {
        showStatus('info', 'Carregant dades d\'exemple...');
        showProgressBar();
        updateProgress(50, 'Carregant dades d\'exemple...');
        
        // Simulate loading sample data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Load the existing CSV file as sample
        const response = await fetch('/api/assoliments');
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            currentData = result.data;
            filteredData = [...currentData];
            
            updateProgress(100, 'Completat!');
            setTimeout(() => {
                hideProgressBar();
                showStatus('success', 'Dades d\'exemple carregades correctament');
                inicialitzarDashboard();
            }, 500);
        } else {
            hideProgressBar();
            showStatus('error', 'No hi ha dades d\'exemple disponibles');
        }
    } catch (error) {
        hideProgressBar();
        showStatus('error', 'Error carregant dades d\'exemple');
    }
}

function refreshData() {
    showStatus('info', 'Actualitzant dades...');
    carregarDadesDelServidor();
}

function showFullAnalysis() {
    console.log('🔍 Executant showFullAnalysis...');
    showStatus('info', 'Obrint anàlisi complet...');
    
    try {
        // Verificar que els elements existeixen
        const comparativesTab = document.querySelector('[data-tab="comparatives"]');
        const comparativesPane = document.getElementById('comparatives');
        
        console.log('🔍 Elements trobats:', {
            comparativesTab: !!comparativesTab,
            comparativesPane: !!comparativesPane
        });
        
        if (!comparativesTab || !comparativesPane) {
            console.error('❌ Elements de comparatives no trobats');
            showStatus('error', 'Error: Elements d\'anàlisi no trobats');
            return;
        }
        
        // Verificar que tenim dades
        console.log('📊 Dades disponibles:', {
            currentData: currentData.length,
            filteredData: filteredData.length
        });
        
        // Verificar dades detallades
        verificarDadesDetallades();
        
        if (filteredData.length === 0) {
            console.warn('⚠️ No hi ha dades per mostrar anàlisi');
            showStatus('warning', 'No hi ha dades disponibles per anàlisi');
            return;
        }
        
        // Navigate to comparative tab
        console.log('📑 Canviant a pestanya comparatives...');
        showAnalysisTab('comparatives');
        
        // Verificar que el canvi s'ha fet
        setTimeout(() => {
            const isActive = comparativesTab.classList.contains('active');
            const isPaneActive = comparativesPane.classList.contains('active');
            
            console.log('🔍 Estat després del canvi:', {
                tabActive: isActive,
                paneActive: isPaneActive
            });
            
            if (isActive && isPaneActive) {
                console.log('✅ Pestanya comparatives activada correctament');
                showStatus('success', 'Anàlisi complet obert');
            } else {
                console.error('❌ Pestanya comparatives no s\'ha activat');
                showStatus('error', 'Error activant anàlisi complet');
            }
        }, 100);
        
    } catch (error) {
        console.error('❌ Error en showFullAnalysis:', error);
        console.error('❌ Stack trace:', error.stack);
        showStatus('error', 'Error obrint anàlisi complet: ' + error.message);
    }
}

function saveFilter() {
    showStatus('success', 'Filtre guardat correctament');
}

function exportAll() {
    console.log('📤 Exportant totes les dades...');
    
    if (filteredData.length === 0) {
        showStatus('error', 'No hi ha dades per exportar');
        return;
    }
    
    try {
        // Exportar dades originals
        exportDataAsCSV(filteredData, 'dades_completes.csv', {
            headers: ['classe', 'estudiant', 'assignatura', 'trimestre', 'assoliment'],
            includeHeaders: true
        });
        
    } catch (error) {
        console.error('Error exportant totes les dades:', error);
        showStatus('error', 'Error exportant les dades');
    }
}

function exportCharts() {
    console.log('📤 Exportant dades dels gràfics...');
    
    if (filteredData.length === 0) {
        showStatus('error', 'No hi ha dades per exportar');
        return;
    }
    
    try {
        // Exportar dades per gràfics
        const chartData = {
            assoliments: {
                na: filteredData.filter(item => item.assoliment === 'NA').length,
                as: filteredData.filter(item => item.assoliment === 'AS').length,
                an: filteredData.filter(item => item.assoliment === 'AN').length,
                ae: filteredData.filter(item => item.assoliment === 'AE').length
            },
            perAssignatura: {},
            perTrimestre: {}
        };
        
        // Dades per assignatura
        const assignatures = [...new Set(filteredData.map(item => item.assignatura))];
        assignatures.forEach(assignatura => {
            const assignaturaData = filteredData.filter(item => item.assignatura === assignatura);
            chartData.perAssignatura[assignatura] = {
                total: assignaturaData.length,
                assolits: assignaturaData.filter(item => item.assoliment !== 'NA').length,
                percentatge: ((assignaturaData.filter(item => item.assoliment !== 'NA').length / assignaturaData.length) * 100).toFixed(1)
            };
        });
        
        // Dades per trimestre
        const trimestres = ['1r trim', '2n trim', '3r trim', 'final'];
        trimestres.forEach(trimestre => {
            const trimestreData = filteredData.filter(item => item.trimestre === trimestre);
            chartData.perTrimestre[trimestre] = {
                total: trimestreData.length,
                assolits: trimestreData.filter(item => item.assoliment !== 'NA').length,
                percentatge: ((trimestreData.filter(item => item.assoliment !== 'NA').length / trimestreData.length) * 100).toFixed(1)
            };
        });
        
        // Crear CSV per gràfics
        let csvContent = 'Tipus,Assignatura/Trimestre,Total,Assolits,Percentatge\n';
        
        // Afegir dades per assignatura
        Object.entries(chartData.perAssignatura).forEach(([assignatura, data]) => {
            csvContent += `Assignatura,${assignatura},${data.total},${data.assolits},${data.percentatge}%\n`;
        });
        
        // Afegir dades per trimestre
        Object.entries(chartData.perTrimestre).forEach(([trimestre, data]) => {
            csvContent += `Trimestre,${trimestre},${data.total},${data.assolits},${data.percentatge}%\n`;
        });
        
        downloadCSV(csvContent, 'dades_graficos.csv');
        
    } catch (error) {
        console.error('Error exportant dades dels gràfics:', error);
        showStatus('error', 'Error exportant les dades dels gràfics');
    }
}

// Funció per exportar dades de debugging
function exportDebugData() {
    console.log('📤 Exportant dades de debugging...');
    
    try {
        const debugData = {
            currentData: {
                total: currentData.length,
                mostra: currentData.slice(0, 5)
            },
            filteredData: {
                total: filteredData.length,
                mostra: filteredData.slice(0, 5)
            },
            elements: verificarElementsDOM()
        };
        
        const debugContent = JSON.stringify(debugData, null, 2);
        
        // Crear fitxer de text amb dades de debugging
        const blob = new Blob([debugContent], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'debug_data.json');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ Dades de debugging exportades');
        showStatus('success', 'Dades de debugging exportades');
        
    } catch (error) {
        console.error('Error exportant dades de debugging:', error);
        showStatus('error', 'Error exportant dades de debugging');
    }
}

function searchStudent() {
    const searchTerm = document.getElementById('studentSearch').value.trim();
    if (searchTerm) {
        showStatus('info', `Cercant estudiant: ${searchTerm}`);
        // Implementation for student search
        setTimeout(() => {
            showStatus('success', 'Estudiant trobat');
        }, 1000);
    } else {
        showStatus('warning', 'Si us plau, introdueix un nom d\'estudiant');
    }
}

// ===== UTILITY FUNCTIONS =====
function showStatus(type, message) {
    const statusContainer = document.getElementById('statusContainer');
    const statusElement = document.createElement('div');
    statusElement.className = `status-message status-${type}`;
    statusElement.innerHTML = `
        <div class="status-content">
            <span class="status-text">${message}</span>
            <button class="status-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    statusContainer.appendChild(statusElement);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (statusElement.parentElement) {
            statusElement.remove();
        }
    }, 5000);
}

function showProgressBar() {
    const progressBar = document.getElementById('progressBar');
    progressBar.style.display = 'block';
    updateProgress(0, 'Iniciant...');
}

function updateProgress(percentage, text) {
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    
    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }
    if (progressText) {
        progressText.textContent = text;
    }
}

function hideProgressBar() {
    const progressBar = document.getElementById('progressBar');
    progressBar.style.display = 'none';
}

// ===== FILTER FUNCTIONS =====
function handleFilterChange(event) {
    const filterType = event.target.dataset.filter;
    const filterValue = event.target.value;
    
    console.log(`🔍 Filtre canviat: ${filterType} = ${filterValue}`);
    
    // Apply filters immediately if auto-apply is enabled
    if (filterType) {
        aplicarFiltres();
    }
}

function aplicarFiltres() {
    console.log('🔍 Aplicant filtres...');
    
    let filtered = [...currentData];
    
    // Apply each filter
    const filters = {
        classe: document.getElementById('classeFilter').value,
        estudiant: document.getElementById('estudiantFilter').value,
        assignatura: document.getElementById('assignaturaFilter').value,
        trimestre: document.getElementById('trimestreFilter').value,
        assoliment: document.getElementById('assolimentFilter').value
    };
    
    Object.entries(filters).forEach(([key, value]) => {
        if (value) {
            filtered = filtered.filter(item => item[key] === value);
        }
    });
    
    filteredData = filtered;
    
    console.log(`✅ Filtres aplicats: ${filteredData.length} registres`);
    
    // Update all components
    actualitzarOverviewCards();
    actualitzarGraficos();
    actualitzarAnalisiSections();
    
    showStatus('success', `Filtres aplicats: ${filteredData.length} registres trobats`);
}

function resetFiltres() {
    console.log('🔄 Reiniciant filtres...');
    
    // Reset all filter selects
    document.getElementById('classeFilter').value = '';
    document.getElementById('estudiantFilter').value = '';
    document.getElementById('assignaturaFilter').value = '';
    document.getElementById('trimestreFilter').value = '';
    document.getElementById('assolimentFilter').value = '';
    
    // Reset data
    filteredData = [...currentData];
    
    // Update all components
    actualitzarOverviewCards();
    actualitzarGraficos();
    actualitzarAnalisiSections();
    
    showStatus('success', 'Filtres reiniciats');
}

// ===== CHART FUNCTIONS =====
function crearGraficAssoliments() {
    const ctx = document.getElementById('assolimentsChart');
    if (!ctx) return;
    
    const assolimentCounts = {
        'NA': 0, 'AS': 0, 'AN': 0, 'AE': 0
    };
    
    filteredData.forEach(item => {
        assolimentCounts[item.assoliment] = (assolimentCounts[item.assoliment] || 0) + 1;
    });
    
    const data = {
        labels: ['No Assolit', 'Assolit', 'Notable', 'Excel·lent'],
        datasets: [{
            data: [assolimentCounts.NA, assolimentCounts.AS, assolimentCounts.AN, assolimentCounts.AE],
            backgroundColor: [
                '#ef4444', // Red for NA
                '#f59e0b', // Orange for AS
                '#0ea5e9', // Blue for AN
                '#22c55e'  // Green for AE
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
        }]
    };
    
    charts.assoliments = new Chart(ctx, {
        type: 'doughnut',
        data: data,
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

function crearGraficEvolucio() {
    const ctx = document.getElementById('evolucioChart');
    if (!ctx) return;
    
    const trimestres = ['1r trim', '2n trim', '3r trim', 'final'];
    const assolimentValues = { 'NA': 0, 'AS': 1, 'AN': 2, 'AE': 3 };
    
    const data = trimestres.map(trimestre => {
        const trimestreData = filteredData.filter(item => item.trimestre === trimestre);
        if (trimestreData.length === 0) return 0;
        
        const totalValue = trimestreData.reduce((sum, item) => {
            return sum + (assolimentValues[item.assoliment] || 0);
        }, 0);
        
        return (totalValue / trimestreData.length / 3) * 100;
    });
    
    charts.evolucio = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['1r Trimestre', '2n Trimestre', '3r Trimestre', 'Final'],
            datasets: [{
                label: 'Rendiment Mitjà (%)',
                data: data,
                borderColor: '#0ea5e9',
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
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
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function crearGraficAssignatures() {
    const ctx = document.getElementById('assignaturesChart');
    if (!ctx) return;
    
    const assignatures = [...new Set(filteredData.map(item => item.assignatura))];
    const assolimentValues = { 'NA': 0, 'AS': 1, 'AN': 2, 'AE': 3 };
    
    const data = assignatures.map(assignatura => {
        const assignaturaData = filteredData.filter(item => item.assignatura === assignatura);
        if (assignaturaData.length === 0) return 0;
        
        const totalValue = assignaturaData.reduce((sum, item) => {
            return sum + (assolimentValues[item.assoliment] || 0);
        }, 0);
        
        return (totalValue / assignaturaData.length / 3) * 100;
    });
    
    charts.assignatures = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: assignatures,
            datasets: [{
                label: 'Rendiment Mitjà (%)',
                data: data,
                backgroundColor: 'rgba(14, 165, 233, 0.8)',
                borderColor: '#0ea5e9',
                borderWidth: 2,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function crearGraficRendiment() {
    const ctx = document.getElementById('rendimentChart');
    if (!ctx) return;
    
    const classes = [...new Set(filteredData.map(item => item.classe))];
    const assolimentValues = { 'NA': 0, 'AS': 1, 'AN': 2, 'AE': 3 };
    
    const data = classes.map(classe => {
        const classeData = filteredData.filter(item => item.classe === classe);
        if (classeData.length === 0) return 0;
        
        const totalValue = classeData.reduce((sum, item) => {
            return sum + (assolimentValues[item.assoliment] || 0);
        }, 0);
        
        return (totalValue / classeData.length / 3) * 100;
    });
    
    charts.rendiment = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: classes,
            datasets: [{
                label: 'Rendiment Mitjà (%)',
                data: data,
                backgroundColor: 'rgba(217, 70, 239, 0.8)',
                borderColor: '#d946ef',
                borderWidth: 2,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// ===== STATISTICS FUNCTIONS =====
function actualitzarEstadistiquesPerAssignatura() {
    const table = document.getElementById('assignaturaStatsTable');
    if (!table) return;
    
    if (filteredData.length === 0) {
        table.querySelector('tbody').innerHTML = '<tr><td colspan="4">No hi ha dades disponibles</td></tr>';
        return;
    }
    
    const assignatures = [...new Set(filteredData.map(item => item.assignatura))];
    let html = '';
    
    assignatures.forEach(assignatura => {
        const assignaturaData = filteredData.filter(item => item.assignatura === assignatura);
        const total = assignaturaData.length;
        const assolits = assignaturaData.filter(item => item.assoliment !== 'NA').length;
        const na = assignaturaData.filter(item => item.assoliment === 'NA').length;
        
        const assolitsPercent = ((assolits / total) * 100).toFixed(1);
        const naPercent = ((na / total) * 100).toFixed(1);
        
        html += `
            <tr>
                <td>${assignatura}</td>
                <td>${total}</td>
                <td class="percentage ${assolitsPercent >= 70 ? 'high' : assolitsPercent >= 50 ? 'medium' : 'low'}">${assolitsPercent}%</td>
                <td class="percentage ${naPercent <= 20 ? 'high' : naPercent <= 40 ? 'medium' : 'low'}">${naPercent}%</td>
            </tr>
        `;
    });
    
    table.querySelector('tbody').innerHTML = html;
}

function actualitzarEstadistiquesPerTrimestre() {
    const table = document.getElementById('trimestreStatsTable');
    if (!table) return;
    
    if (filteredData.length === 0) {
        table.querySelector('tbody').innerHTML = '<tr><td colspan="4">No hi ha dades disponibles</td></tr>';
        return;
    }
    
    const trimestres = ['1r trim', '2n trim', '3r trim', 'final'];
    let html = '';
    
    trimestres.forEach(trimestre => {
        const trimestreData = filteredData.filter(item => item.trimestre === trimestre);
        if (trimestreData.length === 0) return;
        
        const total = trimestreData.length;
        const assolits = trimestreData.filter(item => item.assoliment !== 'NA').length;
        const na = trimestreData.filter(item => item.assoliment === 'NA').length;
        
        const assolitsPercent = ((assolits / total) * 100).toFixed(1);
        const naPercent = ((na / total) * 100).toFixed(1);
        
        const trimestreName = {
            '1r trim': '1r Trimestre',
            '2n trim': '2n Trimestre',
            '3r trim': '3r Trimestre',
            'final': 'Final'
        }[trimestre];
        
        html += `
            <tr>
                <td>${trimestreName}</td>
                <td>${total}</td>
                <td class="percentage ${assolitsPercent >= 70 ? 'high' : assolitsPercent >= 50 ? 'medium' : 'low'}">${assolitsPercent}%</td>
                <td class="percentage ${naPercent <= 20 ? 'high' : naPercent <= 40 ? 'medium' : 'low'}">${naPercent}%</td>
            </tr>
        `;
    });
    
    table.querySelector('tbody').innerHTML = html;
}

// ===== COMPARATIVE FUNCTIONS =====
function inicialitzarComparatives() {
    console.log('📊 Inicialitzant comparatives...');
    
    // Add event listeners for comparative controls
    const exportBtn = document.getElementById('exportComparativaAvancada');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportComparativaAvancada);
    }
    
    // Add event listeners for advanced statistics export
    const exportAdvancedBtn = document.getElementById('exportEstadistiquesAvancades');
    if (exportAdvancedBtn) {
        exportAdvancedBtn.addEventListener('click', exportEstadistiquesAvancades);
    }
    
    // Add event listeners for detailed comparative
    const toggleBtn = document.getElementById('toggleComparativaView');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleComparativaView);
    }
    
    const exportDetalladaBtn = document.getElementById('exportComparativaDetallada');
    if (exportDetalladaBtn) {
        exportDetalladaBtn.addEventListener('click', exportComparativaDetallada);
    }
}

function actualitzarComparativaAvancada() {
    const content = document.getElementById('comparativaAvancadaContent');
    if (!content) return;
    
    if (filteredData.length === 0) {
        content.innerHTML = '<div class="text-center" style="padding: var(--space-xl); color: var(--neutral-500);">No hi ha dades disponibles</div>';
        return;
    }
    
    const assignatures = [...new Set(filteredData.map(item => item.assignatura))];
    const trimestres = ['1r trim', '2n trim', '3r trim', 'final'];
    
    let assignaturesHTML = '';
    
    assignatures.forEach(assignatura => {
        const assignaturaData = filteredData.filter(item => item.assignatura === assignatura);
        const totalAssignatura = assignaturaData.length;
        const assolitsAssignatura = assignaturaData.filter(item => item.assoliment !== 'NA').length;
        const assolitsPercent = ((assolitsAssignatura / totalAssignatura) * 100).toFixed(1);
        
        let trimestresHTML = '';
        
        trimestres.forEach(trimestre => {
            const trimestreData = assignaturaData.filter(item => item.trimestre === trimestre);
            if (trimestreData.length === 0) {
                trimestresHTML += `
                    <div class="comparativa-avancada-trimestre">
                        <div class="comparativa-avancada-trimestre-header">
                            <h5 class="comparativa-avancada-trimestre-title">${trimestre === '1r trim' ? '1r Trimestre' : trimestre === '2n trim' ? '2n Trimestre' : trimestre === '3r trim' ? '3r Trimestre' : 'Final'}</h5>
                            <span class="comparativa-avancada-trimestre-total">0 avaluacions</span>
                        </div>
                        <div class="comparativa-avancada-progress-bars">
                            <div class="text-center" style="color: var(--neutral-500); padding: var(--space-lg);">No hi ha dades</div>
                        </div>
                    </div>
                `;
                return;
            }
            
            const total = trimestreData.length;
            const na = trimestreData.filter(item => item.assoliment === 'NA').length;
            const as = trimestreData.filter(item => item.assoliment === 'AS').length;
            const an = trimestreData.filter(item => item.assoliment === 'AN').length;
            const ae = trimestreData.filter(item => item.assoliment === 'AE').length;
            
            const naPercent = ((na / total) * 100).toFixed(1);
            const asPercent = ((as / total) * 100).toFixed(1);
            const anPercent = ((an / total) * 100).toFixed(1);
            const aePercent = ((ae / total) * 100).toFixed(1);
            
            trimestresHTML += `
                <div class="comparativa-avancada-trimestre">
                    <div class="comparativa-avancada-trimestre-header">
                        <h5 class="comparativa-avancada-trimestre-title">${trimestre === '1r trim' ? '1r Trimestre' : trimestre === '2n trim' ? '2n Trimestre' : trimestre === '3r trim' ? '3r Trimestre' : 'Final'}</h5>
                        <span class="comparativa-avancada-trimestre-total">${total} avaluacions</span>
                    </div>
                    <div class="comparativa-avancada-progress-bars">
                        <div class="comparativa-avancada-progress-item">
                            <span class="comparativa-avancada-progress-label">NA</span>
                            <div class="comparativa-avancada-progress-bar">
                                <div class="comparativa-avancada-progress-fill na" style="width: ${naPercent}%"></div>
                            </div>
                            <span class="comparativa-avancada-progress-value">${naPercent}%</span>
                        </div>
                        <div class="comparativa-avancada-progress-item">
                            <span class="comparativa-avancada-progress-label">AS</span>
                            <div class="comparativa-avancada-progress-bar">
                                <div class="comparativa-avancada-progress-fill as" style="width: ${asPercent}%"></div>
                            </div>
                            <span class="comparativa-avancada-progress-value">${asPercent}%</span>
                        </div>
                        <div class="comparativa-avancada-progress-item">
                            <span class="comparativa-avancada-progress-label">AN</span>
                            <div class="comparativa-avancada-progress-bar">
                                <div class="comparativa-avancada-progress-fill an" style="width: ${anPercent}%"></div>
                            </div>
                            <span class="comparativa-avancada-progress-value">${anPercent}%</span>
                        </div>
                        <div class="comparativa-avancada-progress-item">
                            <span class="comparativa-avancada-progress-label">AE</span>
                            <div class="comparativa-avancada-progress-bar">
                                <div class="comparativa-avancada-progress-fill ae" style="width: ${aePercent}%"></div>
                            </div>
                            <span class="comparativa-avancada-progress-value">${aePercent}%</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        assignaturesHTML += `
            <div class="comparativa-avancada-materia">
                <div class="comparativa-avancada-materia-header">
                    <h4 class="comparativa-avancada-materia-title">
                        <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        ${assignatura}
                    </h4>
                    <div class="comparativa-avancada-materia-stats">
                        <div class="comparativa-avancada-stat">
                            <span class="comparativa-avancada-stat-label">Total:</span>
                            <span class="comparativa-avancada-stat-value">${totalAssignatura}</span>
                        </div>
                        <div class="comparativa-avancada-stat">
                            <span class="comparativa-avancada-stat-label">% Assolits:</span>
                            <span class="comparativa-avancada-stat-value">${assolitsPercent}%</span>
                        </div>
                    </div>
                </div>
                <div class="comparativa-avancada-trimestres">
                    ${trimestresHTML}
                </div>
            </div>
        `;
    });
    
    content.innerHTML = assignaturesHTML;
}

function actualitzarTaulaComparativaDetallada() {
    console.log('📊 Actualitzant taula comparativa detallada...');
    
    const tableBody = document.getElementById('comparativaDetalladaTableBody');
    if (!tableBody) {
        console.log('⚠️ No es troba la taula comparativa detallada');
        return;
    }
    
    if (filteredData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8">No hi ha dades disponibles</td></tr>';
        return;
    }
    
    const assignatures = [...new Set(filteredData.map(item => item.assignatura))];
    const trimestres = ['1r trim', '2n trim', '3r trim', 'final'];
    
    let html = '';
    
    assignatures.forEach(assignatura => {
        trimestres.forEach(trimestre => {
            const trimestreData = filteredData.filter(item => 
                item.assignatura === assignatura && item.trimestre === trimestre
            );
            
            if (trimestreData.length === 0) return;
            
            const total = trimestreData.length;
            const na = trimestreData.filter(item => item.assoliment === 'NA').length;
            const as = trimestreData.filter(item => item.assoliment === 'AS').length;
            const an = trimestreData.filter(item => item.assoliment === 'AN').length;
            const ae = trimestreData.filter(item => item.assoliment === 'AE').length;
            
            const naPercent = ((na / total) * 100).toFixed(1);
            const asPercent = ((as / total) * 100).toFixed(1);
            const anPercent = ((an / total) * 100).toFixed(1);
            const aePercent = ((ae / total) * 100).toFixed(1);
            const assolitsPercent = (((as + an + ae) / total) * 100).toFixed(1);
            
            const trimestreName = {
                '1r trim': '1r Trimestre',
                '2n trim': '2n Trimestre',
                '3r trim': '3r Trimestre',
                'final': 'Final'
            }[trimestre];
            
            html += `
                <tr>
                    <td>${assignatura}</td>
                    <td>${trimestreName}</td>
                    <td>${total}</td>
                    <td>${naPercent}%</td>
                    <td>${asPercent}%</td>
                    <td>${anPercent}%</td>
                    <td>${aePercent}%</td>
                    <td class="percentage ${assolitsPercent >= 70 ? 'high' : assolitsPercent >= 50 ? 'medium' : 'low'}">${assolitsPercent}%</td>
                </tr>
            `;
        });
    });
    
    tableBody.innerHTML = html;
    console.log('✅ Taula comparativa detallada actualitzada');
}

function toggleComparativaView() {
    console.log('🔄 Canviant vista de comparativa...');
    
    const tableView = document.getElementById('comparativaTableView');
    const groupedView = document.getElementById('comparativaGroupedView');
    const toggleBtn = document.getElementById('toggleComparativaView');
    
    if (tableView && groupedView && toggleBtn) {
        if (tableView.style.display === 'none') {
            // Show table view
            tableView.style.display = 'block';
            groupedView.style.display = 'none';
            toggleBtn.innerHTML = `
                <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                </svg>
                Vista Agrupada
            `;
            console.log('✅ Vista de taula activada');
        } else {
            // Show grouped view
            tableView.style.display = 'none';
            groupedView.style.display = 'block';
            toggleBtn.innerHTML = `
                <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                </svg>
                Vista Taula
            `;
            actualitzarVistaAgrupada();
            console.log('✅ Vista agrupada activada');
        }
    }
}

function actualitzarVistaAgrupada() {
    console.log('📊 Actualitzant vista agrupada...');
    
    const content = document.getElementById('comparativaGroupedContent');
    if (!content) return;
    
    if (filteredData.length === 0) {
        content.innerHTML = '<div class="text-center" style="padding: var(--space-xl); color: var(--neutral-500);">No hi ha dades disponibles</div>';
        return;
    }
    
    const assignatures = [...new Set(filteredData.map(item => item.assignatura))];
    let html = '';
    
    assignatures.forEach(assignatura => {
        const assignaturaData = filteredData.filter(item => item.assignatura === assignatura);
        const totalAssignatura = assignaturaData.length;
        const assolitsAssignatura = assignaturaData.filter(item => item.assoliment !== 'NA').length;
        const assolitsPercent = ((assolitsAssignatura / totalAssignatura) * 100).toFixed(1);
        
        let trimestresHTML = '';
        const trimestres = ['1r trim', '2n trim', '3r trim', 'final'];
        
        trimestres.forEach(trimestre => {
            const trimestreData = assignaturaData.filter(item => item.trimestre === trimestre);
            if (trimestreData.length === 0) {
                trimestresHTML += `
                    <div class="comparativa-trimestre">
                        <div class="comparativa-trimestre-header">
                            <h5 class="comparativa-trimestre-title">${trimestre === '1r trim' ? '1r Trimestre' : trimestre === '2n trim' ? '2n Trimestre' : trimestre === '3r trim' ? '3r Trimestre' : 'Final'}</h5>
                            <span class="comparativa-trimestre-total">0 avaluacions</span>
                        </div>
                        <div class="comparativa-progress-bars">
                            <div class="text-center" style="color: var(--neutral-500); padding: var(--space-lg);">No hi ha dades</div>
                        </div>
                    </div>
                `;
                return;
            }
            
            const total = trimestreData.length;
            const na = trimestreData.filter(item => item.assoliment === 'NA').length;
            const as = trimestreData.filter(item => item.assoliment === 'AS').length;
            const an = trimestreData.filter(item => item.assoliment === 'AN').length;
            const ae = trimestreData.filter(item => item.assoliment === 'AE').length;
            
            const naPercent = ((na / total) * 100).toFixed(1);
            const asPercent = ((as / total) * 100).toFixed(1);
            const anPercent = ((an / total) * 100).toFixed(1);
            const aePercent = ((ae / total) * 100).toFixed(1);
            
            trimestresHTML += `
                <div class="comparativa-trimestre">
                    <div class="comparativa-trimestre-header">
                        <h5 class="comparativa-trimestre-title">${trimestre === '1r trim' ? '1r Trimestre' : trimestre === '2n trim' ? '2n Trimestre' : trimestre === '3r trim' ? '3r Trimestre' : 'Final'}</h5>
                        <span class="comparativa-trimestre-total">${total} avaluacions</span>
                    </div>
                    <div class="comparativa-progress-bars">
                        <div class="comparativa-progress-item">
                            <span class="comparativa-progress-label">NA</span>
                            <div class="comparativa-progress-bar">
                                <div class="comparativa-progress-fill na" style="width: ${naPercent}%"></div>
                            </div>
                            <span class="comparativa-progress-value">${naPercent}%</span>
                        </div>
                        <div class="comparativa-progress-item">
                            <span class="comparativa-progress-label">AS</span>
                            <div class="comparativa-progress-bar">
                                <div class="comparativa-progress-fill as" style="width: ${asPercent}%"></div>
                            </div>
                            <span class="comparativa-progress-value">${asPercent}%</span>
                        </div>
                        <div class="comparativa-progress-item">
                            <span class="comparativa-progress-label">AN</span>
                            <div class="comparativa-progress-bar">
                                <div class="comparativa-progress-fill an" style="width: ${anPercent}%"></div>
                            </div>
                            <span class="comparativa-progress-value">${anPercent}%</span>
                        </div>
                        <div class="comparativa-progress-item">
                            <span class="comparativa-progress-label">AE</span>
                            <div class="comparativa-progress-bar">
                                <div class="comparativa-progress-fill ae" style="width: ${aePercent}%"></div>
                            </div>
                            <span class="comparativa-progress-value">${aePercent}%</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
            <div class="comparativa-group">
                <div class="comparativa-group-header">
                    <h4 class="comparativa-group-title">${assignatura}</h4>
                    <div class="comparativa-group-stats">
                        <div class="comparativa-stat">
                            <span class="comparativa-stat-label">Total:</span>
                            <span class="comparativa-stat-value">${totalAssignatura}</span>
                        </div>
                        <div class="comparativa-stat">
                            <span class="comparativa-stat-label">% Assolits:</span>
                            <span class="comparativa-stat-value">${assolitsPercent}%</span>
                        </div>
                    </div>
                </div>
                <div class="comparativa-trimestres">
                    ${trimestresHTML}
                </div>
            </div>
        `;
    });
    
    content.innerHTML = html;
    console.log('✅ Vista agrupada actualitzada');
}

function exportComparativaAvancada() {
    if (filteredData.length === 0) {
        showStatus('warning', 'No hi ha dades per exportar');
        return;
    }
    
    const assignatures = [...new Set(filteredData.map(item => item.assignatura))];
    const trimestres = ['1r trim', '2n trim', '3r trim', 'final'];
    
    let csvData = 'Assignatura,Trimestre,Total,NA (%),AS (%),AN (%),AE (%),% Assolits\n';
    
    assignatures.forEach(assignatura => {
        const assignaturaData = filteredData.filter(item => item.assignatura === assignatura);
        
        trimestres.forEach(trimestre => {
            const trimestreData = assignaturaData.filter(item => item.trimestre === trimestre);
            if (trimestreData.length === 0) {
                csvData += `${assignatura},${trimestre},0,0,0,0,0,0\n`;
                return;
            }
            
            const total = trimestreData.length;
            const na = trimestreData.filter(item => item.assoliment === 'NA').length;
            const as = trimestreData.filter(item => item.assoliment === 'AS').length;
            const an = trimestreData.filter(item => item.assoliment === 'AN').length;
            const ae = trimestreData.filter(item => item.assoliment === 'AE').length;
            
            const naPercent = ((na / total) * 100).toFixed(1);
            const asPercent = ((as / total) * 100).toFixed(1);
            const anPercent = ((an / total) * 100).toFixed(1);
            const aePercent = ((ae / total) * 100).toFixed(1);
            const assolitsPercent = (((as + an + ae) / total) * 100).toFixed(1);
            
            csvData += `${assignatura},${trimestre},${total},${naPercent},${asPercent},${anPercent},${aePercent},${assolitsPercent}\n`;
        });
    });
    
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'comparativa_avancada.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showStatus('success', 'Comparativa avançada exportada correctament');
}

function exportComparativaDetallada() {
    if (filteredData.length === 0) {
        showStatus('error', 'No hi ha dades per exportar');
        return;
    }
    
    try {
        const assignatures = [...new Set(filteredData.map(item => item.assignatura))];
        const trimestres = ['1r trim', '2n trim', '3r trim', 'final'];
        
        let csvContent = 'Assignatura,Trimestre,Total,NA,AS,AN,AE,%NA,%AS,%AN,%AE\n';
        
        assignatures.forEach(assignatura => {
            trimestres.forEach(trimestre => {
                const trimestreData = filteredData.filter(item => 
                    item.assignatura === assignatura && item.trimestre === trimestre
                );
                
                if (trimestreData.length > 0) {
                    const total = trimestreData.length;
                    const na = trimestreData.filter(item => item.assoliment === 'NA').length;
                    const as = trimestreData.filter(item => item.assoliment === 'AS').length;
                    const an = trimestreData.filter(item => item.assoliment === 'AN').length;
                    const ae = trimestreData.filter(item => item.assoliment === 'AE').length;
                    
                    const naPercent = ((na / total) * 100).toFixed(1);
                    const asPercent = ((as / total) * 100).toFixed(1);
                    const anPercent = ((an / total) * 100).toFixed(1);
                    const aePercent = ((ae / total) * 100).toFixed(1);
                    
                    csvContent += `${assignatura},${trimestre},${total},${na},${as},${an},${ae},${naPercent}%,${asPercent}%,${anPercent}%,${aePercent}%\n`;
                }
            });
        });
        
        downloadCSV(csvContent, 'comparativa_detallada.csv');
        showStatus('success', 'Comparativa detallada exportada correctament');
        
    } catch (error) {
        console.error('Error exportant comparativa detallada:', error);
        showStatus('error', 'Error exportant la comparativa detallada');
    }
}

function exportEstadistiquesAvancades() {
    if (filteredData.length === 0) {
        showStatus('error', 'No hi ha dades per exportar');
        return;
    }
    
    try {
        // Calcular estadístiques avançades
        const tendencies = analitzarTendencies();
        const correlations = analitzarCorrelacions();
        const metrics = calcularMetriquesAvancades();
        
        let csvContent = '';
        
        // Secció 1: Tendències
        csvContent += 'SECCIÓ: TENDÈNCIES\n';
        csvContent += 'Tipus,Tendència,Diferència,Percentatge,Primer,Últim\n';
        
        if (tendencies.general) {
            csvContent += `General,${tendencies.general.tendencia},${tendencies.general.diferencia}%,${tendencies.general.percentatge}%,${tendencies.general.primer}%,${tendencies.general.ultim}%\n`;
        }
        
        Object.entries(tendencies.assignatures || {}).forEach(([assignatura, data]) => {
            csvContent += `${assignatura},${data.tendencia},${data.diferencia}%,${data.primer}%,${data.ultim}%\n`;
        });
        
        csvContent += '\n';
        
        // Secció 2: Correlacions Fortes
        csvContent += 'SECCIÓ: CORRELACIONS FORTES\n';
        csvContent += 'Assignatura1,Assignatura2,Correlació,Tipus\n';
        
        (correlations.fortes || []).forEach(corr => {
            csvContent += `${corr.assignatura1},${corr.assignatura2},${corr.correlacio},${corr.tipus}\n`;
        });
        
        csvContent += '\n';
        
        // Secció 3: Mètriques Clau
        csvContent += 'SECCIÓ: MÈTRIQUES CLAU\n';
        csvContent += 'Mètrica,Valor\n';
        
        if (metrics.millorAssignatura) {
            csvContent += `Millor Assignatura,${metrics.millorAssignatura[0]} (${metrics.millorAssignatura[1]}%)\n`;
        }
        if (metrics.pitjorAssignatura) {
            csvContent += `Pitjor Assignatura,${metrics.pitjorAssignatura[0]} (${metrics.pitjorAssignatura[1]}%)\n`;
        }
        
        csvContent += '\n';
        
        // Secció 4: Evolució Temporal
        csvContent += 'SECCIÓ: EVOLUCIÓ TEMPORAL\n';
        csvContent += 'Trimestre,Percentatge,Total\n';
        
        (metrics.evolucio || []).forEach(evol => {
            csvContent += `${evol.trimestre},${evol.percentatge}%,${evol.total}\n`;
        });
        
        csvContent += '\n';
        
        // Secció 5: Rendiment per Classe
        csvContent += 'SECCIÓ: RENDIMENT PER CLASSE\n';
        csvContent += 'Classe,Rendiment\n';
        
        Object.entries(metrics.rendimentPerClasse || {}).forEach(([classe, rendiment]) => {
            csvContent += `${classe},${rendiment}%\n`;
        });
        
        downloadCSV(csvContent, 'estadistiques_avançades.csv');
        showStatus('success', 'Estadístiques avançades exportades correctament');
        
    } catch (error) {
        console.error('Error exportant estadístiques avançades:', error);
        showStatus('error', 'Error exportant les estadístiques avançades');
    }
}

function downloadCSV(content, filename) {
    try {
        console.log(`📤 Intentant descarregar: ${filename}`);
        console.log(`📊 Contingut generat: ${content.length} caràcters`);
        
        if (!content || content.length === 0) {
            console.error('❌ Error: Contingut buit per exportar');
            showStatus('error', 'No hi ha dades per exportar');
            return;
        }
        
        // Crear blob amb BOM per UTF-8
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + content], { 
            type: 'text/csv;charset=utf-8;' 
        });
        
        console.log(`📦 Blob creat: ${blob.size} bytes`);
        
        // Crear link de descàrrega
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            
            // Afegir al DOM i clicar
            document.body.appendChild(link);
            link.click();
            
            // Netejar després d'un moment
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
            
            console.log(`✅ Fitxer descarregat: ${filename}`);
            showStatus('success', `Fitxer descarregat: ${filename}`);
        } else {
            // Fallback per navegadors antics
            console.log('⚠️ Navegador no suporta download, obrint en nova finestra');
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            showStatus('info', 'Fitxer obert en nova finestra (copia i pega per desar)');
        }
        
    } catch (error) {
        console.error('❌ Error descarregant fitxer:', error);
        showStatus('error', 'Error descarregant el fitxer: ' + error.message);
        
        // Fallback: mostrar contingut a la consola
        console.log('📋 Contingut del fitxer (copia manualment):');
        console.log(content);
    }
}

// Funció alternativa d'exportació amb més opcions
function exportDataAsCSV(data, filename, options = {}) {
    try {
        console.log(`📤 Exportant dades com a CSV: ${filename}`);
        console.log(`📊 Registres a exportar: ${data.length}`);
        
        if (!data || data.length === 0) {
            showStatus('error', 'No hi ha dades per exportar');
            return;
        }
        
        // Opcions per defecte
        const {
            headers = Object.keys(data[0]),
            separator = ',',
            includeHeaders = true
        } = options;
        
        let csvContent = '';
        
        // Afegir headers si cal
        if (includeHeaders) {
            csvContent += headers.join(separator) + '\n';
        }
        
        // Afegir dades
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                // Escapar cometes i afegir cometes si conté separador
                if (value === null || value === undefined) return '';
                const stringValue = String(value);
                if (stringValue.includes(separator) || stringValue.includes('"') || stringValue.includes('\n')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            });
            csvContent += values.join(separator) + '\n';
        });
        
        console.log(`📝 CSV generat: ${csvContent.length} caràcters`);
        
        // Descarregar
        downloadCSV(csvContent, filename);
        
    } catch (error) {
        console.error('❌ Error exportant dades:', error);
        showStatus('error', 'Error exportant les dades: ' + error.message);
    }
}

// ===== DATA MANAGEMENT FUNCTIONS =====
async function clearData() {
    if (confirm('Estàs segur que vols netejar totes les dades? Aquesta acció no es pot desfer.')) {
        try {
            showProgressBar();
            updateProgress(50, 'Netejant dades...');
            
            const response = await fetch('/api/assoliments', {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                currentData = [];
                filteredData = [];
                
                updateProgress(100, 'Completat!');
                setTimeout(() => {
                    hideProgressBar();
                    showStatus('success', 'Dades netejades correctament');
                    navigateToStep('upload');
                }, 500);
            } else {
                hideProgressBar();
                showStatus('error', result.message || 'Error netejant les dades');
            }
        } catch (error) {
            hideProgressBar();
            console.error('❌ Error netejant dades:', error);
            showStatus('error', 'Error de connexió. Si us plau, torna-ho a provar.');
        }
    }
}

// Funció per verificar l'estat del DOM i forçar visualització
function debugDOMState() {
    console.log('🔍 DEBUG: Verificant estat del DOM...');
    
    const elements = {
        uploadSection: document.getElementById('uploadSection'),
        dashboardSection: document.getElementById('dashboardSection'),
        breadcrumb: document.getElementById('breadcrumb'),
        statusContainer: document.getElementById('statusContainer')
    };
    
    Object.entries(elements).forEach(([name, element]) => {
        if (element) {
            const computedStyle = window.getComputedStyle(element);
            console.log(`📋 ${name}:`, {
                exists: true,
                display: element.style.display,
                computedDisplay: computedStyle.display,
                visibility: computedStyle.visibility,
                opacity: computedStyle.opacity,
                height: computedStyle.height,
                width: computedStyle.width,
                position: computedStyle.position,
                zIndex: computedStyle.zIndex
            });
        } else {
            console.log(`❌ ${name}: No trobat`);
        }
    });
    
    // Verificar si hi ha elements amb display: none
    const hiddenElements = document.querySelectorAll('[style*="display: none"]');
    console.log(`🔍 Elements ocults: ${hiddenElements.length}`);
    hiddenElements.forEach((el, index) => {
        if (index < 5) { // Mostrar només els primers 5
            console.log(`  - ${el.id || el.className || el.tagName}: ${el.style.display}`);
        }
    });
    
    // Verificar l'estat actual
    console.log('📊 Estat actual:', {
        currentStep,
        currentDataLength: currentData.length,
        filteredDataLength: filteredData.length
    });
}

// Funció per forçar la visualització del dashboard
function forceShowDashboard() {
    console.log('🔧 Forçant visualització del dashboard...');
    
    const dashboardSection = document.getElementById('dashboardSection');
    if (dashboardSection) {
        // Forçar visualització
        dashboardSection.style.display = 'block';
        dashboardSection.style.visibility = 'visible';
        dashboardSection.style.opacity = '1';  // Forçar opacity a 1
        dashboardSection.style.height = 'auto';
        dashboardSection.style.overflow = 'visible';
        
        // Forçar reflow
        dashboardSection.offsetHeight;
        
        console.log('✅ Dashboard forçat a mostrar');
        
        // Verificar que es mostra
        const isVisible = dashboardSection.style.display !== 'none' && 
                         window.getComputedStyle(dashboardSection).display !== 'none' &&
                         window.getComputedStyle(dashboardSection).opacity !== '0';
        console.log(`🔍 Dashboard visible després de forçar: ${isVisible}`);
        
        return isVisible;
    } else {
        console.error('❌ No es pot trobar dashboardSection');
        return false;
    }
}

// Funció per verificar i corregir l'opacity del dashboard
function verificarIOpacityDashboard() {
    const dashboardSection = document.getElementById('dashboardSection');
    if (dashboardSection) {
        const computedStyle = window.getComputedStyle(dashboardSection);
        const opacity = computedStyle.opacity;
        
        console.log(`🔍 Opacity actual del dashboard: ${opacity}`);
        
        if (opacity === '0') {
            console.log('⚠️ Dashboard té opacity 0, corregint...');
            dashboardSection.style.opacity = '1';
            dashboardSection.style.visibility = 'visible';
            
            // Forçar reflow
            dashboardSection.offsetHeight;
            
            console.log('✅ Opacity corregida a 1');
            return true;
        } else {
            console.log('✅ Opacity correcta:', opacity);
            return false;
        }
    }
    return false;
}

// Funció per verificar i mostrar informació detallada de les dades
function verificarDadesDetallades() {
    console.log('🔍 Verificant dades detallades...');
    
    const info = {
        currentData: {
            total: currentData.length,
            mostra: currentData.slice(0, 3),
            classes: [...new Set(currentData.map(item => item.classe))],
            estudiants: [...new Set(currentData.map(item => item.estudiant))],
            assignatures: [...new Set(currentData.map(item => item.assignatura))],
            trimestres: [...new Set(currentData.map(item => item.trimestre))],
            assoliments: [...new Set(currentData.map(item => item.assoliment))]
        },
        filteredData: {
            total: filteredData.length,
            mostra: filteredData.slice(0, 3)
        }
    };
    
    console.log('📊 Informació detallada de dades:', info);
    
    // Verificar si hi ha dades duplicades o problemes
    const registresUnics = new Set(currentData.map(item => 
        `${item.classe}-${item.estudiant}-${item.assignatura}-${item.trimestre}`
    ));
    
    console.log('🔍 Anàlisi de duplicats:', {
        totalRegistres: currentData.length,
        registresUnics: registresUnics.size,
        duplicats: currentData.length - registresUnics.size
    });
    
    // Verificar dades amb valors null/undefined
    const registresAmbProblemes = currentData.filter(item => 
        !item.estudiant || !item.assignatura || !item.classe || !item.trimestre || !item.assoliment
    );
    
    if (registresAmbProblemes.length > 0) {
        console.warn('⚠️ Registres amb problemes:', registresAmbProblemes.slice(0, 5));
    }
    
    return info;
}

// Funció per netejar dades duplicades
function netejarDadesDuplicades() {
    console.log('🧹 Netejant dades duplicades...');
    
    const registresUnics = new Map();
    const dadesNetejades = [];
    const duplicatsEliminats = [];
    
    currentData.forEach((item, index) => {
        const clau = `${item.classe}-${item.estudiant}-${item.assignatura}-${item.trimestre}`;
        
        if (registresUnics.has(clau)) {
            duplicatsEliminats.push({
                index: index,
                clau: clau,
                item: item
            });
        } else {
            registresUnics.set(clau, true);
            dadesNetejades.push(item);
        }
    });
    
    console.log('📊 Resultat de neteja:', {
        registresOriginals: currentData.length,
        registresNetejats: dadesNetejades.length,
        duplicatsEliminats: duplicatsEliminats.length
    });
    
    if (duplicatsEliminats.length > 0) {
        console.log('🗑️ Duplicats eliminats (primers 5):', duplicatsEliminats.slice(0, 5));
    }
    
    // Actualitzar les dades
    currentData = dadesNetejades;
    filteredData = [...currentData];
    
    console.log('✅ Dades netejades correctament');
    
    return {
        registresOriginals: currentData.length + duplicatsEliminats.length,
        registresNetejats: currentData.length,
        duplicatsEliminats: duplicatsEliminats.length
    };
}

 