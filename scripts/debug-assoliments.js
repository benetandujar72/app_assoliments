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

async function debugAssoliments() {
    const pool = new Pool(config);
    
    try {
        console.log('🔌 Conectant a la base de dades...');
        
        const client = await pool.connect();
        console.log('✅ Connexió exitosa');
        
        // Verificar estructura de la tabla assoliments
        console.log('\n📋 Estructura de la taula assoliments:');
        const structure = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'assoliments'
            ORDER BY ordinal_position
        `);
        
        structure.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
        
        // Verificar constraints
        console.log('\n🔒 Constraints de la taula assoliments:');
        const constraints = await client.query(`
            SELECT conname, contype, pg_get_constraintdef(oid) as definition
            FROM pg_constraint
            WHERE conrelid = 'assoliments'::regclass
        `);
        
        if (constraints.rows.length > 0) {
            constraints.rows.forEach(constraint => {
                console.log(`   - ${constraint.conname}: ${constraint.definition}`);
            });
        } else {
            console.log('   No hi ha constraints definits');
        }
        
        // Probar inserción manual
        console.log('\n🧪 Provant inserció manual...');
        
        // Obtener un estudiante
        const estudiante = await client.query('SELECT id FROM estudiants LIMIT 1');
        if (estudiante.rows.length === 0) {
            console.log('❌ No hi ha estudiants per provar');
            return;
        }
        
        const estudiantId = estudiante.rows[0].id;
        console.log(`   Estudiant ID: ${estudiantId}`);
        
        // Obtener una asignatura
        const asignatura = await client.query('SELECT id FROM assignatures WHERE nom = \'Català\' LIMIT 1');
        if (asignatura.rows.length === 0) {
            console.log('❌ No hi ha assignatures per provar');
            return;
        }
        
        const assignaturaId = asignatura.rows[0].id;
        console.log(`   Assignatura ID: ${assignaturaId}`);
        
        // Intentar inserción
        try {
            const result = await client.query(`
                INSERT INTO assoliments (estudiant_id, assignatura_id, trimestre, assoliment, valor_numeric)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
            `, [estudiantId, assignaturaId, '1r trim', 'AS', 1]);
            
            console.log(`✅ Inserció exitosa! ID: ${result.rows[0].id}`);
            
            // Verificar que se insertó
            const count = await client.query('SELECT COUNT(*) as total FROM assoliments');
            console.log(`   Total assoliments després de la inserció: ${count.rows[0].total}`);
            
        } catch (error) {
            console.error(`❌ Error en la inserció: ${error.message}`);
            console.error(`   Detalls: ${error.detail || 'No disponible'}`);
        }
        
        client.release();
        console.log('\n✅ Debug completat');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    debugAssoliments()
        .then(() => {
            console.log('🎉 Debug completat');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error:', error);
            process.exit(1);
        });
}

module.exports = { debugAssoliments }; 