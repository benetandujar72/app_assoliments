const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

async function testConnection() {
    console.log('🧪 Provant connexió a la base de dades de producció...');
    console.log(`📍 Host: ${process.env.DB_HOST}`);
    console.log(`🗄️ Base de dades: ${process.env.DB_NAME}`);
    console.log(`👤 Usuari: ${process.env.DB_USER}`);
    console.log(`🔧 Mode: ${process.env.NODE_ENV}`);
    console.log('');

    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.NODE_ENV === 'production' ? {
            rejectUnauthorized: false
        } : false
    });

    try {
        // Provar connexió
        const client = await pool.connect();
        console.log('✅ Connexió establerta correctament');

        // Provar query simple
        const result = await client.query('SELECT NOW() as current_time, version() as version');
        console.log('✅ Query de prova executada correctament');
        console.log(`⏰ Hora actual: ${result.rows[0].current_time}`);
        console.log(`📊 Versió PostgreSQL: ${result.rows[0].version.split(' ')[0]}`);

        // Verificar taules
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        console.log('📋 Taules disponibles:');
        tablesResult.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

        // Verificar dades
        const countResult = await client.query('SELECT COUNT(*) as total FROM estudiants');
        console.log(`👥 Total d'estudiants: ${countResult.rows[0].total}`);

        const assolimentsResult = await client.query('SELECT COUNT(*) as total FROM assoliments');
        console.log(`📊 Total d'assoliments: ${assolimentsResult.rows[0].total}`);

        client.release();
        console.log('\n✅ Totes les proves han passat correctament');
        
    } catch (error) {
        console.error('❌ Error de connexió:', error.message);
        console.error('Detalls:', error);
    } finally {
        await pool.end();
    }
}

testConnection(); 