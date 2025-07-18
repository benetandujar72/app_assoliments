const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { query, run } = require('../database/db.js');

// Configuració de multer per pujar fitxers
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'assoliments-' + uniqueSuffix + '.csv');
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Només es permeten fitxers CSV'), false);
        }
    }
});

// Funció per processar el CSV manualment
function processCSVFile(filePath) {
    return new Promise((resolve, reject) => {
        try {
            const results = [];
            let lineNumber = 0;
            
            // Llegir el fitxer línia per línia
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const lines = fileContent.split('\n');
            
            console.log(`📁 Total de línies al fitxer: ${lines.length}`);
            
            // Saltar la primera línia (títols)
            // La segona línia són les capçaleres
            const headers = lines[1].split(',').map(h => h.trim());
            console.log('📋 Capçaleres detectades:', headers);
            console.log('📋 Nombre de capçaleres:', headers.length);
            
            // Processar les línies de dades (a partir de la línia 3)
            for (let i = 2; i < lines.length; i++) {
                lineNumber = i + 1;
                const line = lines[i].trim();
                
                if (!line) continue;
                
                console.log(`🔍 Processant línia ${lineNumber}: ${line.substring(0, 100)}...`);
                
                // Eliminar les comilles externes de tota la línia
                let cleanLine = line;
                if (cleanLine.startsWith('"') && cleanLine.endsWith('"')) {
                    cleanLine = cleanLine.slice(1, -1);
                }
                
                // Separar els camps per comes, però respectant les comilles internes
                const fields = [];
                let currentField = '';
                let inQuotes = false;
                
                for (let j = 0; j < cleanLine.length; j++) {
                    const char = cleanLine[j];
                    
                    if (char === '"') {
                        if (inQuotes && cleanLine[j + 1] === '"') {
                            // Comilla escapada
                            currentField += '"';
                            j++; // Saltar la següent comilla
                        } else {
                            // Iniciar o finalitzar comilles
                            inQuotes = !inQuotes;
                        }
                    } else if (char === ',' && !inQuotes) {
                        // Final de camp
                        fields.push(currentField.trim());
                        currentField = '';
                    } else {
                        currentField += char;
                    }
                }
                
                // Afegir l'últim camp
                fields.push(currentField.trim());
                
                console.log(`📊 Línia ${lineNumber} - Camps trobats: ${fields.length}`);
                console.log(`📊 Primer camp (CLASSE): "${fields[0]}"`);
                console.log(`📊 Segon camp (NOM): "${fields[1]}"`);
                
                // Verificar que tenim suficients camps
                if (fields.length >= 2) {
                    const classe = fields[0];
                    const nomComplet = fields[1].replace(/^["']|["']$/g, '').trim();
                    
                    // Verificar que tenim CLASSE i NOM
                    if (classe && nomComplet && classe !== '' && nomComplet !== '') {
                        // Crear objecte amb les dades netes
                        const cleanData = {
                            CLASSE: classe,
                            NOM: nomComplet,
                            LIN1: fields[2] || 'N/A',
                            LIN2: fields[3] || 'N/A',
                            LIN3: fields[4] || 'N/A',
                            LINF: fields[5] || 'N/A',
                            ANG1: fields[6] || 'N/A',
                            ANG2: fields[7] || 'N/A',
                            ANG3: fields[8] || 'N/A',
                            ANGF: fields[9] || 'N/A',
                            FRA1: fields[10] || 'N/A',
                            FRA2: fields[11] || 'N/A',
                            FRA3: fields[12] || 'N/A',
                            FRAF: fields[13] || 'N/A',
                            MAT1: fields[14] || 'N/A',
                            MAT2: fields[15] || 'N/A',
                            MAT3: fields[16] || 'N/A',
                            MATF: fields[17] || 'N/A',
                            MUS1: fields[18] || 'N/A',
                            MUS2: fields[19] || 'N/A',
                            MUS3: fields[20] || 'N/A',
                            MUSF: fields[21] || 'N/A',
                            EC1: fields[22] || 'N/A',
                            EC2: fields[23] || 'N/A',
                            EC3: fields[24] || 'N/A',
                            ECF: fields[25] || 'N/A',
                            FIS1: fields[26] || 'N/A',
                            FIS2: fields[27] || 'N/A',
                            FIS3: fields[28] || 'N/A',
                            FISF: fields[29] || 'N/A',
                            EG0: fields[30] || 'N/A',
                            EG1: fields[31] || 'N/A',
                            EX1: fields[32] || 'N/A',
                            EG2: fields[33] || 'N/A',
                            EX2: fields[34] || 'N/A',
                            EG3: fields[35] || 'N/A',
                            EG4: fields[36] || 'N/A',
                            EGF: fields[37] || 'N/A',
                            APRE: fields[38] || 'N/A',
                            AUTON: fields[39] || 'N/A',
                            DIG: fields[40] || 'N/A',
                            '1r trim': fields[41] || 'N/A',
                            '2n trim': fields[42] || 'N/A',
                            '3r trim': fields[43] || 'N/A',
                            FINAL: fields[44] || 'N/A',
                            R: fields[45] || 'N/A',
                            Rj: fields[46] || 'N/A',
                            F: fields[47] || 'N/A',
                            Fj: fields[48] || 'N/A',
                            TRA: fields[49] || 'N/A'
                        };
                        
                        results.push(cleanData);
                        console.log(`✅ Fila ${lineNumber} processada: ${classe} - ${nomComplet}`);
                    } else {
                        console.log(`⚠️ Saltant fila ${lineNumber}: CLASSE o NOM buits (CLASSE='${classe}', NOM='${nomComplet}')`);
                    }
                } else {
                    console.log(`⚠️ Saltant fila ${lineNumber}: No hi ha suficients camps (${fields.length})`);
                }
            }
            
            console.log(`📊 Total de files processades: ${results.length}`);
            resolve(results);
        } catch (error) {
            console.error('❌ Error en el parser manual:', error);
            reject(error);
        }
    });
}

// Ruta per pujar fitxer CSV
router.post('/csv', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No s\'ha rebut cap fitxer'
            });
        }

        console.log(`📁 Fitxer rebut: ${req.file.originalname}`);
        const filePath = req.file.path;

        // Processar el CSV
        const data = await processCSVFile(filePath);
        
        if (data.length === 0) {
            fs.unlinkSync(filePath);
            return res.status(400).json({
                success: false,
                error: 'No s\'han trobat dades vàlides al fitxer'
            });
        }

        console.log(`📊 ${data.length} files de dades processades`);

        // Eliminar dades existents
        await query('DELETE FROM assoliments');
        await query('DELETE FROM estudiants');
        console.log('🗑️ Dades existents eliminades');

        // Inserir noves dades
        let insertedStudents = 0;
        let insertedAssoliments = 0;

        for (const row of data) {
            try {
                // Inserir estudiant
                let studentId;
                
                // Primer, verificar si l'estudiant ja existeix
                const existingStudent = await query(`
                    SELECT id FROM estudiants WHERE classe = $1 AND nom = $2
                `, [row.CLASSE, row.NOM]);
                
                if (existingStudent.rows && existingStudent.rows.length > 0) {
                    // L'estudiant ja existeix
                    studentId = existingStudent.rows[0].id;
                } else {
                    // Inserir nou estudiant
                    const studentResult = await query(`
                        INSERT INTO estudiants (classe, nom) 
                        VALUES ($1, $2) 
                        RETURNING id
                    `, [row.CLASSE, row.NOM]);
                    
                    studentId = studentResult.rows[0].id;
                    insertedStudents++;
                }

                // Definir les assignatures i els seus trimestres
                const assignatures = [
                    { codi: 'LIN', nom: 'Català', camps: ['LIN1', 'LIN2', 'LIN3', 'LINF'] },
                    { codi: 'ANG', nom: 'Anglès', camps: ['ANG1', 'ANG2', 'ANG3', 'ANGF'] },
                    { codi: 'FRA', nom: 'Francès', camps: ['FRA1', 'FRA2', 'FRA3', 'FRAF'] },
                    { codi: 'MAT', nom: 'Matemàtiques', camps: ['MAT1', 'MAT2', 'MAT3', 'MATF'] },
                    { codi: 'MUS', nom: 'Música', camps: ['MUS1', 'MUS2', 'MUS3', 'MUSF'] },
                    { codi: 'EC', nom: 'Espai Creatiu', camps: ['EC1', 'EC2', 'EC3', 'ECF'] },
                    { codi: 'FIS', nom: 'Educació Física', camps: ['FIS1', 'FIS2', 'FIS3', 'FISF'] },
                    { codi: 'EG', nom: 'Espai Globalitzat', camps: ['EG1', 'EX1', 'EG2', 'EX2', 'EG3', 'EG4', 'EGF'] }
                ];

                // Inserir assoliments per cada assignatura
                for (const assignatura of assignatures) {
                    // Obtenir l'ID de l'assignatura
                    const assignaturaResult = await query(`
                        SELECT id FROM assignatures WHERE codi = $1
                    `, [assignatura.codi]);
                    
                    if (assignaturaResult.rows.length === 0) {
                        console.log(`⚠️ Assignatura ${assignatura.codi} no trobada, saltant...`);
                        continue;
                    }
                    
                    const assignaturaId = assignaturaResult.rows[0].id;
                    
                    // Processar cada trimestre
                    for (let i = 0; i < assignatura.camps.length; i++) {
                        const camp = assignatura.camps[i];
                        const assoliment = row[camp] || 'N/A';
                        
                        // Saltar si l'assoliment és buit o N/A
                        if (!assoliment || assoliment === 'N/A' || assoliment.trim() === '') {
                            continue;
                        }
                        
                        // Validar que l'assoliment sigui de 2 caràcters màxim
                        const assolimentNet = assoliment.trim().substring(0, 2).toUpperCase();
                        
                        // Saltar si no és un valor vàlid
                        if (!['NA', 'AS', 'AN', 'AE'].includes(assolimentNet)) {
                            console.log(`⚠️ Valor d'assoliment invàlid per ${row.NOM} - ${assignatura.nom}: ${assoliment} (convertit a ${assolimentNet})`);
                            continue;
                        }
                        
                        // Determinar el trimestre segons el camp
                        let trimestre;
                        
                        console.log(`📝 Processant: ${row.NOM} - ${assignatura.nom} - ${camp} = ${assolimentNet}`);
                        if (assignatura.codi === 'EG') {
                            // Per Espai Globalitzat, els trimestres són especials
                            if (camp === 'EG1' || camp === 'EX1') {
                                trimestre = '1r trim';
                            } else if (camp === 'EG2' || camp === 'EX2') {
                                trimestre = '2n trim';
                            } else if (camp === 'EG3' || camp === 'EG4') {
                                trimestre = '3r trim';
                            } else if (camp === 'EGF') {
                                trimestre = 'final';
                            } else {
                                trimestre = '3r trim'; // Per defecte
                            }
                        } else {
                            // Per les altres assignatures: LIN1=1r trim, LIN2=2n trim, LIN3=3r trim, LINF=final
                            if (camp.endsWith('1')) {
                                trimestre = '1r trim';
                            } else if (camp.endsWith('2')) {
                                trimestre = '2n trim';
                            } else if (camp.endsWith('3')) {
                                trimestre = '3r trim';
                            } else if (camp.endsWith('F')) {
                                trimestre = 'final';
                            } else {
                                trimestre = 'final'; // Per defecte
                            }
                        }
                        
                        console.log(`📝 Trimestre determinat: ${trimestre}`);
                        // Convertir assoliment a valor numèric
                        const valorNumeric = { 'NA': 0, 'AS': 1, 'AN': 2, 'AE': 3 }[assolimentNet];
                        
                        // Inserir l'assoliment
                        await query(`
                            INSERT INTO assoliments (estudiant_id, assignatura_id, trimestre, assoliment, valor_numeric)
                            VALUES ($1, $2, $3, $4, $5)
                            ON CONFLICT (estudiant_id, assignatura_id, trimestre) 
                            DO UPDATE SET 
                                assoliment = EXCLUDED.assoliment,
                                valor_numeric = EXCLUDED.valor_numeric,
                                updated_at = CURRENT_TIMESTAMP
                        `, [studentId, assignaturaId, trimestre, assolimentNet, valorNumeric]);
                        
                        insertedAssoliments++;
                    }
                }
            } catch (error) {
                console.error(`❌ Error inserint fila ${row.CLASSE} - ${row.NOM}:`, error.message);
            }
        }

        // Eliminar el fitxer temporal
        fs.unlinkSync(filePath);

        console.log(`✅ ${insertedStudents} estudiants inserits`);
        console.log(`✅ ${insertedAssoliments} assoliments inserits`);

        res.json({
            success: true,
            message: `S'han processat ${data.length} files correctament`,
            data: {
                totalFiles: data.length,
                insertedStudents,
                insertedAssoliments
            }
        });

    } catch (error) {
        console.error('❌ Error processant el fitxer:', error);
        
        // Eliminar el fitxer temporal si existeix
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            error: 'Error processant el fitxer: ' + error.message
        });
    }
});

