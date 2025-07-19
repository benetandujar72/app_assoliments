const express = require('express');
const router = express.Router();

// Verificar variables d'entorn abans d'importar la base de dades
console.log('🔧 Verificant configuració de base de dades en assoliments.js...');
console.log(`📍 DB_HOST: ${process.env.DB_HOST || 'NO CONFIGURAT'}`);
console.log(`🗄️ DB_NAME: ${process.env.DB_NAME || 'NO CONFIGURAT'}`);
console.log(`👤 DB_USER: ${process.env.DB_USER || 'NO CONFIGURAT'}`);
console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

const { query, run } = require('../database/db.js');

// GET /api/assoliments - Obtenir tots els assoliments amb filtres
router.get('/', async (req, res) => {
    try {
        const { 
            classe, 
            estudiant, 
            assignatura, 
            trimestre, 
            assoliment,
            limit = 1000,
            offset = 0
        } = req.query;

        let sql = `
            SELECT 
                a.id,
                a.trimestre,
                a.assoliment,
                a.valor_numeric,
                a.created_at,
                e.nom as estudiant_nom,
                e.classe,
                ass.nom as assignatura_nom
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

        if (estudiant) {
            sql += ` AND e.nom ILIKE $${paramIndex}`;
            params.push(`%${estudiant}%`);
            paramIndex++;
        }

        if (assignatura) {
            sql += ` AND ass.nom = $${paramIndex}`;
            params.push(assignatura);
            paramIndex++;
        }

        if (trimestre) {
            sql += ` AND a.trimestre = $${paramIndex}`;
            params.push(trimestre);
            paramIndex++;
        }

        if (assoliment) {
            sql += ` AND a.assoliment = $${paramIndex}`;
            params.push(assoliment);
            paramIndex++;
        }

        sql += ` ORDER BY e.nom, ass.nom, a.trimestre`;
        sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await query(sql, params);
        
        res.json({
            success: true,
            data: result.rows,
            total: result.rows.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('Error obtenint assoliments:', error);
        res.status(500).json({
            success: false,
            error: 'Error obtenint els assoliments',
            message: error.message
        });
    }
});

// GET /api/assoliments/estudiant/:id - Obtenir assoliments d'un estudiant específic
router.get('/estudiant/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await query(`
            SELECT 
                a.id,
                a.trimestre,
                a.assoliment,
                a.valor_numeric,
                ass.nom as assignatura_nom
            FROM assoliments a
            JOIN assignatures ass ON a.assignatura_id = ass.id
            WHERE a.estudiant_id = $1
            ORDER BY ass.nom, a.trimestre
        `, [id]);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error obtenint assoliments de l\'estudiant:', error);
        res.status(500).json({
            success: false,
            error: 'Error obtenint els assoliments de l\'estudiant',
            message: error.message
        });
    }
});

// GET /api/assoliments/assignatura/:nom - Obtenir assoliments d'una assignatura
router.get('/assignatura/:nom', async (req, res) => {
    try {
        const { nom } = req.params;
        const { classe, trimestre } = req.query;
        
        let sql = `
            SELECT 
                a.id,
                a.trimestre,
                a.assoliment,
                a.valor_numeric,
                e.nom as estudiant_nom,
                e.classe
            FROM assoliments a
            JOIN estudiants e ON a.estudiant_id = e.id
            JOIN assignatures ass ON a.assignatura_id = ass.id
            WHERE ass.nom = $1
        `;
        
        const params = [nom];
        let paramIndex = 2;

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

        sql += ` ORDER BY e.nom, a.trimestre`;

        const result = await query(sql, params);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error obtenint assoliments de l\'assignatura:', error);
        res.status(500).json({
            success: false,
            error: 'Error obtenint els assoliments de l\'assignatura',
            message: error.message
        });
    }
});

// GET /api/assoliments/stats - Estadístiques completes de la base de dades
router.get('/stats', async (req, res) => {
    try {
        console.log('📊 Obtenint estadístiques completes...');
        
        // Comptar registres a cada taula
        const estudiantsResult = await query('SELECT COUNT(*) as total FROM estudiants');
        const assignaturesResult = await query('SELECT COUNT(*) as total FROM assignatures');
        const assolimentsResult = await query('SELECT COUNT(*) as total FROM assoliments');
        
        // Obtenir llista d'estudiants
        const estudiantsList = await query('SELECT nom, classe FROM estudiants ORDER BY nom');
        
        // Obtenir llista d'assignatures
        const assignaturesList = await query('SELECT nom FROM assignatures ORDER BY nom');
        
        // Obtenir estadístiques per classe
        const statsPerClasse = await query(`
            SELECT 
                e.classe,
                COUNT(DISTINCT e.id) as total_estudiants,
                COUNT(a.id) as total_assoliments
            FROM estudiants e
            LEFT JOIN assoliments a ON e.id = a.estudiant_id
            GROUP BY e.classe
            ORDER BY e.classe
        `);
        
        // Obtenir estadístiques per assignatura
        const statsPerAssignatura = await query(`
            SELECT 
                ass.nom as assignatura,
                COUNT(a.id) as total_assoliments
            FROM assignatures ass
            LEFT JOIN assoliments a ON ass.id = a.assignatura_id
            GROUP BY ass.nom
            ORDER BY ass.nom
        `);
        
        res.json({
            success: true,
            stats: {
                total_estudiants: parseInt(estudiantsResult.rows[0].total),
                total_assignatures: parseInt(assignaturesResult.rows[0].total),
                total_assoliments: parseInt(assolimentsResult.rows[0].total),
                estudiants: estudiantsList.rows,
                assignatures: assignaturesList.rows,
                per_classe: statsPerClasse.rows,
                per_assignatura: statsPerAssignatura.rows
            }
        });
        
    } catch (error) {
        console.error('Error obtenint estadístiques:', error);
        res.status(500).json({
            success: false,
            error: 'Error obtenint les estadístiques',
            message: error.message
        });
    }
});

// GET /api/assoliments/diagnostic - Diagnòstic de dades
router.get('/diagnostic', async (req, res) => {
    try {
        console.log('🔍 Executant diagnòstic de dades...');
        
        // Verificar dades a cada taula
        const estudiantsResult = await query('SELECT COUNT(*) as total FROM estudiants');
        const assignaturesResult = await query('SELECT COUNT(*) as total FROM assignatures');
        const assolimentsResult = await query('SELECT COUNT(*) as total FROM assoliments');
        
        // Verificar JOINs
        const joinResult = await query(`
            SELECT 
                COUNT(*) as total_joins,
                COUNT(e.nom) as estudiants_amb_nom,
                COUNT(ass.nom) as assignatures_amb_nom
            FROM assoliments a
            LEFT JOIN estudiants e ON a.estudiant_id = e.id
            LEFT JOIN assignatures ass ON a.assignatura_id = ass.id
        `);
        
        // Mostrar alguns exemples
        const exemplesResult = await query(`
            SELECT 
                a.id,
                a.trimestre,
                a.assoliment,
                e.nom as estudiant_nom,
                e.classe,
                ass.nom as assignatura_nom
            FROM assoliments a
            LEFT JOIN estudiants e ON a.estudiant_id = e.id
            LEFT JOIN assignatures ass ON a.assignatura_id = ass.id
            LIMIT 5
        `);
        
        const diagnostic = {
            estudiants: {
                total: parseInt(estudiantsResult.rows[0].total),
                mostra: await query('SELECT * FROM estudiants LIMIT 3')
            },
            assignatures: {
                total: parseInt(assignaturesResult.rows[0].total),
                mostra: await query('SELECT * FROM assignatures LIMIT 3')
            },
            assoliments: {
                total: parseInt(assolimentsResult.rows[0].total),
                mostra: await query('SELECT * FROM assoliments LIMIT 3')
            },
            joins: {
                total: parseInt(joinResult.rows[0].total_joins),
                estudiants_amb_nom: parseInt(joinResult.rows[0].estudiants_amb_nom),
                assignatures_amb_nom: parseInt(joinResult.rows[0].assignatures_amb_nom)
            },
            exemples: exemplesResult.rows
        };
        
        console.log('📊 Diagnòstic completat:', diagnostic);
        
        res.json({
            success: true,
            diagnostic: diagnostic
        });
        
    } catch (error) {
        console.error('Error en diagnòstic:', error);
        res.status(500).json({
            success: false,
            error: 'Error executant el diagnòstic',
            message: error.message
        });
    }
});

// POST /api/assoliments - Crear un nou assoliment
router.post('/', async (req, res) => {
    try {
        const { estudiant_id, assignatura_id, trimestre, assoliment } = req.body;

        // Validar dades
        if (!estudiant_id || !assignatura_id || !trimestre || !assoliment) {
            return res.status(400).json({
                success: false,
                error: 'Falten dades obligatòries'
            });
        }

        // Validar assoliment
        const assolimentsValids = ['NA', 'AS', 'AN', 'AE'];
        if (!assolimentsValids.includes(assoliment)) {
            return res.status(400).json({
                success: false,
                error: 'Assoliment no vàlid'
            });
        }

        // Calcular valor numèric
        const valorNumeric = assolimentsValids.indexOf(assoliment);

        const result = await run(`
            INSERT INTO assoliments (estudiant_id, assignatura_id, trimestre, assoliment, valor_numeric)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `, [estudiant_id, assignatura_id, trimestre, assoliment, valorNumeric]);

        res.json({
            success: true,
            data: { id: result.rows[0].id }
        });

    } catch (error) {
        console.error('Error creant assoliment:', error);
        res.status(500).json({
            success: false,
            error: 'Error creant l\'assoliment',
            message: error.message
        });
    }
});

// PUT /api/assoliments/:id - Actualitzar un assoliment
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { estudiant_id, assignatura_id, trimestre, assoliment } = req.body;

        // Validar dades
        if (!estudiant_id || !assignatura_id || !trimestre || !assoliment) {
            return res.status(400).json({
                success: false,
                error: 'Falten dades obligatòries'
            });
        }

        // Validar assoliment
        const assolimentsValids = ['NA', 'AS', 'AN', 'AE'];
        if (!assolimentsValids.includes(assoliment)) {
            return res.status(400).json({
                success: false,
                error: 'Assoliment no vàlid'
            });
        }

        // Calcular valor numèric
        const valorNumeric = assolimentsValids.indexOf(assoliment);

        const result = await run(`
            UPDATE assoliments 
            SET estudiant_id = $1, assignatura_id = $2, trimestre = $3, assoliment = $4, valor_numeric = $5
            WHERE id = $6
            RETURNING id
        `, [estudiant_id, assignatura_id, trimestre, assoliment, valorNumeric, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Assoliment no trobat'
            });
        }

        res.json({
            success: true,
            data: { id: result.rows[0].id }
        });

    } catch (error) {
        console.error('Error actualitzant assoliment:', error);
        res.status(500).json({
            success: false,
            error: 'Error actualitzant l\'assoliment',
            message: error.message
        });
    }
});

// DELETE /api/assoliments/:id - Eliminar un assoliment
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await run(`
            DELETE FROM assoliments 
            WHERE id = $1
            RETURNING id
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Assoliment no trobat'
            });
        }

        res.json({
            success: true,
            message: 'Assoliment eliminat correctament'
        });

    } catch (error) {
        console.error('Error eliminant assoliment:', error);
        res.status(500).json({
            success: false,
            error: 'Error eliminant l\'assoliment',
            message: error.message
        });
    }
});

module.exports = router;