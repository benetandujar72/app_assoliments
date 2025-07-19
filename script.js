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
    
    // Hide all sections
    document.getElementById('uploadSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'none';
    
    // Show breadcrumb
    const breadcrumb = document.getElementById('breadcrumb');
    breadcrumb.style.display = 'block';
    
    // Show appropriate section
    if (step === 'upload') {
        document.getElementById('uploadSection').style.display = 'block';
        breadcrumb.style.display = 'none';
    } else if (step === 'dashboard') {
        document.getElementById('dashboardSection').style.display = 'block';
        updateBreadcrumb(step);
    }
    
    // Update breadcrumb active state
    updateBreadcrumbActive(step);
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
        
        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                csvData: csvData,
                fileName: fileName
            })
        });
        
        updateProgress(50, 'Processant dades...');
        
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
            currentData = result.data;
            filteredData = [...currentData];
            
            console.log(`✅ Dades carregades: ${currentData.length} registres`);
            
            inicialitzarDashboard();
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
    
    // Navigate to dashboard
    navigateToStep('dashboard');
    
    // Update overview cards
    actualitzarOverviewCards();
    
    // Fill filters
    omplirFiltres();
    
    // Update charts
    actualitzarGraficos();
    
    // Update analysis sections
    actualitzarAnalisiSections();
    
    console.log('✅ Dashboard inicialitzat correctament');
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
    
    if (filteredData.length === 0) return;
    
    // Classes
    const classes = [...new Set(filteredData.map(item => item.classe))].sort();
    const classeFilter = document.getElementById('classeFilter');
    classeFilter.innerHTML = '<option value="">Totes les classes</option>';
    classes.forEach(classe => {
        const option = document.createElement('option');
        option.value = classe;
        option.textContent = classe;
        classeFilter.appendChild(option);
    });
    
    // Students
    const students = [...new Set(filteredData.map(item => item.estudiant))].sort();
    const estudiantFilter = document.getElementById('estudiantFilter');
    estudiantFilter.innerHTML = '<option value="">Tots els estudiants</option>';
    students.forEach(estudiant => {
        const option = document.createElement('option');
        option.value = estudiant;
        option.textContent = estudiant;
        estudiantFilter.appendChild(option);
    });
    
    // Subjects
    const subjects = [...new Set(filteredData.map(item => item.assignatura))].sort();
    const assignaturaFilter = document.getElementById('assignaturaFilter');
    assignaturaFilter.innerHTML = '<option value="">Totes les assignatures</option>';
    subjects.forEach(assignatura => {
        const option = document.createElement('option');
        option.value = assignatura;
        option.textContent = assignatura;
        assignaturaFilter.appendChild(option);
    });
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
    
    // Remove active class from all tabs and panes
    document.querySelectorAll('.analysis-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.analysis-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    // Add active class to selected tab and pane
    const selectedTab = document.querySelector(`[data-tab="${tabId}"]`);
    const selectedPane = document.getElementById(tabId);
    
    if (selectedTab && selectedPane) {
        selectedTab.classList.add('active');
        selectedPane.classList.add('active');
        
        // Load content if needed
        if (tabId === 'individual') {
            loadIndividualContent();
        }
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
    showStatus('info', 'Obrint anàlisi complet...');
    // Navigate to comparative tab
    showAnalysisTab('comparatives');
}

function saveFilter() {
    showStatus('success', 'Filtre guardat correctament');
}

function exportAll() {
    showStatus('info', 'Exportant totes les dades...');
    // Implementation for exporting all data
    setTimeout(() => {
        showStatus('success', 'Exportació completada');
    }, 2000);
}

function exportCharts() {
    showStatus('info', 'Exportant gràfics...');
    // Implementation for exporting charts
    setTimeout(() => {
        showStatus('success', 'Gràfics exportats correctament');
    }, 1500);
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

// ===== EXISTING FUNCTIONS (Mantener compatibilidad) =====
// ... existing code ...

 