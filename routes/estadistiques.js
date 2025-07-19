const express = require('express');
const router = express.Router();

// Verificar variables d'entorn abans d'importar la base de dades
console.log('🔧 Verificant configuració de base de dades en estadistiques.js...');
console.log(`📍 DB_HOST: ${process.env.DB_HOST || 'NO CONFIGURAT'}`);
console.log(`🗄️ DB_NAME: ${process.env.DB_NAME || 'NO CONFIGURAT'}`);
console.log(`👤 DB_USER: ${process.env.DB_USER || 'NO CONFIGURAT'}`);
console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

const { query, run } = require('../database/db.js');

// GET /api/estadistiques/generals - Estadístiques generals del sistema
router.get('/generals', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                (SELECT COUNT(*) FROM estudiants) as total_estudiants,
                (SELECT COUNT(*) FROM assignatures) as total_assignatures,
                (SELECT COUNT(*) FROM assoliments) as total_assoliments,
                (SELECT COUNT(DISTINCT classe) FROM estudiants) as total_classes,
                (SELECT AVG(valor_numeric) FROM assoliments) as mitjana_general,
                (SELECT COUNT(CASE WHEN assoliment = 'AE' THEN 1 END) FROM assoliments) as total_excelents,
                (SELECT COUNT(CASE WHEN assoliment = 'AN' THEN 1 END) FROM assoliments) as total_notables,
                (SELECT COUNT(CASE WHEN assoliment = 'AS' THEN 1 END) FROM assoliments) as total_suficients,
                (SELECT COUNT(CASE WHEN assoliment = 'NA' THEN 1 END) FROM assoliments) as total_no_assoliments
        `);

        const data = result.rows[0];
        
        // Calcular percentatges
        const total = parseInt(data.total_assoliments);
        data.percentatge_excelents = total > 0 ? ((data.total_excelents / total) * 100).toFixed(2) : 0;
        data.percentatge_notables = total > 0 ? ((data.total_notables / total) * 100).toFixed(2) : 0;
        data.percentatge_suficients = total > 0 ? ((data.total_suficients / total) * 100).toFixed(2) : 0;
        data.percentatge_no_assoliments = total > 0 ? ((data.total_no_assoliments / total) * 100).toFixed(2) : 0;

        res.json({
            success: true,
            data: data
        });

    } catch (error) {
        console.error('Error obtenint estadístiques generals:', error);
        res.status(500).json({
            success: false,
            error: 'Error obtenint les estadístiques generals',
            message: error.message
        });
    }
});

// GET /api/estadistiques/distribucio-assoliments - Distribució d'assoliments
router.get('/distribucio-assoliments', async (req, res) => {
    try {
        const { classe, assignatura, trimestre } = req.query;

        let sql = `
            SELECT 
                a.assoliment,
                COUNT(*) as quantitat,
                ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2) as percentatge
            FROM assoliments a
            JOIN estudiants e ON a.estudiant_id = e.id
            JOIN assignatures ass ON a.assignatura_id = ass.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;

        if (classe) {
            sql += ` AND e.classe = $${paramIndex}`;
            params.push(classe);
            paramIndex++;
        }

        if (assignatura) {
            sql += ` AND ass.codi = $${paramIndex}`;
            params.push(assignatura);
            paramIndex++;
        }

        if (trimestre) {
            sql += ` AND a.trimestre = $${paramIndex}`;
            params.push(trimestre);
            paramIndex++;
        }

        sql += ` GROUP BY a.assoliment ORDER BY a.assoliment`;

        const result = await query(sql, params);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error obtenint distribució d\'assoliments:', error);
        res.status(500).json({
            success: false,
            error: 'Error obtenint la distribució d\'assoliments',
            message: error.message
        });
    }
});

