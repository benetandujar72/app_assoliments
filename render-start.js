const { initializeDatabase } = require('./init-db.js');
const { initDatabase } = require('./scripts/init-database-postgres.js');

async function startServer() {
    console.log('🚀 Iniciant servidor per a Render...');
    
    // Verificar variables d'entorn crítiques
    const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.error('❌ Variables d\'entorn faltants:', missingVars);
        console.error('💥 Sortint del procés...');
        process.exit(1);
    }
    
    console.log(`🔧 Mode: ${process.env.NODE_ENV || 'production'}`);
    console.log(`📍 Host BD: ${process.env.DB_HOST}`);
    console.log(`🗄️ Base de dades: ${process.env.DB_NAME}`);
    console.log(`👤 Usuari: ${process.env.DB_USER}`);
    console.log(`🔑 Contrasenya: ${process.env.DB_PASSWORD ? 'CONFIGURAT' : 'NO CONFIGURAT'}`);
    
    try {
        // Verificar connexió a la base de dades
        console.log('🔧 Verificant connexió a la base de dades...');
        const dbReady = await initializeDatabase();
        
        if (!dbReady) {
            console.error('❌ No s\'ha pogut establir connexió amb la base de dades');
            console.error('💥 Sortint del procés...');
            process.exit(1);
        }
        
        console.log('✅ Base de dades verificada');
        
        // Inicialitzar estructura de la base de dades si és necessari
        console.log('🔧 Verificant estructura de la base de dades...');
        try {
            await initDatabase();
            console.log('✅ Estructura de la base de dades verificada/creada');
        } catch (error) {
            console.warn('⚠️ Error inicialitzant estructura de BD (pot ser que ja existeixi):', error.message);
        }
        
        console.log('✅ Base de dades preparada, iniciant servidor...');
        
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