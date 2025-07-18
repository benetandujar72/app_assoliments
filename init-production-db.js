const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración para producción
const config = {
    host: 'dpg-d1t0j4er433s73eraf60-a.frankfurt-postgres.render.com',
    port: 5432,
    database: 'assoliments_db',
    user: 'assoliments_db_user',
    password: 'AfS2hZUG6ovRKpqLlq3W7UNXJJPg0Rrh',
    ssl: {
        rejectUnauthorized: false
    }
};

async function initProductionDatabase() {
    const pool = new Pool(config);
    
    try {
        console.log('🔌 Conectant a la base de dades de producció...');
        
        // Probar conexión
        const client = await pool.connect();
        console.log('✅ Connexió exitosa a la base de dades');
        
        // Leer el script SQL
        const sqlScript = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
        console.log('📄 Script SQL carregat');
        
        // Ejecutar el script
        console.log('🚀 Executant script d\'inicialització...');
        await client.query(sqlScript);
        console.log('✅ Taules creades correctament');
        
        // Verificar que las tablas existen
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('estudiants', 'assignatures', 'assoliments')
        `);
        
        console.log('📋 Taules existents:');
        tables.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });
        
        client.release();
        console.log('✅ Base de dades inicialitzada correctament');
        
    } catch (error) {
        console.error('❌ Error inicialitzant la base de dades:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    initProductionDatabase()
        .then(() => {
            console.log('🎉 Inicialització completada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error:', error);
            process.exit(1);
        });
}

module.exports = { initProductionDatabase }; 