// GET /api/estadistiques/evolucio-trimestres - Evolució per trimestres
router.get('/evolucio-trimestres', async (req, res) => {
    try {
        const { classe, assignatura } = req.query;

        let sql = `
            SELECT 
                a.trimestre,
                COUNT(*) as total_assoliments,
                AVG(a.valor_numeric) as mitjana,
                COUNT(CASE WHEN a.assoliment = 'AE' THEN 1 END) as excelents,
                COUNT(CASE WHEN a.assoliment = 'AN' THEN 1 END) as notables,
                COUNT(CASE WHEN a.assoliment = 'AS' THEN 1 END) as suficients,
                COUNT(CASE WHEN a.assoliment = 'NA' THEN 1 END) as no_assoliments
            FROM assoliments a
            JOIN estudiants e ON a.estudiant_id = e.id
            JOIN assignatures ass ON a.assignatura_id = ass.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;

        if (classe) {
            sql += ` AND e.classe = $${paramIndex}`;
            params.push(classe);
            paramIndex++;
        }

        if (assignatura) {
            sql += ` AND ass.codi = $${paramIndex}`;
            params.push(assignatura);
            paramIndex++;
        }

        sql += ` GROUP BY a.trimestre ORDER BY a.trimestre`;

        const result = await query(sql, params);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error obtenint evolució per trimestres:', error);
        res.status(500).json({
            success: false,
            error: 'Error obtenint l\'evolució per trimestres',
            message: error.message
        });
    }
});

// GET /api/estadistiques/ranking-assignatures - Ranking d'assignatures
router.get('/ranking-assignatures', async (req, res) => {
    try {
        const { classe, trimestre } = req.query;

        let sql = `
            SELECT 
                ass.codi,
                ass.nom,
                COUNT(a.id) as total_assoliments,
                AVG(a.valor_numeric) as mitjana,
                COUNT(CASE WHEN a.assoliment = 'AE' THEN 1 END) as excelents,
                COUNT(CASE WHEN a.assoliment = 'AN' THEN 1 END) as notables,
                COUNT(CASE WHEN a.assoliment = 'AS' THEN 1 END) as suficients,
                COUNT(CASE WHEN a.assoliment = 'NA' THEN 1 END) as no_assoliments,
                ROUND((COUNT(CASE WHEN a.assoliment IN ('AE', 'AN') THEN 1 END) * 100.0 / COUNT(*)), 2) as percentatge_exit
            FROM assignatures ass
            LEFT JOIN assoliments a ON ass.id = a.assignatura_id
            LEFT JOIN estudiants e ON a.estudiant_id = e.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;

        if (classe) {
            sql += ` AND e.classe = $${paramIndex}`;
            params.push(classe);
            paramIndex++;
        }

        if (trimestre) {
            sql += ` AND a.trimestre = $${paramIndex}`;
            params.push(trimestre);
            paramIndex++;
        }

        sql += ` GROUP BY ass.id, ass.codi, ass.nom ORDER BY mitjana DESC NULLS LAST`;

        const result = await query(sql, params);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error obtenint ranking d\'assignatures:', error);
        res.status(500).json({
            success: false,
            error: 'Error obtenint el ranking d\'assignatures',
            message: error.message
        });
    }
});

