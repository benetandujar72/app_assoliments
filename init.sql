-- Script d'inicialització de la base de dades
-- Aquest fitxer s'executa automàticament quan es crea el contenedor PostgreSQL

-- Crear les taules necessàries
CREATE TABLE IF NOT EXISTS estudiants (
    id SERIAL PRIMARY KEY,
    classe VARCHAR(10) NOT NULL,
    nom VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assignatures (
    id SERIAL PRIMARY KEY,
    codi VARCHAR(10) NOT NULL UNIQUE,
    nom VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assoliments (
    id SERIAL PRIMARY KEY,
    estudiant_id INTEGER REFERENCES estudiants(id) ON DELETE CASCADE,
    assignatura_id INTEGER REFERENCES assignatures(id) ON DELETE CASCADE,
    trimestre VARCHAR(20) NOT NULL,
    assoliment VARCHAR(2) NOT NULL CHECK (assoliment IN ('NA', 'AS', 'AN', 'AE')),
    valor_numeric INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índexs per millorar el rendiment
CREATE INDEX IF NOT EXISTS idx_estudiants_classe ON estudiants(classe);
CREATE INDEX IF NOT EXISTS idx_assoliments_estudiant ON assoliments(estudiant_id);
CREATE INDEX IF NOT EXISTS idx_assoliments_assignatura ON assoliments(assignatura_id);
CREATE INDEX IF NOT EXISTS idx_assoliments_trimestre ON assoliments(trimestre);
CREATE INDEX IF NOT EXISTS idx_assoliments_assoliment ON assoliments(assoliment);

-- Inserir assignatures per defecte
INSERT INTO assignatures (codi, nom) VALUES 
    ('LIN', 'Català'),
    ('ANG', 'Anglès'),
    ('FRA', 'Francès'),
    ('MAT', 'Matemàtiques'),
    ('MUS', 'Música'),
    ('EC', 'Espai Creatiu'),
    ('FIS', 'Educació Física'),
    ('EG', 'Espai Globalitzat')
ON CONFLICT (codi) DO NOTHING; 