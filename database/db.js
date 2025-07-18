const { Pool } = require('pg');
require('dotenv').config({ path: '../config.env' });

// Configuració de connexió amb millor gestió d'errors
const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'assoliments_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    max: 20, // màxim de connexions al pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Augmentar timeout per producció
    // Configuració SSL per producció
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
};

console.log('🔧 Configuració de base de dades:');
console.log(`📍 Host: ${poolConfig.host}`);
console.log(`🗄️ Base de dades: ${poolConfig.database}`);
console.log(`👤 Usuari: ${poolConfig.user}`);
console.log(`🔧 Mode: ${process.env.NODE_ENV}`);
console.log(`🔒 SSL: ${poolConfig.ssl ? 'Habilitat' : 'Deshabilitat'}`);

const pool = new Pool(poolConfig);

// Event listeners per debugging
pool.on('connect', () => {
    console.log('🔌 Connexió a PostgreSQL establerta');
});

pool.on('error', (err) => {
    console.error('❌ Error inesperat del client PostgreSQL:', err);
    // No sortir del procés en producció, només loggejar l'error
    if (process.env.NODE_ENV === 'development') {
        process.exit(-1);
    }
});

// Funció per executar queries amb millor gestió d'errors
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log(`📊 Query executada en ${duration}ms:`, text.substring(0, 50) + '...');
        return res;
    } catch (error) {
        const duration = Date.now() - start;
        console.error(`❌ Error executant query (${duration}ms):`, error.message);
        console.error(`📍 Query: ${text.substring(0, 100)}...`);
        console.error(`🔧 Mode: ${process.env.NODE_ENV}`);
        console.error(`📍 Host: ${process.env.DB_HOST}`);
        throw error;
    }
};

// Funció per obtenir un client del pool
const getClient = async () => {
    try {
        const client = await pool.connect();
        const query = client.query.bind(client);
        const release = client.release.bind(client);
        
        // Interceptar queries per logging
        client.query = (...args) => {
            console.log('📊 Query:', args[0].substring(0, 50) + '...');
            return query.apply(client, args);
        };
        
        client.release = () => {
            console.log('🔌 Client alliberat del pool');
            return release();
        };
        
        return client;
    } catch (error) {
        console.error('❌ Error obtenint client del pool:', error.message);
        throw error;
    }
};

// Funció per verificar connexió
const testConnection = async () => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as current_time');
        client.release();
        console.log('✅ Connexió de prova exitosa:', result.rows[0].current_time);
        return true;
    } catch (error) {
        console.error('❌ Error en prova de connexió:', error.message);
        return false;
    }
};

module.exports = {
    query,
    getClient,
    pool,
    testConnection
}; 