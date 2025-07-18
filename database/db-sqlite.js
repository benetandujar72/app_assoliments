const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Crear connexió a SQLite
const dbPath = path.join(__dirname, '../data/assoliments.db');
const db = new sqlite3.Database(dbPath);

// Crear directori data si no existeix
const fs = require('fs');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

console.log('🔌 Connexió a SQLite establerta');

// Funció per executar queries
const query = async (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                console.error('❌ Error executant query:', err);
                reject(err);
            } else {
                console.log(`📊 Query executada:`, sql.substring(0, 50) + '...');
                resolve({ rows });
            }
        });
    });
};

// Funció per executar una sola fila
const queryOne = async (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                console.error('❌ Error executant query:', err);
                reject(err);
            } else {
                console.log(`📊 Query executada:`, sql.substring(0, 50) + '...');
                resolve({ rows: row ? [row] : [] });
            }
        });
    });
};

// Funció per executar queries d'inserció/actualització
const run = async (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                console.error('❌ Error executant query:', err);
                reject(err);
            } else {
                console.log(`📊 Query executada:`, sql.substring(0, 50) + '...');
                resolve({ 
                    rows: [{ id: this.lastID }],
                    rowCount: this.changes 
                });
            }
        });
    });
};

module.exports = {
    query,
    queryOne,
    run,
    db
}; 