// GET /api/estadistiques/rendiment-grups - Rendiment per grups
router.get('/rendiment-grups', async (req, res) => {
    try {
        const { assignatura, trimestre } = req.query;

        let sql = `
            SELECT 
                e.classe,
                COUNT(DISTINCT e.id) as total_estudiants,
                COUNT(a.id) as total_assoliments,
                AVG(a.valor_numeric) as mitjana,
                COUNT(CASE WHEN a.assoliment = 'AE' THEN 1 END) as excelents,
                COUNT(CASE WHEN a.assoliment = 'AN' THEN 1 END) as notables,
                COUNT(CASE WHEN a.assoliment = 'AS' THEN 1 END) as suficients,
                COUNT(CASE WHEN a.assoliment = 'NA' THEN 1 END) as no_assoliments,
                ROUND((COUNT(CASE WHEN a.assoliment IN ('AE', 'AN') THEN 1 END) * 100.0 / COUNT(*)), 2) as percentatge_exit
            FROM estudiants e
            LEFT JOIN assoliments a ON e.id = a.estudiant_id
            LEFT JOIN assignatures ass ON a.assignatura_id = ass.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;

        if (assignatura) {
            sql += ` AND ass.codi = $${paramIndex}`;
            params.push(assignatura);
            paramIndex++;
        }

        if (trimestre) {
            sql += ` AND a.trimestre = $${paramIndex}`;
            params.push(trimestre);
            paramIndex++;
        }

        sql += ` GROUP BY e.classe ORDER BY mitjana DESC NULLS LAST`;

        const result = await query(sql, params);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error obtenint rendiment per grups:', error);
        res.status(500).json({
            success: false,
            error: 'Error obtenint el rendiment per grups',
            message: error.message
        });
    }
});

// GET /api/estadistiques/alumnes-risc - Identificar alumnes en risc
router.get('/alumnes-risc', async (req, res) => {
    try {
        const { classe, limit = 10 } = req.query;

        let sql = `
            SELECT 
                e.id,
                e.nom,
                e.classe,
                COUNT(a.id) as total_assoliments,
                AVG(a.valor_numeric) as mitjana,
                COUNT(CASE WHEN a.assoliment = 'NA' THEN 1 END) as no_assoliments,
                ROUND((COUNT(CASE WHEN a.assoliment = 'NA' THEN 1 END) * 100.0 / COUNT(*)), 2) as percentatge_na
            FROM estudiants e
            LEFT JOIN assoliments a ON e.id = a.estudiant_id
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;

        if (classe) {
            sql += ` AND e.classe = $${paramIndex}`;
            params.push(classe);
            paramIndex++;
        }

        sql += ` GROUP BY e.id, e.nom, e.classe`;
        sql += ` HAVING COUNT(a.id) > 0 AND AVG(a.valor_numeric) < 1.5`;
        sql += ` ORDER BY mitjana ASC, percentatge_na DESC`;
        sql += ` LIMIT $${paramIndex}`;
        params.push(parseInt(limit));

        const result = await query(sql, params);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error obtenint alumnes en risc:', error);
        res.status(500).json({
            success: false,
            error: 'Error obtenint els alumnes en risc',
            message: error.message
        });
    }
});

