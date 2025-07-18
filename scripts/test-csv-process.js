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

async function testCSVProcess() {
    const pool = new Pool(config);
    
    try {
        console.log('🔌 Conectant a la base de dades...');
        
        const client = await pool.connect();
        console.log('✅ Connexió exitosa');
        
        // Datos de ejemplo (simulando una fila del CSV)
        const row = {
            CLASSE: '3A',
            NOM: 'Test Student',
            LIN1: 'AS',
            LIN2: 'AN',
            LIN3: 'AE',
            LINF: 'AE',
            ANG1: 'AS',
            ANG2: 'AS',
            ANG3: 'AN',
            ANGF: 'AE',
            FRA1: 'NA',
            FRA2: 'AS',
            FRA3: 'AS',
            FRAF: 'AN',
            MAT1: 'AS',
            MAT2: 'AN',
            MAT3: 'AE',
            MATF: 'AE',
            MUS1: 'AS',
            MUS2: 'AS',
            MUS3: 'AS',
            MUSF: 'AS',
            EC1: 'AN',
            EC2: 'AE',
            EC3: 'AE',
            ECF: 'AE',
            FIS1: 'AS',
            FIS2: 'AS',
            FIS3: 'AS',
            FISF: 'AS',
            EG1: 'AS',
            EX1: 'AN',
            EG2: 'AN',
            EX2: 'AE',
            EG3: 'AE',
            EG4: 'AE',
            EGF: 'AE'
        };
        
        console.log('\n📊 Processant fila de prova...');
        console.log(`   Estudiant: ${row.NOM} (${row.CLASSE})`);
        
        // Obtener o crear estudiante
        let studentResult = await client.query(`
            SELECT id FROM estudiants WHERE nom = $1 AND classe = $2
        `, [row.NOM, row.CLASSE]);
        
        let studentId;
        if (studentResult.rows.length === 0) {
            console.log('   Creant nou estudiant...');
            const newStudent = await client.query(`
                INSERT INTO estudiants (nom, classe) VALUES ($1, $2) RETURNING id
            `, [row.NOM, row.CLASSE]);
            studentId = newStudent.rows[0].id;
        } else {
            studentId = studentResult.rows[0].id;
        }
        
        console.log(`   Estudiant ID: ${studentId}`);
        
        // Definir asignaturas
        const assignatures = [
            { nom: 'Català', camps: ['LIN1', 'LIN2', 'LIN3', 'LINF'] },
            { nom: 'Anglès', camps: ['ANG1', 'ANG2', 'ANG3', 'ANGF'] },
            { nom: 'Francès', camps: ['FRA1', 'FRA2', 'FRA3', 'FRAF'] },
            { nom: 'Matemàtiques', camps: ['MAT1', 'MAT2', 'MAT3', 'MATF'] },
            { nom: 'Música', camps: ['MUS1', 'MUS2', 'MUS3', 'MUSF'] },
            { nom: 'Espai Creatiu', camps: ['EC1', 'EC2', 'EC3', 'ECF'] },
            { nom: 'Educació Física', camps: ['FIS1', 'FIS2', 'FIS3', 'FISF'] },
            { nom: 'Espai Globalitzat', camps: ['EG1', 'EX1', 'EG2', 'EX2', 'EG3', 'EG4', 'EGF'] }
        ];
        
        let insertedAssoliments = 0;
        
        // Procesar cada asignatura
        for (const assignatura of assignatures) {
            console.log(`\n📚 Processant assignatura: ${assignatura.nom}`);
            
            // Obtener ID de la asignatura
            const assignaturaResult = await client.query(`
                SELECT id FROM assignatures WHERE nom = $1
            `, [assignatura.nom]);
            
            if (assignaturaResult.rows.length === 0) {
                console.log(`   ⚠️ Assignatura ${assignatura.nom} no trobada`);
                continue;
            }
            
            const assignaturaId = assignaturaResult.rows[0].id;
            console.log(`   Assignatura ID: ${assignaturaId}`);
            
            // Procesar cada trimestre
            for (let i = 0; i < assignatura.camps.length; i++) {
                const camp = assignatura.camps[i];
                const assoliment = row[camp] || 'N/A';
                
                console.log(`     Camp ${camp}: "${assoliment}"`);
                
                // Saltar si está vacío o N/A
                if (!assoliment || assoliment === 'N/A' || assoliment.trim() === '') {
                    console.log(`     ⏭️ Saltant camp buit`);
                    continue;
                }
                
                // Validar assoliment
                const assolimentNet = assoliment.trim().substring(0, 2).toUpperCase();
                
                if (!['NA', 'AS', 'AN', 'AE'].includes(assolimentNet)) {
                    console.log(`     ⚠️ Valor invàlid: ${assoliment} -> ${assolimentNet}`);
                    continue;
                }
                
                // Determinar trimestre
                let trimestre;
                if (assignatura.nom === 'Espai Globalitzat') {
                    if (camp === 'EG1' || camp === 'EX1') {
                        trimestre = '1r trim';
                    } else if (camp === 'EG2' || camp === 'EX2') {
                        trimestre = '2n trim';
                    } else if (camp === 'EG3' || camp === 'EG4') {
                        trimestre = '3r trim';
                    } else if (camp === 'EGF') {
                        trimestre = 'final';
                    } else {
                        trimestre = '3r trim';
                    }
                } else {
                    if (camp.endsWith('1')) {
                        trimestre = '1r trim';
                    } else if (camp.endsWith('2')) {
                        trimestre = '2n trim';
                    } else if (camp.endsWith('3')) {
                        trimestre = '3r trim';
                    } else if (camp.endsWith('F')) {
                        trimestre = 'final';
                    } else {
                        trimestre = 'final';
                    }
                }
                
                console.log(`     Trimestre: ${trimestre}, Assoliment: ${assolimentNet}`);
                
                // Convertir a valor numérico
                const valorNumeric = { 'NA': 0, 'AS': 1, 'AN': 2, 'AE': 3 }[assolimentNet];
                
                // Insertar assoliment
                try {
                    await client.query(`
                        INSERT INTO assoliments (estudiant_id, assignatura_id, trimestre, assoliment, valor_numeric)
                        VALUES ($1, $2, $3, $4, $5)
                        ON CONFLICT (estudiant_id, assignatura_id, trimestre) 
                        DO UPDATE SET 
                            assoliment = EXCLUDED.assoliment,
                            valor_numeric = EXCLUDED.valor_numeric
                    `, [studentId, assignaturaId, trimestre, assolimentNet, valorNumeric]);
                    
                    insertedAssoliments++;
                    console.log(`     ✅ Inserit assoliment`);
                } catch (error) {
                    console.error(`     ❌ Error inserint: ${error.message}`);
                }
            }
        }
        
        console.log(`\n📊 Resum:`);
        console.log(`   Assoliments inserits: ${insertedAssoliments}`);
        
        // Verificar total
        const total = await client.query('SELECT COUNT(*) as total FROM assoliments');
        console.log(`   Total assoliments a la BD: ${total.rows[0].total}`);
        
        client.release();
        console.log('\n✅ Test completat');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testCSVProcess()
        .then(() => {
            console.log('🎉 Test completat');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error:', error);
            process.exit(1);
        });
}

module.exports = { testCSVProcess }; 