// GET /api/upload/status - Obtenir estat de la càrrega
router.get('/status', async (req, res) => {
    try {
        const stats = await query(`
            SELECT 
                COUNT(DISTINCT e.id) as total_estudiants,
                COUNT(DISTINCT a.id) as total_assoliments,
                COUNT(DISTINCT e.classe) as total_classes,
                COUNT(DISTINCT ass.id) as total_assignatures
            FROM estudiants e
            LEFT JOIN assoliments a ON e.id = a.estudiant_id
            CROSS JOIN assignatures ass
        `);

        res.json({
            success: true,
            data: stats.rows[0]
        });

    } catch (error) {
        console.error('Error obtenint estat:', error);
        res.status(500).json({
            success: false,
            error: 'Error obtenint l\'estat',
            message: error.message
        });
    }
});

// POST /api/upload/clear - Netejar totes les dades
router.post('/clear', async (req, res) => {
    try {
        await query('DELETE FROM assoliments');
        await query('DELETE FROM estudiants');
        
        res.json({
            success: true,
            message: 'Totes les dades han estat eliminades'
        });

    } catch (error) {
        console.error('Error netejant dades:', error);
        res.status(500).json({
            success: false,
            error: 'Error netejant les dades',
            message: error.message
        });
    }
});

// Middleware d'error per multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'El fitxer és massa gran. El límit és 10MB.'
            });
        }
    }
    
    if (error.message.includes('CSV')) {
        return res.status(400).json({
            success: false,
            error: 'Només es permeten fitxers CSV'
        });
    }
    
    next(error);
});

module.exports = router; 