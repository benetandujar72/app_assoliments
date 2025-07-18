const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
    // Solo ejecutar si estamos en producción
    if (process.env.NODE_ENV !== 'production') {
        console.log('🔄 Entorn de desenvolupament, saltant inicialització de BD');
        return;
    }

    const config = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    };

    const pool = new Pool(config);
    
    try {
        console.log('🔌 Verificant connexió a la base de dades...');
        
        // Probar conexión
        const client = await pool.connect();
        console.log('✅ Connexió exitosa a la base de dades');
        
        // Verificar si las tablas existen
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('estudiants', 'assignatures', 'assoliments')
        `);
        
        if (tables.rows.length === 3) {
            console.log('✅ Totes les taules ja existeixen');
            client.release();
            return;
        }
        
        console.log('📄 Inicialitzant taules de la base de dades...');
        
        // Leer y ejecutar el script SQL
        const sqlScript = fs.readFileSync(path.join(__dirname, '..', 'init.sql'), 'utf8');
        await client.query(sqlScript);
        console.log('✅ Taules creades correctament');
        
        client.release();
        console.log('🎉 Base de dades inicialitzada correctament');
        
    } catch (error) {
        console.error('❌ Error inicialitzant la base de dades:', error.message);
        // No lanzar error para no bloquear el arranque de la app
        console.log('⚠️  Continuant sense inicialització de BD...');
    } finally {
        await pool.end();
    }
}

module.exports = { initDatabase }; 