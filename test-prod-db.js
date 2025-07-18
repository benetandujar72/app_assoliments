const { Pool } = require('pg');

async function testConnection() {
    console.log('🧪 Provant connexió a la base de dades de producció...');
    console.log(`📍 Host: ${process.env.DB_HOST || 'NO CONFIGURAT'}`);
    console.log(`🗄️ Base de dades: ${process.env.DB_NAME || 'NO CONFIGURAT'}`);
    console.log(`👤 Usuari: ${process.env.DB_USER || 'NO CONFIGURAT'}`);
    console.log(`🔧 Mode: ${process.env.NODE_ENV || 'NO CONFIGURAT'}`);
    console.log('');

    // Verificar que les variables d'entorn estan configurades
    if (!process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD) {
        console.error('❌ Variables d\'entorn de la base de dades no configurades');
        console.error('📍 DB_HOST:', process.env.DB_HOST);
        console.error('🗄️ DB_NAME:', process.env.DB_NAME);
        console.error('👤 DB_USER:', process.env.DB_USER);
        console.error('🔑 DB_PASSWORD:', process.env.DB_PASSWORD ? 'CONFIGURAT' : 'NO CONFIGURAT');
        return;
    }

    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.NODE_ENV === 'production' ? {
            rejectUnauthorized: false
        } : false,
        connectionTimeoutMillis: 10000
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
        if (tablesResult.rows.length === 0) {
            console.log('   - Cap taula trobada');
        } else {
            tablesResult.rows.forEach(row => {
                console.log(`   - ${row.table_name}`);
            });
        }

        // Verificar dades si les taules existeixen
        try {
            const countResult = await client.query('SELECT COUNT(*) as total FROM estudiants');
            console.log(`👥 Total d'estudiants: ${countResult.rows[0].total}`);
        } catch (error) {
            console.log('👥 Taula estudiants no existeix encara');
        }

        try {
            const assolimentsResult = await client.query('SELECT COUNT(*) as total FROM assoliments');
            console.log(`📊 Total d'assoliments: ${assolimentsResult.rows[0].total}`);
        } catch (error) {
            console.log('📊 Taula assoliments no existeix encara');
        }

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