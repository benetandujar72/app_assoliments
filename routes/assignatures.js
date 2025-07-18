const express = require('express');
const router = express.Router();

// Verificar variables d'entorn abans d'importar la base de dades
console.log('🔧 Verificant configuració de base de dades en assignatures.js...');
console.log(`📍 DB_HOST: ${process.env.DB_HOST || 'NO CONFIGURAT'}`);
console.log(`🗄️ DB_NAME: ${process.env.DB_NAME || 'NO CONFIGURAT'}`);
console.log(`👤 DB_USER: ${process.env.DB_USER || 'NO CONFIGURAT'}`);
console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

const { query, run } = require('../database/db.js');

// GET /api/assignatures - Obtenir totes les assignatures
router.get('/', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                id,
                codi,
                nom,
                created_at
            FROM assignatures
            ORDER BY nom
        `);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error obtenint assignatures:', error);
        res.status(500).json({
            success: false,
            error: 'Error obtenint les assignatures',
            message: error.message
        });
    }
});

// GET /api/assignatures/:id - Obtenir una assignatura específica
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            SELECT 
                id,
                codi,
                nom,
                created_at
            FROM assignatures
            WHERE id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Assignatura no trobada'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error obtenint assignatura:', error);
        res.status(500).json({
            success: false,
            error: 'Error obtenint l\'assignatura',
            message: error.message
        });
    }
});

// GET /api/assignatures/codi/:codi - Obtenir assignatura per codi
router.get('/codi/:codi', async (req, res) => {
    try {
        const { codi } = req.params;

        const result = await query(`
            SELECT 
                id,
                codi,
                nom,
                created_at
            FROM assignatures
            WHERE codi = $1
        `, [codi]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Assignatura no trobada'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error obtenint assignatura per codi:', error);
        res.status(500).json({
            success: false,
            error: 'Error obtenint l\'assignatura',
            message: error.message
        });
    }
});

// POST /api/assignatures - Crear una nova assignatura
router.post('/', async (req, res) => {
    try {
        const { codi, nom } = req.body;

        // Validacions
        if (!codi || !nom) {
            return res.status(400).json({
                success: false,
                error: 'El codi i el nom són obligatoris'
            });
        }

        // Verificar si l'assignatura ja existeix
        const existingSubject = await query(`
            SELECT id FROM assignatures WHERE codi = $1
        `, [codi]);

        if (existingSubject.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'L\'assignatura ja existeix'
            });
        }

        const result = await query(`
            INSERT INTO assignatures (codi, nom)
            VALUES ($1, $2)
            RETURNING *
        `, [codi, nom]);

        res.status(201).json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error creant assignatura:', error);
        res.status(500).json({
            success: false,
            error: 'Error creant l\'assignatura',
            message: error.message
        });
    }
});

// PUT /api/assignatures/:id - Actualitzar una assignatura
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { codi, nom } = req.body;

        if (!codi || !nom) {
            return res.status(400).json({
                success: false,
                error: 'El codi i el nom són obligatoris'
            });
        }

        const result = await query(`
            UPDATE assignatures 
            SET codi = $1, nom = $2
            WHERE id = $3
            RETURNING *
        `, [codi, nom, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Assignatura no trobada'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error actualitzant assignatura:', error);
        res.status(500).json({
            success: false,
            error: 'Error actualitzant l\'assignatura',
            message: error.message
        });
    }
});

// DELETE /api/assignatures/:id - Eliminar una assignatura
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si hi ha assoliments associats
        const assolimentsCount = await query(`
            SELECT COUNT(*) as count FROM assoliments WHERE assignatura_id = $1
        `, [id]);

        if (parseInt(assolimentsCount.rows[0].count) > 0) {
            return res.status(400).json({
                success: false,
                error: 'No es pot eliminar l\'assignatura perquè té assoliments associats'
            });
        }

        const result = await query(`
            DELETE FROM assignatures 
            WHERE id = $1 
            RETURNING *
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Assignatura no trobada'
            });
        }

        res.json({
            success: true,
            message: 'Assignatura eliminada correctament'
        });

    } catch (error) {
        console.error('Error eliminant assignatura:', error);
        res.status(500).json({
            success: false,
            error: 'Error eliminant l\'assignatura',
            message: error.message
        });
    }
});

// GET /api/assignatures/estadistiques/rendiment - Obtenir estadístiques de rendiment per assignatura
router.get('/estadistiques/rendiment', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                ass.id,
                ass.codi,
                ass.nom,
                COUNT(a.id) as total_assoliments,
                AVG(a.valor_numeric) as mitjana_assoliments,
                COUNT(CASE WHEN a.assoliment = 'AE' THEN 1 END) as excelents,
                COUNT(CASE WHEN a.assoliment = 'AN' THEN 1 END) as notables,
                COUNT(CASE WHEN a.assoliment = 'AS' THEN 1 END) as suficients,
                COUNT(CASE WHEN a.assoliment = 'NA' THEN 1 END) as no_assoliments
            FROM assignatures ass
            LEFT JOIN assoliments a ON ass.id = a.assignatura_id
            GROUP BY ass.id, ass.codi, ass.nom
            ORDER BY ass.nom
        `);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error obtenint estadístiques de rendiment:', error);
        res.status(500).json({
            success: false,
            error: 'Error obtenint les estadístiques de rendiment',
            message: error.message
        });
    }
});

// GET /api/assignatures/estadistiques/trimestre - Obtenir estadístiques per trimestre
router.get('/estadistiques/trimestre', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                ass.codi,
                ass.nom,
                a.trimestre,
                COUNT(a.id) as total_assoliments,
                AVG(a.valor_numeric) as mitjana_assoliments,
                COUNT(CASE WHEN a.assoliment = 'AE' THEN 1 END) as excelents,
                COUNT(CASE WHEN a.assoliment = 'AN' THEN 1 END) as notables,
                COUNT(CASE WHEN a.assoliment = 'AS' THEN 1 END) as suficients,
                COUNT(CASE WHEN a.assoliment = 'NA' THEN 1 END) as no_assoliments
            FROM assignatures ass
            LEFT JOIN assoliments a ON ass.id = a.assignatura_id
            GROUP BY ass.id, ass.codi, ass.nom, a.trimestre
            ORDER BY ass.nom, a.trimestre
        `);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error obtenint estadístiques per trimestre:', error);
        res.status(500).json({
            success: false,
            error: 'Error obtenint les estadístiques per trimestre',
            message: error.message
        });
    }
});

module.exports = router; 