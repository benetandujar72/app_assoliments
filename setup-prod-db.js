const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

async function setupProductionDatabase() {
    console.log('🚀 Configurant base de dades de producció...');
    console.log(`📍 Host: ${process.env.DB_HOST}`);
    console.log(`🗄️ Base de dades: ${process.env.DB_NAME}`);
    console.log(`👤 Usuari: ${process.env.DB_USER}`);
    console.log(`🔧 Mode: ${process.env.NODE_ENV}`);

    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: {
            rejectUnauthorized: false
        },
        connectionTimeoutMillis: 10000
    });

    try {
        // Provar connexió
        console.log('🔧 Provant connexió...');
        const client = await pool.connect();
        console.log('✅ Connexió establerta');

        // Verificar si les taules existeixen
        console.log('🔧 Verificant estructura de la base de dades...');
        
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('estudiants', 'assignatures', 'assoliments')
            ORDER BY table_name
        `);

        const existingTables = tablesResult.rows.map(row => row.table_name);
        console.log('📋 Taules existents:', existingTables);

        if (existingTables.length === 3) {
            console.log('✅ Totes les taules ja existeixen');
            
            // Verificar dades
            const countResult = await client.query('SELECT COUNT(*) as total FROM estudiants');
            console.log(`👥 Total d'estudiants: ${countResult.rows[0].total}`);
            
            const assolimentsResult = await client.query('SELECT COUNT(*) as total FROM assoliments');
            console.log(`📊 Total d'assoliments: ${assolimentsResult.rows[0].total}`);
            
        } else {
            console.log('🔧 Creant taules que falten...');
            
            // Crear taules si no existeixen
            if (!existingTables.includes('estudiants')) {
                await client.query(`
                    CREATE TABLE estudiants (
                        id SERIAL PRIMARY KEY,
                        nom VARCHAR(255) NOT NULL,
                        classe VARCHAR(50) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                console.log('✅ Taula estudiants creada');
            }

            if (!existingTables.includes('assignatures')) {
                await client.query(`
                    CREATE TABLE assignatures (
                        id SERIAL PRIMARY KEY,
                        codi VARCHAR(10) UNIQUE NOT NULL,
                        nom VARCHAR(255) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                console.log('✅ Taula assignatures creada');
            }

            if (!existingTables.includes('assoliments')) {
                await client.query(`
                    CREATE TABLE assoliments (
                        id SERIAL PRIMARY KEY,
                        estudiant_id INTEGER REFERENCES estudiants(id) ON DELETE CASCADE,
                        assignatura_id INTEGER REFERENCES assignatures(id) ON DELETE CASCADE,
                        trimestre VARCHAR(10) NOT NULL,
                        assoliment VARCHAR(2) NOT NULL CHECK (assoliment IN ('NA', 'AS', 'AN', 'AE')),
                        valor_numeric INTEGER NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(estudiant_id, assignatura_id, trimestre)
                    )
                `);
                console.log('✅ Taula assoliments creada');
            }

            // Crear índexs
            await client.query(`CREATE INDEX IF NOT EXISTS idx_assoliments_estudiant ON assoliments(estudiant_id)`);
            await client.query(`CREATE INDEX IF NOT EXISTS idx_assoliments_assignatura ON assoliments(assignatura_id)`);
            await client.query(`CREATE INDEX IF NOT EXISTS idx_assoliments_trimestre ON assoliments(trimestre)`);
            await client.query(`CREATE INDEX IF NOT EXISTS idx_estudiants_classe ON estudiants(classe)`);
            console.log('✅ Índexs creats');

            // Inserir assignatures per defecte
            const assignatures = [
                { codi: 'LIN', nom: 'Català' },
                { codi: 'ANG', nom: 'Anglès' },
                { codi: 'FRA', nom: 'Francès' },
                { codi: 'MAT', nom: 'Matemàtiques' },
                { codi: 'MUS', nom: 'Música' },
                { codi: 'EC', nom: 'Espai Creatiu' },
                { codi: 'FIS', nom: 'Educació Física' },
                { codi: 'EG', nom: 'Espai Globalitzat' }
            ];

            for (const assignatura of assignatures) {
                await client.query(`
                    INSERT INTO assignatures (codi, nom) 
                    VALUES ($1, $2) 
                    ON CONFLICT (codi) DO NOTHING
                `, [assignatura.codi, assignatura.nom]);
            }
            console.log('✅ Assignatures inserides');
        }

        client.release();
        console.log('🎉 Base de dades de producció configurada correctament!');
        return true;

    } catch (error) {
        console.error('❌ Error configurant la base de dades:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Executar si es crida directament
if (require.main === module) {
    setupProductionDatabase()
        .then(() => {
            console.log('✅ Configuració completada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error en configuració:', error);
            process.exit(1);
        });
}

module.exports = { setupProductionDatabase }; 