// GET /api/estadistiques/assignatures-dificils - Assignatures amb més dificultats
router.get('/assignatures-dificils', async (req, res) => {
    try {
        const { classe, trimestre, limit = 5 } = req.query;

        let sql = `
            SELECT 
                ass.codi,
                ass.nom,
                COUNT(a.id) as total_assoliments,
                COUNT(CASE WHEN a.assoliment = 'NA' THEN 1 END) as no_assoliments,
                ROUND((COUNT(CASE WHEN a.assoliment = 'NA' THEN 1 END) * 100.0 / COUNT(*)), 2) as percentatge_na,
                AVG(a.valor_numeric) as mitjana
            FROM assignatures ass
            LEFT JOIN assoliments a ON ass.id = a.assignatura_id
            LEFT JOIN estudiants e ON a.estudiant_id = e.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;

        if (classe) {
            sql += ` AND e.classe = $${paramIndex}`;
            params.push(classe);
            paramIndex++;
        }

        if (trimestre) {
            sql += ` AND a.trimestre = $${paramIndex}`;
            params.push(trimestre);
            paramIndex++;
        }

        sql += ` GROUP BY ass.id, ass.codi, ass.nom`;
        sql += ` HAVING COUNT(a.id) > 0`;
        sql += ` ORDER BY percentatge_na DESC, mitjana ASC`;
        sql += ` LIMIT $${paramIndex}`;
        params.push(parseInt(limit));

        const result = await query(sql, params);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error obtenint assignatures amb dificultats:', error);
        res.status(500).json({
            success: false,
            error: 'Error obtenint les assignatures amb dificultats',
            message: error.message
        });
    }
});

// GET /api/estadistiques/progressio-individual - Progressió individual d'un estudiant
router.get('/progressio-individual/:estudiantId', async (req, res) => {
    try {
        const { estudiantId } = req.params;
        const { assignatura } = req.query;

        let sql = `
            SELECT 
                a.trimestre,
                ass.codi as assignatura_codi,
                ass.nom as assignatura_nom,
                a.assoliment,
                a.valor_numeric
            FROM assoliments a
            JOIN assignatures ass ON a.assignatura_id = ass.id
            WHERE a.estudiant_id = $1
        `;
        
        const params = [estudiantId];
        let paramIndex = 2;

        if (assignatura) {
            sql += ` AND ass.codi = $${paramIndex}`;
            params.push(assignatura);
            paramIndex++;
        }

        sql += ` ORDER BY ass.nom, a.trimestre`;

        const result = await query(sql, params);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error obtenint progressió individual:', error);
        res.status(500).json({
            success: false,
            error: 'Error obtenint la progressió individual',
            message: error.message
        });
    }
});

// ===== NOVES RUTES PER COMPARATIVES ESTADÍSTIQUES =====

// GET /api/estadistiques/comparativa/materies - Comparativa entre materies
router.get('/comparativa/materies', async (req, res) => {
    try {
        const { classe, trimestre, grup_materies } = req.query;

        let sql = `
            SELECT 
                ass.codi,
                ass.nom,
                COUNT(a.id) as total_assoliments,
                AVG(a.valor_numeric) as mitjana,
                STDDEV(a.valor_numeric) as desviacio_estandard,
                COUNT(CASE WHEN a.assoliment = 'AE' THEN 1 END) as excelents,
                COUNT(CASE WHEN a.assoliment = 'AN' THEN 1 END) as notables,
                COUNT(CASE WHEN a.assoliment = 'AS' THEN 1 END) as suficients,
                COUNT(CASE WHEN a.assoliment = 'NA' THEN 1 END) as no_assoliments,
                ROUND((COUNT(CASE WHEN a.assoliment IN ('AE', 'AN') THEN 1 END) * 100.0 / COUNT(*)), 2) as percentatge_exit,
                ROUND((COUNT(CASE WHEN a.assoliment = 'NA' THEN 1 END) * 100.0 / COUNT(*)), 2) as percentatge_na
            FROM assignatures ass
            LEFT JOIN assoliments a ON ass.id = a.assignatura_id
            LEFT JOIN estudiants e ON a.estudiant_id = e.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;

        if (classe) {
            sql += ` AND e.classe = $${paramIndex}`;
            params.push(classe);
            paramIndex++;
        }

        if (trimestre) {
            sql += ` AND a.trimestre = $${paramIndex}`;
            params.push(trimestre);
            paramIndex++;
        }

        if (grup_materies) {
            const materies = grup_materies.split(',');
            sql += ` AND ass.codi IN (${materies.map(() => `$${paramIndex++}`).join(',')})`;
            params.push(...materies);
        }

        sql += ` GROUP BY ass.id, ass.codi, ass.nom ORDER BY mitjana DESC NULLS LAST`;

        const result = await query(sql, params);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error obtenint comparativa de materies:', error);
        res.status(500).json({
            success: false,
            error: 'Error obtenint la comparativa de materies',
            message: error.message
        });
    }
});

