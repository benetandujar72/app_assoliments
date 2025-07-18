const fs = require('fs');
const path = require('path');

// Función para verificar la versión del código
function checkCodeVersion() {
    console.log('🔍 Verificant versió del codi...');
    
    // Verificar archivos clave
    const filesToCheck = [
        'routes/assoliments.js',
        'routes/upload.js',
        'server.js',
        'package.json'
    ];
    
    filesToCheck.forEach(file => {
        try {
            const content = fs.readFileSync(file, 'utf8');
            const hasCodi = content.includes('codi');
            const hasNom = content.includes('nom');
            
            console.log(`📄 ${file}:`);
            console.log(`   - Conté 'codi': ${hasCodi ? '❌' : '✅'}`);
            console.log(`   - Conté 'nom': ${hasNom ? '✅' : '❌'}`);
            
            if (hasCodi) {
                console.log(`   ⚠️  Aquest fitxer encara conté referències a 'codi'`);
            }
        } catch (error) {
            console.log(`❌ Error llegint ${file}: ${error.message}`);
        }
    });
    
    // Verificar timestamp de los archivos
    console.log('\n🕒 Timestamps dels fitxers:');
    filesToCheck.forEach(file => {
        try {
            const stats = fs.statSync(file);
            console.log(`📄 ${file}: ${stats.mtime.toISOString()}`);
        } catch (error) {
            console.log(`❌ Error obtenint timestamp de ${file}`);
        }
    });
}

// Ejecutar si se llama directamente
if (require.main === module) {
    checkCodeVersion();
}

module.exports = { checkCodeVersion }; 