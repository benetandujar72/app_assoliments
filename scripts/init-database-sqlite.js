const { query, run } = require('../database/db-sqlite.js');

const initDatabase = async () => {
    try {
        console.log('🗄️ Inicialitzant base de dades SQLite...');

        // Crear taula d'estudiants
        await run(`
            CREATE TABLE IF NOT EXISTS estudiants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nom TEXT NOT NULL,
                classe TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Taula estudiants creada');

        // Crear taula d'assignatures
        await run(`
            CREATE TABLE IF NOT EXISTS assignatures (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                codi TEXT UNIQUE NOT NULL,
                nom TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Taula assignatures creada');

        // Crear taula d'assoliments
        await run(`
            CREATE TABLE IF NOT EXISTS assoliments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                estudiant_id INTEGER,
                assignatura_id INTEGER,
                trimestre TEXT NOT NULL,
                assoliment TEXT NOT NULL CHECK (assoliment IN ('NA', 'AS', 'AN', 'AE')),
                valor_numeric INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (estudiant_id) REFERENCES estudiants(id) ON DELETE CASCADE,
                FOREIGN KEY (assignatura_id) REFERENCES assignatures(id) ON DELETE CASCADE,
                UNIQUE(estudiant_id, assignatura_id, trimestre)
            )
        `);
        console.log('✅ Taula assoliments creada');

        // Crear índexs per millorar rendiment
        await run(`CREATE INDEX IF NOT EXISTS idx_assoliments_estudiant ON assoliments(estudiant_id)`);
        await run(`CREATE INDEX IF NOT EXISTS idx_assoliments_assignatura ON assoliments(assignatura_id)`);
        await run(`CREATE INDEX IF NOT EXISTS idx_assoliments_trimestre ON assoliments(trimestre)`);
        await run(`CREATE INDEX IF NOT EXISTS idx_estudiants_classe ON estudiants(classe)`);

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
            await run(`
                INSERT OR IGNORE INTO assignatures (codi, nom) 
                VALUES (?, ?)
            `, [assignatura.codi, assignatura.nom]);
        }
        console.log('✅ Assignatures inserides');

        console.log('🎉 Base de dades SQLite inicialitzada correctament!');
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