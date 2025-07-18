const fs = require('fs');
const csv = require('csv-parser');
const { query } = require('../database/db.js');

const assignatures = {
    'LIN': { nom: 'Llengua', cols: [2, 3, 4, 5] },
    'ANG': { nom: 'Anglès', cols: [6, 7, 8, 9] },
    'FRA': { nom: 'Francès', cols: [10, 11, 12, 13] },
    'MAT': { nom: 'Matemàtiques', cols: [14, 15, 16, 17] },
    'MUS': { nom: 'Música', cols: [18, 19, 20, 21] },
    'EC': { nom: 'Espai Creatiu', cols: [22, 23, 24, 25] },
    'FIS': { nom: 'Educació Física', cols: [26, 27, 28, 29] },
    'EG': { nom: 'Espai Globalitzat', cols: [30, 31, 32, 33, 34, 35, 36, 37] }
};

const valorsAssoliment = { 'NA': 0, 'AS': 1, 'AN': 2, 'AE': 3 };

const importCSV = async (filePath) => {
    try {
        console.log('📁 Important dades del CSV...');
        
        const results = [];
        
        // Llegir el CSV
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', resolve)
                .on('error', reject);
        });

        console.log(`📊 ${results.length} files llegides del CSV`);

        // Netejar dades existents
        await query('DELETE FROM assoliments');
        await query('DELETE FROM estudiants');
        console.log('🗑️ Dades existents eliminades');

        let estudiantsInsertats = 0;
        let assolimentsInsertats = 0;

        // Processar cada fila
        for (let i = 0; i < results.length; i++) {
            const row = results[i];
            
            // Saltar files buides o sense dades vàlides
            if (!row.CLASSE || !row.NOM) continue;
            
            const classe = row.CLASSE.trim();
            const nom = row.NOM.trim();
            
            // Inserir estudiant
            const estudiantResult = await query(`
                INSERT INTO estudiants (nom, classe) 
                VALUES ($1, $2) 
                RETURNING id
            `, [nom, classe]);
            
            const estudiantId = estudiantResult.rows[0].id;
            estudiantsInsertats++;

            // Processar assoliments per assignatura
            for (const [codiAssignatura, info] of Object.entries(assignatures)) {
                for (let j = 0; j < info.cols.length; j++) {
                    const colIndex = info.cols[j];
                    const valor = row[Object.keys(row)[colIndex]];
                    
                    if (!valor || valor.trim() === '' || valor === 'N/A') continue;
                    
                    const assoliment = valor.trim().toUpperCase();
                    if (!['NA', 'AS', 'AN', 'AE'].includes(assoliment)) continue;

                    // Determinar trimestre
                    let trimestre;
                    if (codiAssignatura === 'EG') {
                        if (colIndex === 30) trimestre = '0';
                        else if (colIndex === 31 || colIndex === 32) trimestre = '1';
                        else if (colIndex === 33 || colIndex === 34) trimestre = '2';
                        else if (colIndex === 35 || colIndex === 36) trimestre = '3';
                        else if (colIndex === 37) trimestre = 'FINAL';
                    } else {
                        trimestre = j < 3 ? (j + 1).toString() : 'FINAL';
                    }

                    // Obtenir ID de l'assignatura
                    const assignaturaResult = await query(`
                        SELECT id FROM assignatures WHERE codi = $1
                    `, [codiAssignatura]);
                    
                    if (assignaturaResult.rows.length === 0) {
                        console.warn(`⚠️ Assignatura ${codiAssignatura} no trobada`);
                        continue;
                    }
                    
                    const assignaturaId = assignaturaResult.rows[0].id;

                    // Inserir assoliment
                    await query(`
                        INSERT INTO assoliments (estudiant_id, assignatura_id, trimestre, assoliment, valor_numeric)
                        VALUES ($1, $2, $3, $4, $5)
                        ON CONFLICT (estudiant_id, assignatura_id, trimestre) 
                        DO UPDATE SET 
                            assoliment = EXCLUDED.assoliment,
                            valor_numeric = EXCLUDED.valor_numeric,
                            updated_at = CURRENT_TIMESTAMP
                    `, [estudiantId, assignaturaId, trimestre, assoliment, valorsAssoliment[assoliment]]);
                    
                    assolimentsInsertats++;
                }
            }

            // Mostrar progrés cada 10 estudiants
            if ((i + 1) % 10 === 0) {
                console.log(`📊 Processats ${i + 1}/${results.length} estudiants...`);
            }
        }

        console.log('✅ Importació completada!');
        console.log(`👥 Estudiants inserits: ${estudiantsInsertats}`);
        console.log(`📊 Assoliments inserits: ${assolimentsInsertats}`);

        // Mostrar estadístiques
        const stats = await query(`
            SELECT 
                COUNT(DISTINCT e.id) as total_estudiants,
                COUNT(DISTINCT a.id) as total_assoliments,
                COUNT(DISTINCT e.classe) as total_classes
            FROM estudiants e
            LEFT JOIN assoliments a ON e.id = a.estudiant_id
        `);

        console.log('\n📈 Estadístiques de la importació:');
        console.log(`   - Total estudiants: ${stats.rows[0].total_estudiants}`);
        console.log(`   - Total assoliments: ${stats.rows[0].total_assoliments}`);
        console.log(`   - Total classes: ${stats.rows[0].total_classes}`);

        process.exit(0);

    } catch (error) {
        console.error('❌ Error important el CSV:', error);
        process.exit(1);
    }
};

// Executar si es crida directament
if (require.main === module) {
    const filePath = process.argv[2] || '3a avaluació 24-25 - Assoliments - 3r ESO.csv';
    
    if (!fs.existsSync(filePath)) {
        console.error(`❌ El fitxer ${filePath} no existeix`);
        process.exit(1);
    }
    
    importCSV(filePath);
}

module.exports = importCSV; 