-- Script per crear la base de dades d'assoliments
-- Executar com: psql -U postgres -f scripts/create-database.sql

-- Crear la base de dades si no existeix
SELECT 'CREATE DATABASE assoliments_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'assoliments_db')\gexec

-- Conectar a la base de dades
\c assoliments_db;

-- Crear extensió per UUID si no existeix
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear taula d'estudiants
CREATE TABLE IF NOT EXISTS estudiants (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    classe VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear taula d'assignatures
CREATE TABLE IF NOT EXISTS assignatures (
    id SERIAL PRIMARY KEY,
    codi VARCHAR(10) UNIQUE NOT NULL,
    nom VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear taula d'assoliments
CREATE TABLE IF NOT EXISTS assoliments (
    id SERIAL PRIMARY KEY,
    estudiant_id INTEGER REFERENCES estudiants(id) ON DELETE CASCADE,
    assignatura_id INTEGER REFERENCES assignatures(id) ON DELETE CASCADE,
    trimestre VARCHAR(10) NOT NULL,
    assoliment VARCHAR(2) NOT NULL CHECK (assoliment IN ('NA', 'AS', 'AN', 'AE')),
    valor_numeric INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(estudiant_id, assignatura_id, trimestre)
);

-- Crear índexs per millorar rendiment
CREATE INDEX IF NOT EXISTS idx_assoliments_estudiant ON assoliments(estudiant_id);
CREATE INDEX IF NOT EXISTS idx_assoliments_assignatura ON assoliments(assignatura_id);
CREATE INDEX IF NOT EXISTS idx_assoliments_trimestre ON assoliments(trimestre);
CREATE INDEX IF NOT EXISTS idx_estudiants_classe ON estudiants(classe);

-- Inserir assignatures per defecte
INSERT INTO assignatures (codi, nom) VALUES
    ('LIN', 'Llengua'),
    ('ANG', 'Anglès'),
    ('FRA', 'Francès'),
    ('MAT', 'Matemàtiques'),
    ('MUS', 'Música'),
    ('EC', 'Espai Creatiu'),
    ('FIS', 'Educació Física'),
    ('EG', 'Espai Globalitzat')
ON CONFLICT (codi) DO NOTHING;

-- Mostrar missatge de confirmació
SELECT 'Base de dades assoliments_db creada correctament!' as message; 