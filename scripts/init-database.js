const { query } = require('../database/db.js');

const initDatabase = async () => {
    try {
        console.log('🗄️ Inicialitzant base de dades...');

        // Crear taula d'estudiants
        await query(`
            CREATE TABLE IF NOT EXISTS estudiants (
                id SERIAL PRIMARY KEY,
                nom VARCHAR(255) NOT NULL,
                classe VARCHAR(10) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Taula estudiants creada');

        // Crear taula d'assignatures
        await query(`
            CREATE TABLE IF NOT EXISTS assignatures (
                id SERIAL PRIMARY KEY,
                codi VARCHAR(10) UNIQUE NOT NULL,
                nom VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Taula assignatures creada');

        // Crear taula d'assoliments
        await query(`
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
        await query(`
            CREATE INDEX IF NOT EXISTS idx_assoliments_estudiant 
            ON assoliments(estudiant_id)
        `);
        
        await query(`
            CREATE INDEX IF NOT EXISTS idx_assoliments_assignatura 
            ON assoliments(assignatura_id)
        `);
        
        await query(`
            CREATE INDEX IF NOT EXISTS idx_assoliments_trimestre 
            ON assoliments(trimestre)
        `);
        
        await query(`
            CREATE INDEX IF NOT EXISTS idx_estudiants_classe 
            ON estudiants(classe)
        `);

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
            await query(`
                INSERT INTO assignatures (codi, nom) 
                VALUES ($1, $2) 
                ON CONFLICT (codi) DO NOTHING
            `, [assignatura.codi, assignatura.nom]);
        }
        console.log('✅ Assignatures inserides');

        // Crear funció per actualitzar updated_at
        await query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);

        // Crear triggers
        await query(`
            DROP TRIGGER IF EXISTS update_estudiants_updated_at ON estudiants;
            CREATE TRIGGER update_estudiants_updated_at 
                BEFORE UPDATE ON estudiants 
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `);

        await query(`
            DROP TRIGGER IF EXISTS update_assoliments_updated_at ON assoliments;
            CREATE TRIGGER update_assoliments_updated_at 
                BEFORE UPDATE ON assoliments 
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `);

        console.log('✅ Triggers creats');

        console.log('🎉 Base de dades inicialitzada correctament!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error inicialitzant la base de dades:', error);
        process.exit(1);
    }
};

// Executar si es crida directament
if (require.main === module) {
    initDatabase();
}

module.exports = initDatabase; 