// GET /api/estadistiques/comparativa/grups - Comparativa entre grups
router.get('/comparativa/grups', async (req, res) => {
    try {
        const { assignatura, trimestre, grup_classes } = req.query;

        let sql = `
            SELECT 
                e.classe,
                COUNT(DISTINCT e.id) as total_estudiants,
                COUNT(a.id) as total_assoliments,
                AVG(a.valor_numeric) as mitjana,
                STDDEV(a.valor_numeric) as desviacio_estandard,
                COUNT(CASE WHEN a.assoliment = 'AE' THEN 1 END) as excelents,
                COUNT(CASE WHEN a.assoliment = 'AN' THEN 1 END) as notables,
                COUNT(CASE WHEN a.assoliment = 'AS' THEN 1 END) as suficients,
                COUNT(CASE WHEN a.assoliment = 'NA' THEN 1 END) as no_assoliments,
                ROUND((COUNT(CASE WHEN a.assoliment IN ('AE', 'AN') THEN 1 END) * 100.0 / COUNT(*)), 2) as percentatge_exit,
                ROUND((COUNT(CASE WHEN a.assoliment = 'NA' THEN 1 END) * 100.0 / COUNT(*)), 2) as percentatge_na
            FROM estudiants e
            LEFT JOIN assoliments a ON e.id = a.estudiant_id
            LEFT JOIN assignatures ass ON a.assignatura_id = ass.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;

        if (assignatura) {
            sql += ` AND ass.codi = $${paramIndex}`;
            params.push(assignatura);
            paramIndex++;
        }

        if (trimestre) {
            sql += ` AND a.trimestre = $${paramIndex}`;
            params.push(trimestre);
            paramIndex++;
        }

        if (grup_classes) {
            const classes = grup_classes.split(',');
            sql += ` AND e.classe IN (${classes.map(() => `$${paramIndex++}`).join(',')})`;
            params.push(...classes);
        }

        sql += ` GROUP BY e.classe ORDER BY mitjana DESC NULLS LAST`;

        const result = await query(sql, params);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error obtenint comparativa de grups:', error);
        res.status(500).json({
            success: false,
            error: 'Error obtenint la comparativa de grups',
            message: error.message
        });
    }
});

// GET /api/estadistiques/comparativa/temporal - Comparativa temporal per trimestres
router.get('/comparativa/temporal', async (req, res) => {
    try {
        const { classe, assignatura } = req.query;

        let sql = `
            SELECT 
                a.trimestre,
                COUNT(a.id) as total_assoliments,
                AVG(a.valor_numeric) as mitjana,
                STDDEV(a.valor_numeric) as desviacio_estandard,
                COUNT(CASE WHEN a.assoliment = 'AE' THEN 1 END) as excelents,
                COUNT(CASE WHEN a.assoliment = 'AN' THEN 1 END) as notables,
                COUNT(CASE WHEN a.assoliment = 'AS' THEN 1 END) as suficients,
                COUNT(CASE WHEN a.assoliment = 'NA' THEN 1 END) as no_assoliments,
                ROUND((COUNT(CASE WHEN a.assoliment IN ('AE', 'AN') THEN 1 END) * 100.0 / COUNT(*)), 2) as percentatge_exit,
                ROUND((COUNT(CASE WHEN a.assoliment = 'NA' THEN 1 END) * 100.0 / COUNT(*)), 2) as percentatge_na
            FROM assoliments a
            JOIN estudiants e ON a.estudiant_id = e.id
            JOIN assignatures ass ON a.assignatura_id = ass.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;

        if (classe) {
            sql += ` AND e.classe = $${paramIndex}`;
            params.push(classe);
            paramIndex++;
        }

        if (assignatura) {
            sql += ` AND ass.codi = $${paramIndex}`;
            params.push(assignatura);
            paramIndex++;
        }

        sql += ` GROUP BY a.trimestre ORDER BY a.trimestre`;

        const result = await query(sql, params);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error obtenint comparativa temporal:', error);
        res.status(500).json({
            success: false,
            error: 'Error obtenint la comparativa temporal',
            message: error.message
        });
    }
});

