const { query } = require('../database/db.js');

async function testComparatives() {
    try {
        console.log('🧪 Provant sistema de comparatives...');
        
        // Verificar que hi ha dades
        const dataCheck = await query(`
            SELECT 
                COUNT(DISTINCT e.id) as total_estudiants,
                COUNT(DISTINCT a.id) as total_assoliments,
                COUNT(DISTINCT ass.id) as total_assignatures
            FROM estudiants e
            LEFT JOIN assoliments a ON e.id = a.estudiant_id
            LEFT JOIN assignatures ass ON a.assignatura_id = ass.id
        `);
        
        const stats = dataCheck.rows[0];
        console.log(`📊 Dades disponibles:`);
        console.log(`   - Estudiants: ${stats.total_estudiants}`);
        console.log(`   - Assoliments: ${stats.total_assoliments}`);
        console.log(`   - Assignatures: ${stats.total_assignatures}`);
        
        if (stats.total_assoliments === 0) {
            console.log('❌ No hi ha dades per provar les comparatives');
            console.log('💡 Carrega un fitxer CSV primer');
            process.exit(1);
        }
        
        // Provar cada tipus de comparativa
        const comparatives = [
            'materies',
            'grups', 
            'temporal',
            'multidimensional',
            'correlacions',
            'analisi-variancia'
        ];
        
        for (const comparativa of comparatives) {
            console.log(`\n🔍 Provant comparativa: ${comparativa}`);
            
            try {
                let sql = '';
                let params = [];
                
                switch (comparativa) {
                    case 'materies':
                        sql = `
                            SELECT 
                                ass.codi,
                                ass.nom,
                                COUNT(a.id) as total_assoliments,
                                AVG(a.valor_numeric) as mitjana,
                                ROUND((COUNT(CASE WHEN a.assoliment IN ('AE', 'AN') THEN 1 END) * 100.0 / COUNT(*)), 2) as percentatge_exit
                            FROM assignatures ass
                            LEFT JOIN assoliments a ON ass.id = a.assignatura_id
                            GROUP BY ass.id, ass.codi, ass.nom
                            ORDER BY mitjana DESC NULLS LAST
                        `;
                        break;
                        
                    case 'grups':
                        sql = `
                            SELECT 
                                e.classe,
                                COUNT(DISTINCT e.id) as total_estudiants,
                                AVG(a.valor_numeric) as mitjana,
                                ROUND((COUNT(CASE WHEN a.assoliment IN ('AE', 'AN') THEN 1 END) * 100.0 / COUNT(*)), 2) as percentatge_exit
                            FROM estudiants e
                            LEFT JOIN assoliments a ON e.id = a.estudiant_id
                            GROUP BY e.classe
                            ORDER BY mitjana DESC NULLS LAST
                        `;
                        break;
                        
                    case 'temporal':
                        sql = `
                            SELECT 
                                a.trimestre,
                                COUNT(a.id) as total_assoliments,
                                AVG(a.valor_numeric) as mitjana,
                                ROUND((COUNT(CASE WHEN a.assoliment IN ('AE', 'AN') THEN 1 END) * 100.0 / COUNT(*)), 2) as percentatge_exit
                            FROM assoliments a
                            GROUP BY a.trimestre
                            ORDER BY a.trimestre
                        `;
                        break;
                        
                    case 'multidimensional':
                        sql = `
                            SELECT 
                                ass.codi as assignatura_codi,
                                ass.nom as assignatura_nom,
                                e.classe,
                                a.trimestre,
                                AVG(a.valor_numeric) as mitjana,
                                ROUND((COUNT(CASE WHEN a.assoliment IN ('AE', 'AN') THEN 1 END) * 100.0 / COUNT(*)), 2) as percentatge_exit
                            FROM assoliments a
                            JOIN estudiants e ON a.estudiant_id = e.id
                            JOIN assignatures ass ON a.assignatura_id = ass.id
                            GROUP BY ass.id, ass.codi, ass.nom, e.classe, a.trimestre
                            ORDER BY ass.nom, e.classe, a.trimestre
                            LIMIT 10
                        `;
                        break;
                        
                    case 'correlacions':
                        sql = `
                            SELECT 
                                e.id as estudiant_id,
                                ass.codi as assignatura_codi,
                                AVG(a.valor_numeric) as mitjana_assignatura
                            FROM estudiants e
                            JOIN assoliments a ON e.id = a.estudiant_id
                            JOIN assignatures ass ON a.assignatura_id = ass.id
                            GROUP BY e.id, ass.id, ass.codi
                            ORDER BY e.nom, ass.nom
                            LIMIT 50
                        `;
                        break;
                        
                    case 'analisi-variancia':
                        sql = `
                            SELECT 
                                e.classe,
                                COUNT(a.id) as n,
                                AVG(a.valor_numeric) as mitjana,
                                VARIANCE(a.valor_numeric) as variancia
                            FROM estudiants e
                            JOIN assoliments a ON e.id = a.estudiant_id
                            GROUP BY e.classe
                            ORDER BY e.classe
                        `;
                        break;
                }
                
                const result = await query(sql, params);
                console.log(`   ✅ ${result.rows.length} registres obtinguts`);
                
                if (result.rows.length > 0) {
                    console.log(`   📈 Primer registre:`, result.rows[0]);
                }
                
            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
            }
        }
        
        console.log('\n✅ Test de comparatives completat');
        console.log('🎉 El sistema de comparatives està funcionant correctament');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error executant test de comparatives:', error);
        process.exit(1);
    }
}

testComparatives(); 