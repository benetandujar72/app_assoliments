const express = require('express');
const router = express.Router();
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

module.exports = router; 