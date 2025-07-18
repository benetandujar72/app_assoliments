const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'assoliments_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '25@2705BEangu',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

const initDatabase = async () => {
    try {
        console.log('🗄️ Inicialitzant base de dades PostgreSQL...');

        // Crear taula d'estudiants
        await pool.query(`
            CREATE TABLE IF NOT EXISTS estudiants (
                id SERIAL PRIMARY KEY,
                nom VARCHAR(255) NOT NULL,
                classe VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Taula estudiants creada');

        // Crear taula d'assignatures
        await pool.query(`
            CREATE TABLE IF NOT EXISTS assignatures (
                id SERIAL PRIMARY KEY,
                codi VARCHAR(10) UNIQUE NOT NULL,
                nom VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Taula assignatures creada');

        // Crear taula d'assoliments
        await pool.query(`
            CREATE TABLE IF NOT EXISTS assoliments (
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

        // Crear índexs per millorar rendiment
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_assoliments_estudiant ON assoliments(estudiant_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_assoliments_assignatura ON assoliments(assignatura_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_assoliments_trimestre ON assoliments(trimestre)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_estudiants_classe ON estudiants(classe)`);

        console.log('✅ Índexs creats');

        // Inserir assignatures per defecte
        const assignatures = [
            { codi: 'LIN', nom: 'Llengua' },
            { codi: 'ANG', nom: 'Anglès' },
            { codi: 'FRA', nom: 'Francès' },
            { codi: 'MAT', nom: 'Matemàtiques' },
            { codi: 'MUS', nom: 'Música' },
            { codi: 'EC', nom: 'Espai Creatiu' },
            { codi: 'FIS', nom: 'Educació Física' },
            { codi: 'EG', nom: 'Espai Globalitzat' }
        ];

        for (const assignatura of assignatures) {
            await pool.query(`
                INSERT INTO assignatures (codi, nom) 
                VALUES ($1, $2) 
                ON CONFLICT (codi) DO NOTHING
            `, [assignatura.codi, assignatura.nom]);
        }
        console.log('✅ Assignatures inserides');

        console.log('🎉 Base de dades PostgreSQL inicialitzada correctament!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error inicialitzant la base de dades:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
};

// Executar si es crida directament
if (require.main === module) {
    initDatabase();
}

module.exports = initDatabase; 