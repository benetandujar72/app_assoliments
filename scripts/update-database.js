const { query } = require('../database/db.js');

async function updateDatabase() {
    try {
        console.log('🔄 Actualitzant base de dades...');
        
        // Afegir columna codi si no existeix
        try {
            await query(`
                ALTER TABLE assignatures 
                ADD COLUMN IF NOT EXISTS codi VARCHAR(10) UNIQUE
            `);
            console.log('✅ Columna codi afegida o ja existia');
        } catch (error) {
            console.log('ℹ️ Columna codi ja existeix');
        }
        
        // Actualitzar assignatures existents amb codis
        const assignaturesMap = {
            'Català': 'LIN',
            'Anglès': 'ANG',
            'Francès': 'FRA',
            'Matemàtiques': 'MAT',
            'Música': 'MUS',
            'Espai Creatiu': 'EC',
            'Educació Física': 'FIS',
            'Espai Globalitzat': 'EG'
        };
        
        for (const [nom, codi] of Object.entries(assignaturesMap)) {
            try {
                await query(`
                    UPDATE assignatures 
                    SET codi = $1 
                    WHERE nom = $2 AND (codi IS NULL OR codi = '')
                `, [codi, nom]);
                console.log(`✅ Assignatura "${nom}" actualitzada amb codi "${codi}"`);
            } catch (error) {
                console.log(`ℹ️ Assignatura "${nom}" ja té codi o no existeix`);
            }
        }
        
        // Inserir assignatures que falten
        for (const [nom, codi] of Object.entries(assignaturesMap)) {
            try {
                await query(`
                    INSERT INTO assignatures (codi, nom) 
                    VALUES ($1, $2) 
                    ON CONFLICT (codi) DO NOTHING
                `, [codi, nom]);
                console.log(`✅ Assignatura "${nom}" inserida o ja existia`);
            } catch (error) {
                console.log(`ℹ️ Assignatura "${nom}" ja existeix`);
            }
        }
        
        console.log('✅ Base de dades actualitzada correctament');
        
        // Mostrar estat final
        const result = await query('SELECT codi, nom FROM assignatures ORDER BY nom');
        console.log('\n📊 Assignatures a la base de dades:');
        result.rows.forEach(row => {
            console.log(`   - ${row.codi}: ${row.nom}`);
        });
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error actualitzant la base de dades:', error);
        process.exit(1);
    }
}

updateDatabase(); 