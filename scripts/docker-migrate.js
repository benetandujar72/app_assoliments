const { query } = require('../database/db.js');

async function dockerMigrate() {
    try {
        console.log('🐳 Executant migració per Docker...');
        
        // Esperar un moment per assegurar que la BD està disponible
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verificar connexió
        try {
            await query('SELECT 1');
            console.log('✅ Connexió a la base de dades establerta');
        } catch (error) {
            console.log('⚠️ No es pot connectar a la BD, esperant...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            await query('SELECT 1');
            console.log('✅ Connexió a la base de dades establerta després d\'esperar');
        }
        
        // Afegir columna codi si no existeix
        try {
            await query(`
                ALTER TABLE assignatures 
                ADD COLUMN IF NOT EXISTS codi VARCHAR(10) UNIQUE
            `);
            console.log('✅ Columna codi afegida o ja existia');
        } catch (error) {
            console.log('ℹ️ Columna codi ja existeix o error:', error.message);
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
        
        // Verificar que tot està correcte
        const result = await query('SELECT codi, nom FROM assignatures ORDER BY nom');
        console.log('\n📊 Assignatures a la base de dades:');
        result.rows.forEach(row => {
            console.log(`   - ${row.codi}: ${row.nom}`);
        });
        
        console.log('\n✅ Migració completada correctament');
        return true;
        
    } catch (error) {
        console.error('❌ Error en la migració:', error);
        return false;
    }
}

// Executar si es crida directament
if (require.main === module) {
    dockerMigrate()
        .then(success => {
            if (success) {
                console.log('🎉 Migració exitosa');
                process.exit(0);
            } else {
                console.log('💥 Migració fallida');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 Error inesperat:', error);
            process.exit(1);
        });
}

module.exports = dockerMigrate; 