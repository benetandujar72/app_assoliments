const express = require('express');
const router = express.Router();
const { query, run } = require('../database/db.js');

// GET /api/estudiants - Obtenir tots els estudiants amb filtres
router.get('/', async (req, res) => {
    try {
        const { classe, nom, limit = 100, offset = 0 } = req.query;

        let sql = `
            SELECT 
                e.id,
                e.nom,
                e.classe,
                e.created_at,
                e.updated_at,
                COUNT(a.id) as total_assoliments,
                AVG(a.valor_numeric) as mitjana_assoliments
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

        if (nom) {
            sql += ` AND e.nom ILIKE $${paramIndex}`;
            params.push(`%${nom}%`);
            paramIndex++;
        }

        sql += ` GROUP BY e.id, e.nom, e.classe, e.created_at, e.updated_at`;
        sql += ` ORDER BY e.nom`;
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
        console.error('Error obtenint estudiants:', error);
        res.status(500).json({
            success: false,
            error: 'Error obtenint els estudiants',
            message: error.message
        });
    }
});

// GET /api/estudiants/classes - Obtener lista de clases únicas
router.get('/classes', async (req, res) => {
    try {
        const result = await query('SELECT DISTINCT classe FROM estudiants ORDER BY classe');
        res.json({
            success: true,
            data: result.rows.map(r => r.classe)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error obtenint les classes',
            message: error.message
        });
    }
});

// GET /api/estudiants/:id - Obtenir un estudiant específic
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            SELECT 
                e.id,
                e.nom,
                e.classe,
                e.created_at,
                e.updated_at,
                COUNT(a.id) as total_assoliments,
                AVG(a.valor_numeric) as mitjana_assoliments
            FROM estudiants e
            LEFT JOIN assoliments a ON e.id = a.estudiant_id
            WHERE e.id = $1
            GROUP BY e.id, e.nom, e.classe, e.created_at, e.updated_at
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Estudiant no trobat'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error obtenint estudiant:', error);
        res.status(500).json({
            success: false,
            error: 'Error obtenint l\'estudiant',
            message: error.message
        });
    }
});

// GET /api/estudiants/classe/:classe - Obtenir estudiants d'una classe específica
router.get('/classe/:classe', async (req, res) => {
    try {
        const { classe } = req.params;
        const { limit = 100, offset = 0 } = req.query;

        const result = await query(`
            SELECT 
                e.id,
                e.nom,
                e.classe,
                e.created_at,
                e.updated_at,
                COUNT(a.id) as total_assoliments,
                AVG(a.valor_numeric) as mitjana_assoliments
            FROM estudiants e
            LEFT JOIN assoliments a ON e.id = a.estudiant_id
            WHERE e.classe = $1
            GROUP BY e.id, e.nom, e.classe, e.created_at, e.updated_at
            ORDER BY e.nom
            LIMIT $2 OFFSET $3
        `, [classe, parseInt(limit), parseInt(offset)]);

        res.json({
            success: true,
            data: result.rows,
            total: result.rows.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('Error obtenint estudiants de la classe:', error);
        res.status(500).json({
            success: false,
            error: 'Error obtenint els estudiants de la classe',
            message: error.message
        });
    }
});

// POST /api/estudiants - Crear un nou estudiant
router.post('/', async (req, res) => {
    try {
        const { nom, classe } = req.body;

        // Validacions
        if (!nom || !classe) {
            return res.status(400).json({
                success: false,
                error: 'El nom i la classe són obligatoris'
            });
        }

        // Verificar si l'estudiant ja existeix
        const existingStudent = await query(`
            SELECT id FROM estudiants WHERE nom = $1 AND classe = $2
        `, [nom, classe]);

        if (existingStudent.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'L\'estudiant ja existeix en aquesta classe'
            });
        }

        const result = await query(`
            INSERT INTO estudiants (nom, classe)
            VALUES ($1, $2)
            RETURNING *
        `, [nom, classe]);

        res.status(201).json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error creant estudiant:', error);
        res.status(500).json({
            success: false,
            error: 'Error creant l\'estudiant',
            message: error.message
        });
    }
});

// PUT /api/estudiants/:id - Actualitzar un estudiant
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, classe } = req.body;

        if (!nom || !classe) {
            return res.status(400).json({
                success: false,
                error: 'El nom i la classe són obligatoris'
            });
        }

        const result = await query(`
            UPDATE estudiants 
            SET nom = $1, classe = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `, [nom, classe, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Estudiant no trobat'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error actualitzant estudiant:', error);
        res.status(500).json({
            success: false,
            error: 'Error actualitzant l\'estudiant',
            message: error.message
        });
    }
});

// DELETE /api/estudiants/:id - Eliminar un estudiant
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            DELETE FROM estudiants 
            WHERE id = $1 
            RETURNING *
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Estudiant no trobat'
            });
        }

        res.json({
            success: true,
            message: 'Estudiant eliminat correctament'
        });

    } catch (error) {
        console.error('Error eliminant estudiant:', error);
        res.status(500).json({
            success: false,
            error: 'Error eliminant l\'estudiant',
            message: error.message
        });
    }
});

// GET /api/estudiants/estadistiques/resum - Obtenir estadístiques generals dels estudiants
router.get('/estadistiques/resum', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                COUNT(DISTINCT e.id) as total_estudiants,
                COUNT(DISTINCT e.classe) as total_classes,
                AVG(avg_assoliments.mitjana) as mitjana_general,
                MIN(avg_assoliments.mitjana) as mitjana_minima,
                MAX(avg_assoliments.mitjana) as mitjana_maxima
            FROM estudiants e
            LEFT JOIN (
                SELECT 
                    estudiant_id,
                    AVG(valor_numeric) as mitjana
                FROM assoliments
                GROUP BY estudiant_id
            ) avg_assoliments ON e.id = avg_assoliments.estudiant_id
        `);

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error obtenint estadístiques dels estudiants:', error);
        res.status(500).json({
            success: false,
            error: 'Error obtenint les estadístiques dels estudiants',
            message: error.message
        });
    }
});

module.exports = router; 