// GET /api/estadistiques/comparativa/multidimensional - Comparativa multidimensional
router.get('/comparativa/multidimensional', async (req, res) => {
    try {
        const { classe, assignatura, trimestre } = req.query;

        let sql = `
            SELECT 
                ass.codi as assignatura_codi,
                ass.nom as assignatura_nom,
                e.classe,
                a.trimestre,
                COUNT(a.id) as total_assoliments,
                AVG(a.valor_numeric) as mitjana,
                COUNT(CASE WHEN a.assoliment = 'AE' THEN 1 END) as excelents,
                COUNT(CASE WHEN a.assoliment = 'AN' THEN 1 END) as notables,
                COUNT(CASE WHEN a.assoliment = 'AS' THEN 1 END) as suficients,
                COUNT(CASE WHEN a.assoliment = 'NA' THEN 1 END) as no_assoliments,
                ROUND((COUNT(CASE WHEN a.assoliment IN ('AE', 'AN') THEN 1 END) * 100.0 / COUNT(*)), 2) as percentatge_exit
            FROM assoliments a
            JOIN estudiants e ON a.estudiant_id = e.id
            JOIN assignatures ass ON a.assignatura_id = ass.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;

        if (classe) {
            sql += ` AND e.classe = $${paramIndex}`;
            params.push(classe);
            paramIndex++;
        }

        if (assignatura) {
            sql += ` AND ass.codi = $${paramIndex}`;
            params.push(assignatura);
            paramIndex++;
        }

        if (trimestre) {
            sql += ` AND a.trimestre = $${paramIndex}`;
            params.push(trimestre);
            paramIndex++;
        }

        sql += ` GROUP BY ass.id, ass.codi, ass.nom, e.classe, a.trimestre ORDER BY ass.nom, e.classe, a.trimestre`;

        const result = await query(sql, params);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error obtenint comparativa multidimensional:', error);
        res.status(500).json({
            success: false,
            error: 'Error obtenint la comparativa multidimensional',
            message: error.message
        });
    }
});

// GET /api/estadistiques/comparativa/correlacions - Anàlisi de correlacions
router.get('/comparativa/correlacions', async (req, res) => {
    try {
        const { classe, trimestre } = req.query;

        // Obtenir dades per calcular correlacions entre materies
        let sql = `
            SELECT 
                e.id as estudiant_id,
                e.nom as estudiant_nom,
                ass.codi as assignatura_codi,
                ass.nom as assignatura_nom,
                AVG(a.valor_numeric) as mitjana_assignatura
            FROM estudiants e
            JOIN assoliments a ON e.id = a.estudiant_id
            JOIN assignatures ass ON a.assignatura_id = ass.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;

        if (classe) {
            sql += ` AND e.classe = $${paramIndex}`;
            params.push(classe);
            paramIndex++;
        }

        if (trimestre) {
            sql += ` AND a.trimestre = $${paramIndex}`;
            params.push(trimestre);
            paramIndex++;
        }

        sql += ` GROUP BY e.id, e.nom, ass.id, ass.codi, ass.nom ORDER BY e.nom, ass.nom`;

        const result = await query(sql, params);

        // Calcular correlacions entre materies
        const correlacions = [];
        const assignatures = [...new Set(result.rows.map(row => row.assignatura_codi))];
        
        for (let i = 0; i < assignatures.length; i++) {
            for (let j = i + 1; j < assignatures.length; j++) {
                const mat1 = assignatures[i];
                const mat2 = assignatures[j];
                
                const dadesMat1 = result.rows.filter(row => row.assignatura_codi === mat1);
                const dadesMat2 = result.rows.filter(row => row.assignatura_codi === mat2);
                
                // Crear mapa d'estudiants per mat1
                const mapMat1 = new Map();
                dadesMat1.forEach(row => {
                    mapMat1.set(row.estudiant_id, row.mitjana_assignatura);
                });
                
                // Crear mapa d'estudiants per mat2
                const mapMat2 = new Map();
                dadesMat2.forEach(row => {
                    mapMat2.set(row.estudiant_id, row.mitjana_assignatura);
                });
                
                // Calcular correlació només per estudiants que tenen dades en ambdues materies
                const estudiantsComuns = [];
                for (const [estudiantId, valor1] of mapMat1) {
                    if (mapMat2.has(estudiantId)) {
                        estudiantsComuns.push({
                            valor1: valor1,
                            valor2: mapMat2.get(estudiantId)
                        });
                    }
                }
                
                if (estudiantsComuns.length > 1) {
                    const correlacio = calcularCorrelacio(estudiantsComuns.map(e => e.valor1), estudiantsComuns.map(e => e.valor2));
                    correlacions.push({
                        assignatura1: mat1,
                        assignatura2: mat2,
                        correlacio: correlacio,
                        estudiants_comuns: estudiantsComuns.length
                    });
                }
            }
        }

        res.json({
            success: true,
            data: correlacions.sort((a, b) => Math.abs(b.correlacio) - Math.abs(a.correlacio))
        });

    } catch (error) {
        console.error('Error obtenint correlacions:', error);
        res.status(500).json({
            success: false,
            error: 'Error obtenint les correlacions',
            message: error.message
        });
    }
});

