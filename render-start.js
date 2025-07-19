const { initializeDatabase } = require('./init-db.js');
const { initDatabase } = require('./scripts/init-database-postgres.js');

async function updateDatabaseForComparatives() {
    try {
        console.log('🔄 Actualitzant base de dades per comparatives...');
        
        // Importar el script d'actualització
        const { query } = require('./database/db.js');
        
        // Afegir columna codi si no existeix
        try {
            await query(`
                ALTER TABLE assignatures 
                ADD COLUMN IF NOT EXISTS codi VARCHAR(10) UNIQUE
            `);
            console.log('✅ Columna codi afegida o ja existia');
        } catch (error) {
            console.log('ℹ️ Columna codi ja existeix');
        }
        
        // Actualitzar assignatures existents amb codis
        const assignaturesMap = {
            'Català': 'LIN',
            'Anglès': 'ANG',
            'Francès': 'FRA',
            'Matemàtiques': 'MAT',
            'Música': 'MUS',
            'Espai Creatiu': 'EC',
            'Educació Física': 'FIS',
            'Espai Globalitzat': 'EG'
        };
        
        for (const [nom, codi] of Object.entries(assignaturesMap)) {
            try {
                await query(`
                    UPDATE assignatures 
                    SET codi = $1 
                    WHERE nom = $2 AND (codi IS NULL OR codi = '')
                `, [codi, nom]);
                console.log(`✅ Assignatura "${nom}" actualitzada amb codi "${codi}"`);
            } catch (error) {
                console.log(`ℹ️ Assignatura "${nom}" ja té codi o no existeix`);
            }
        }
        
        // Inserir assignatures que falten
        for (const [nom, codi] of Object.entries(assignaturesMap)) {
            try {
                await query(`
                    INSERT INTO assignatures (codi, nom) 
                    VALUES ($1, $2) 
                    ON CONFLICT (codi) DO NOTHING
                `, [codi, nom]);
                console.log(`✅ Assignatura "${nom}" inserida o ja existia`);
            } catch (error) {
                console.log(`ℹ️ Assignatura "${nom}" ja existeix`);
            }
        }
        
        console.log('✅ Base de dades actualitzada per comparatives');
        return true;
        
    } catch (error) {
        console.error('❌ Error actualitzant base de dades per comparatives:', error);
        return false;
    }
}

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
        
        // Actualitzar base de dades per comparatives
        console.log('🔧 Actualitzant base de dades per funcionalitats de comparatives...');
        const updateSuccess = await updateDatabaseForComparatives();
        if (updateSuccess) {
            console.log('✅ Base de dades actualitzada per comparatives');
        } else {
            console.warn('⚠️ Error actualitzant per comparatives, continuant...');
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