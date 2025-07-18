const { testConnection } = require('./database/db.js');

async function initializeDatabase() {
    console.log('🔧 Inicialitzant connexió a la base de dades...');
    console.log(`📍 Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`🗄️ Base de dades: ${process.env.DB_NAME || 'assoliments_db'}`);
    console.log(`👤 Usuari: ${process.env.DB_USER || 'postgres'}`);
    console.log(`🔧 Mode: ${process.env.NODE_ENV || 'development'}`);
    
    // Esperar un moment per a que la base de dades estigui disponible
    const maxRetries = 5;
    const retryDelay = 2000; // 2 segons
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`🔄 Intento ${attempt}/${maxRetries} de connexió...`);
        
        try {
            const isConnected = await testConnection();
            if (isConnected) {
                console.log('✅ Connexió a la base de dades establerta correctament');
                return true;
            }
        } catch (error) {
            console.error(`❌ Error en intent ${attempt}:`, error.message);
        }
        
        if (attempt < maxRetries) {
            console.log(`⏳ Esperant ${retryDelay/1000} segons abans del següent intent...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }
    
    console.error('❌ No s\'ha pogut establir connexió amb la base de dades després de', maxRetries, 'intents');
    return false;
}

// Si s'executa directament aquest script
if (require.main === module) {
    initializeDatabase()
        .then(success => {
            if (success) {
                console.log('🚀 Base de dades preparada per a l\'aplicació');
                process.exit(0);
            } else {
                console.error('💥 Error inicialitzant la base de dades');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 Error inesperat:', error);
            process.exit(1);
        });
}

module.exports = { initializeDatabase }; 