// Funció auxiliar per calcular correlació de Pearson
function calcularCorrelacio(x, y) {
    const n = x.length;
    if (n !== y.length || n === 0) return 0;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerador = n * sumXY - sumX * sumY;
    const denominador = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominador === 0 ? 0 : numerador / denominador;
}

// GET /api/estadistiques/comparativa/analisi-variancia - Anàlisi de variància
router.get('/comparativa/analisi-variancia', async (req, res) => {
    try {
        const { assignatura, trimestre } = req.query;

        let sql = `
            SELECT 
                e.classe,
                COUNT(a.id) as n,
                AVG(a.valor_numeric) as mitjana,
                STDDEV(a.valor_numeric) as desviacio_estandard,
                VARIANCE(a.valor_numeric) as variancia
            FROM estudiants e
            JOIN assoliments a ON e.id = a.estudiant_id
            JOIN assignatures ass ON a.assignatura_id = ass.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;

        if (assignatura) {
            sql += ` AND ass.codi = $${paramIndex}`;
            params.push(assignatura);
            paramIndex++;
        }

        if (trimestre) {
            sql += ` AND a.trimestre = $${paramIndex}`;
            params.push(trimestre);
            paramIndex++;
        }

        sql += ` GROUP BY e.classe ORDER BY e.classe`;

        const result = await query(sql, params);

        // Calcular ANOVA simplificat
        const grups = result.rows;
        const totalN = grups.reduce((sum, grup) => sum + parseInt(grup.n), 0);
        const mitjanaGlobal = grups.reduce((sum, grup) => sum + grup.mitjana * grup.n, 0) / totalN;
        
        // Suma de quadrats entre grups (SSB)
        const ssb = grups.reduce((sum, grup) => {
            return sum + grup.n * Math.pow(grup.mitjana - mitjanaGlobal, 2);
        }, 0);
        
        // Suma de quadrats dins grups (SSW)
        const ssw = grups.reduce((sum, grup) => {
            return sum + (grup.n - 1) * grup.variancia;
        }, 0);
        
        // Estadístic F
        const dfb = grups.length - 1; // graus de llibertat entre grups
        const dfw = totalN - grups.length; // graus de llibertat dins grups
        const msb = ssb / dfb; // mitjana quadràtica entre grups
        const msw = ssw / dfw; // mitjana quadràtica dins grups
        const fStat = msb / msw;
        
        // Coeficient de determinació (R²)
        const rSquared = ssb / (ssb + ssw);

        res.json({
            success: true,
            data: {
                grups: grups,
                estadistics: {
                    total_observacions: totalN,
                    nombre_grups: grups.length,
                    mitjana_global: mitjanaGlobal,
                    ssb: ssb,
                    ssw: ssw,
                    msb: msb,
                    msw: msw,
                    f_statistic: fStat,
                    r_squared: rSquared,
                    significancia: fStat > 3.0 ? 'Significativa' : 'No significativa'
                }
            }
        });

    } catch (error) {
        console.error('Error obtenint anàlisi de variància:', error);
        res.status(500).json({
            success: false,
            error: 'Error obtenint l\'anàlisi de variància',
            message: error.message
        });
    }
});

module.exports = router; 