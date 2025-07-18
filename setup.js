#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Configurant Dashboard d\'Assoliments...\n');

// Colors per a la consola
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
    log(`\n${step}. ${message}`, 'cyan');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// Verificar si Node.js està instal·lat
logStep(1, 'Verificant Node.js...');
try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    logSuccess(`Node.js ${nodeVersion} detectat`);
} catch (error) {
    logError('Node.js no està instal·lat. Si us plau, instal·la Node.js primer.');
    process.exit(1);
}

// Verificar si npm està instal·lat
logStep(2, 'Verificant npm...');
try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    logSuccess(`npm ${npmVersion} detectat`);
} catch (error) {
    logError('npm no està instal·lat. Si us plau, instal·la npm primer.');
    process.exit(1);
}

// Verificar si PostgreSQL està instal·lat
logStep(3, 'Verificant PostgreSQL...');
try {
    const psqlVersion = execSync('psql --version', { encoding: 'utf8' }).trim();
    logSuccess(`PostgreSQL detectat: ${psqlVersion}`);
} catch (error) {
    logWarning('PostgreSQL no està instal·lat o no està al PATH.');
    logInfo('Si us plau, assegura\'t que PostgreSQL està instal·lat i configurat.');
}

// Instal·lar dependències
logStep(4, 'Instal·lant dependències...');
try {
    execSync('npm install', { stdio: 'inherit' });
    logSuccess('Dependències instal·lades correctament');
} catch (error) {
    logError('Error instal·lant dependències');
    process.exit(1);
}

// Crear directori uploads si no existeix
logStep(5, 'Creant directoris necessaris...');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    logSuccess('Directori uploads creat');
} else {
    logSuccess('Directori uploads ja existeix');
}

// Verificar fitxer de configuració
logStep(6, 'Verificant configuració...');
const configFile = path.join(__dirname, 'config.env');
if (!fs.existsSync(configFile)) {
    logWarning('El fitxer config.env no existeix.');
    logInfo('Creant fitxer de configuració per defecte...');
    
    const defaultConfig = `# Configuració de la base de dades PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=assoliments_db
DB_USER=postgres
DB_PASSWORD=password

# Configuració del servidor
PORT=3000
NODE_ENV=development

# Configuració de seguretat
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
BCRYPT_ROUNDS=12

# Configuració de rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
`;
    
    fs.writeFileSync(configFile, defaultConfig);
    logSuccess('Fitxer config.env creat amb configuració per defecte');
    logWarning('Recorda actualitzar la contrasenya de PostgreSQL al fitxer config.env');
} else {
    logSuccess('Fitxer config.env ja existeix');
}

// Mostrar instruccions següents
logStep(7, 'Configuració completada!');
log('\n📋 Pròxims passos:', 'bright');
log('1. Configura la base de dades PostgreSQL:', 'yellow');
log('   - Crea una base de dades: CREATE DATABASE assoliments_db;', 'blue');
log('   - Actualitza les credencials al fitxer config.env', 'blue');
log('\n2. Inicialitza la base de dades:', 'yellow');
log('   npm run init-db', 'blue');
log('\n3. (Opcional) Importa dades de mostra:', 'yellow');
log('   npm run import-data', 'blue');
log('\n4. Executa l\'aplicació:', 'yellow');
log('   npm run dev', 'blue');
log('\n5. Obre el navegador a: http://localhost:3000', 'yellow');

log('\n🎉 Configuració completada amb èxit!', 'green');
log('Si tens problemes, consulta el README.md per a més informació.', 'cyan'); 