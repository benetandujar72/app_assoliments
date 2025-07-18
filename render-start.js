const { initializeDatabase } = require('./init-db.js');

async function startServer() {
    console.log('🚀 Iniciant servidor per a Render...');
    console.log(`🔧 Mode: ${process.env.NODE_ENV}`);
    console.log(`📍 Host BD: ${process.env.DB_HOST}`);
    console.log(`🗄️ Base de dades: ${process.env.DB_NAME}`);
    
    try {
        // Verificar connexió a la base de dades
        console.log('🔧 Verificant connexió a la base de dades...');
        const dbReady = await initializeDatabase();
        
        if (!dbReady) {
            console.error('❌ No s\'ha pogut establir connexió amb la base de dades');
            console.error('💥 Sortint del procés...');
            process.exit(1);
        }
        
        console.log('✅ Base de dades verificada, iniciant servidor...');
        
        // Importar i iniciar el servidor
        const app = require('./server.js');
        
        console.log('✅ Servidor iniciat correctament');
        
    } catch (error) {
        console.error('💥 Error iniciant el servidor:', error);
        process.exit(1);
    }
}

// Manejar senyals de tancament
process.on('SIGTERM', () => {
    console.log('📴 Rebut senyal SIGTERM, tancant servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('📴 Rebut senyal SIGINT, tancant servidor...');
    process.exit(0);
});

// Manejar errors no capturats
process.on('uncaughtException', (error) => {
    console.error('💥 Error no capturat:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Promesa rebutjada no manejada:', reason);
    process.exit(1);
});

// Iniciar el servidor
startServer(); 