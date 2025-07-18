const { Pool } = require('pg');

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

async function checkDatabaseData() {
    const pool = new Pool(config);
    
    try {
        console.log('🔌 Conectant a la base de dades de producció...');
        
        const client = await pool.connect();
        console.log('✅ Connexió exitosa a la base de dades');
        
        // Verificar estudiantes
        console.log('\n📊 Verificant estudiants...');
        const estudiantes = await client.query('SELECT COUNT(*) as total FROM estudiants');
        console.log(`   Total estudiants: ${estudiantes.rows[0].total}`);
        
        if (parseInt(estudiantes.rows[0].total) > 0) {
            const muestraEstudiantes = await client.query('SELECT id, nom, classe FROM estudiants LIMIT 5');
            console.log('   Mostra d\'estudiants:');
            muestraEstudiantes.rows.forEach(est => {
                console.log(`     - ${est.id}: ${est.nom} (${est.classe})`);
            });
        }
        
        // Verificar asignaturas
        console.log('\n📚 Verificant assignatures...');
        const asignaturas = await client.query('SELECT COUNT(*) as total FROM assignatures');
        console.log(`   Total assignatures: ${asignaturas.rows[0].total}`);
        
        if (parseInt(asignaturas.rows[0].total) > 0) {
            const todasAsignaturas = await client.query('SELECT id, nom FROM assignatures ORDER BY nom');
            console.log('   Assignatures disponibles:');
            todasAsignaturas.rows.forEach(ass => {
                console.log(`     - ${ass.id}: ${ass.nom}`);
            });
        }
        
        // Verificar assoliments
        console.log('\n📈 Verificant assoliments...');
        const assoliments = await client.query('SELECT COUNT(*) as total FROM assoliments');
        console.log(`   Total assoliments: ${assoliments.rows[0].total}`);
        
        if (parseInt(assoliments.rows[0].total) > 0) {
            const muestraAssoliments = await client.query(`
                SELECT a.id, a.trimestre, a.assoliment, e.nom as estudiant, ass.nom as assignatura
                FROM assoliments a
                JOIN estudiants e ON a.estudiant_id = e.id
                JOIN assignatures ass ON a.assignatura_id = ass.id
                LIMIT 10
            `);
            console.log('   Mostra d\'assoliments:');
            muestraAssoliments.rows.forEach(ass => {
                console.log(`     - ${ass.estudiant} - ${ass.assignatura} - ${ass.trimestre}: ${ass.assoliment}`);
            });
        }
        
        // Verificar relaciones
        console.log('\n🔗 Verificant relacions...');
        const relaciones = await client.query(`
            SELECT 
                COUNT(DISTINCT a.estudiant_id) as estudiants_amb_assoliments,
                COUNT(DISTINCT a.assignatura_id) as assignatures_amb_assoliments
            FROM assoliments a
        `);
        console.log(`   Estudiants amb assoliments: ${relaciones.rows[0].estudiants_amb_assoliments}`);
        console.log(`   Assignatures amb assoliments: ${relaciones.rows[0].assignatures_amb_assoliments}`);
        
        // Verificar posibles problemas
        console.log('\n🔍 Verificant possibles problemes...');
        
        // Estudiantes sin assoliments
        const estudiantesSinAssoliments = await client.query(`
            SELECT COUNT(*) as total
            FROM estudiants e
            LEFT JOIN assoliments a ON e.id = a.estudiant_id
            WHERE a.id IS NULL
        `);
        console.log(`   Estudiants sense assoliments: ${estudiantesSinAssoliments.rows[0].total}`);
        
        // Assoliments huérfanos
        const assolimentsHuerfanos = await client.query(`
            SELECT COUNT(*) as total
            FROM assoliments a
            LEFT JOIN estudiants e ON a.estudiant_id = e.id
            WHERE e.id IS NULL
        `);
        console.log(`   Assoliments sense estudiant: ${assolimentsHuerfanos.rows[0].total}`);
        
        client.release();
        console.log('\n✅ Verificació completada');
        
    } catch (error) {
        console.error('❌ Error verificant dades:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    checkDatabaseData()
        .then(() => {
            console.log('🎉 Verificació completada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error:', error);
            process.exit(1);
        });
}

module.exports = { checkDatabaseData }; 