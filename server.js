const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: './config.env' });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguretat
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrcAttr: ["'unsafe-inline'"], // Permetir event handlers inline
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    }
}));

// Rate limiting - Configuració per producció
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minuts
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // límit per IP
    message: {
        error: 'Massa peticions des d\'aquesta IP, si us plau torna-ho a provar més tard.'
    },
    // Configuració per producció amb proxy
    standardHeaders: true,
    legacyHeaders: false,
    // Deshabilitar X-Forwarded-For en producció per evitar errors
    skip: (req) => {
        // En producció, confiar en el proxy de Render
        return process.env.NODE_ENV === 'production';
    }
});

// Aplicar rate limiting només en desenvolupament
if (process.env.NODE_ENV === 'development') {
    app.use('/api/', limiter);
}

// Middleware general
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir fitxers estàtics
app.use(express.static('.'));

// Routes API
app.use('/api/assoliments', require('./routes/assoliments'));
app.use('/api/estudiants', require('./routes/estudiants'));
app.use('/api/assignatures', require('./routes/assignatures'));
app.use('/api/estadistiques', require('./routes/estadistiques'));
app.use('/api/upload', require('./routes/upload'));

// Ruta de prova per verificar connexió
app.get('/api/health', async (req, res) => {
    try {
        const { query } = require('./database/db.js');
        const result = await query('SELECT NOW() as current_time');
        res.json({
            success: true,
            message: 'Servidor funcionant correctament',
            database: 'PostgreSQL',
            timestamp: result.rows[0].current_time,
            environment: process.env.NODE_ENV,
            dbHost: process.env.DB_HOST
        });
    } catch (error) {
        console.error('❌ Error en health check:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error de connexió amb la base de dades',
            message: error.message,
            environment: process.env.NODE_ENV,
            dbHost: process.env.DB_HOST
        });
    }
});

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta de debug
app.get('/debug', (req, res) => {
    res.sendFile(path.join(__dirname, 'debug.html'));
});

// Ruta de versió simplificada
app.get('/simple', (req, res) => {
    res.sendFile(path.join(__dirname, 'index-simple.html'));
});

// Middleware d'error handling
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        error: 'Error intern del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Alguna cosa ha anat malament'
    });
});

// Ruta 404
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Ruta no trobada',
        message: 'La ruta sol·licitada no existeix'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor executant-se al port ${PORT}`);
    console.log(`📊 Dashboard d'assoliments disponible a: http://localhost:${PORT}`);
    console.log(`🔧 Mode: ${process.env.NODE_ENV}`);
});

module.exports = app; 