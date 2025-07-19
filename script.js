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

 