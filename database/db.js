const { Pool } = require('pg');
require('dotenv').config({ path: '../config.env' });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'assoliments_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    max: 20, // màxim de connexions al pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Event listeners per debugging
pool.on('connect', () => {
    console.log('🔌 Connexió a PostgreSQL establerta');
});

pool.on('error', (err) => {
    console.error('❌ Error inesperat del client PostgreSQL:', err);
    process.exit(-1);
});

// Funció per executar queries
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log(`📊 Query executada en ${duration}ms:`, text.substring(0, 50) + '...');
        return res;
    } catch (error) {
        console.error('❌ Error executant query:', error);
        throw error;
    }
};

// Funció per obtenir un client del pool
const getClient = async () => {
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
};

module.exports = {
    query,
    getClient,
    pool
}; 