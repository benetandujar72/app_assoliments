const express = require('express');
const router = express.Router();
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
                ass.codi as assignatura_codi,
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
            sql += ` AND ass.codi = $${paramIndex}`;
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
                ass.codi as assignatura_codi,
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

// GET /api/assoliments/assignatura/:codi - Obtenir assoliments d'una assignatura
router.get('/assignatura/:codi', async (req, res) => {
    try {
        const { codi } = req.params;
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
            WHERE ass.codi = $1
        `;
        
        const params = [codi];
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

// POST /api/assoliments - Crear un nou assoliment
router.post('/', async (req, res) => {
    try {
        const { estudiant_id, assignatura_id, trimestre, assoliment } = req.body;

        // Validacions
        if (!estudiant_id || !assignatura_id || !trimestre || !assoliment) {
            return res.status(400).json({
                success: false,
                error: 'Falten camps obligatoris'
            });
        }

        if (!['NA', 'AS', 'AN', 'AE'].includes(assoliment)) {
            return res.status(400).json({
                success: false,
                error: 'Valor d\'assoliment invàlid'
            });
        }

        const valorNumeric = { 'NA': 0, 'AS': 1, 'AN': 2, 'AE': 3 }[assoliment];

        const result = await query(`
            INSERT INTO assoliments (estudiant_id, assignatura_id, trimestre, assoliment, valor_numeric)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [estudiant_id, assignatura_id, trimestre, assoliment, valorNumeric]);

        res.status(201).json({
            success: true,
            data: result.rows[0]
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
        const { assoliment } = req.body;

        if (!assoliment || !['NA', 'AS', 'AN', 'AE'].includes(assoliment)) {
            return res.status(400).json({
                success: false,
                error: 'Valor d\'assoliment invàlid'
            });
        }

        const valorNumeric = { 'NA': 0, 'AS': 1, 'AN': 2, 'AE': 3 }[assoliment];

        const result = await query(`
            UPDATE assoliments 
            SET assoliment = $1, valor_numeric = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `, [assoliment, valorNumeric, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Assoliment no trobat'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
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

        const result = await query(`
            DELETE FROM assoliments 
            WHERE id = $1 
            RETURNING *
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