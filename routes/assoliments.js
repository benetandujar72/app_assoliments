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