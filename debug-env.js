console.log('🔍 Diagnòstic de variables d\'entorn...');
console.log('');

// Variables d'entorn del sistema
console.log('📋 Variables d\'entorn del sistema:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'NO CONFIGURAT'}`);
console.log(`PORT: ${process.env.PORT || 'NO CONFIGURAT'}`);
console.log('');

// Variables de base de dades
console.log('🗄️ Variables de base de dades:');
console.log(`DB_HOST: ${process.env.DB_HOST || 'NO CONFIGURAT'}`);
console.log(`DB_PORT: ${process.env.DB_PORT || 'NO CONFIGURAT'}`);
console.log(`DB_NAME: ${process.env.DB_NAME || 'NO CONFIGURAT'}`);
console.log(`DB_USER: ${process.env.DB_USER || 'NO CONFIGURAT'}`);
console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD ? 'CONFIGURAT' : 'NO CONFIGURAT'}`);
console.log('');

// Variables de seguretat
console.log('🔒 Variables de seguretat:');
console.log(`RATE_LIMIT_WINDOW_MS: ${process.env.RATE_LIMIT_WINDOW_MS || 'NO CONFIGURAT'}`);
console.log(`RATE_LIMIT_MAX_REQUESTS: ${process.env.RATE_LIMIT_MAX_REQUESTS || 'NO CONFIGURAT'}`);
console.log(`UPLOAD_MAX_SIZE: ${process.env.UPLOAD_MAX_SIZE || 'NO CONFIGURAT'}`);
console.log('');

// Verificar configuració
const requiredVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.log('❌ Variables d\'entorn faltants:', missingVars);
    console.log('💥 La configuració no està completa');
} else {
    console.log('✅ Totes les variables d\'entorn necessàries estan configurades');
}

// Provar connexió si les variables estan configurades
if (missingVars.length === 0) {
    console.log('');
    console.log('🔧 Provant connexió a la base de dades...');
    
    const { Pool } = require('pg');
    
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: {
            rejectUnauthorized: false
        },
        connectionTimeoutMillis: 5000
    });
    
    pool.connect()
        .then(client => {
            console.log('✅ Connexió exitosa a la base de dades');
            return client.query('SELECT NOW() as current_time');
        })
        .then(result => {
            console.log(`⏰ Hora del servidor: ${result.rows[0].current_time}`);
            console.log('🎉 Diagnòstic completat amb èxit');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error de connexió:', error.message);
            console.error('💥 Diagnòstic fallit');
            process.exit(1);
        })
        .finally(() => {
            pool.end();
        });
} else {
    console.log('💥 No es pot provar la connexió sense les variables d\'entorn');
    process.exit(1);
} 