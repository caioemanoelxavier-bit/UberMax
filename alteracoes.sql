-- =========================================================
-- UberMax IA - Banco PostgreSQL
-- Execute este arquivo uma vez no banco ubermax_db.
-- Ele cria/ajusta as tabelas necessárias para:
-- motorista, jornadas, Meu Carro/KM Real e Avaliar Corrida.
-- =========================================================

CREATE TABLE IF NOT EXISTS motoristas (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    nome VARCHAR(150) NOT NULL,
    plataforma VARCHAR(60) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jornadas (
    id SERIAL PRIMARY KEY,
    motorista_id INTEGER NOT NULL REFERENCES motoristas(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    ganho_bruto DECIMAL(10,2) NOT NULL DEFAULT 0,
    km_rodados DECIMAL(10,2) NOT NULL DEFAULT 0,
    horas_trabalhadas DECIMAL(10,2) NOT NULL DEFAULT 0,
    regiao_principal VARCHAR(120) NOT NULL,
    categoria_principal VARCHAR(80) NOT NULL,
    combustivel DECIMAL(10,2) NOT NULL DEFAULT 0,
    outros_custos DECIMAL(10,2) NOT NULL DEFAULT 0,
    lucro_liquido DECIMAL(10,2) NOT NULL DEFAULT 0,
    lucro_hora DECIMAL(10,2) NOT NULL DEFAULT 0,
    lucro_km DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Caso a tabela jornadas já exista, estes comandos adicionam os campos novos sem quebrar.
ALTER TABLE jornadas ADD COLUMN IF NOT EXISTS combustivel DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE jornadas ADD COLUMN IF NOT EXISTS outros_custos DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE jornadas ADD COLUMN IF NOT EXISTS lucro_liquido DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE jornadas ADD COLUMN IF NOT EXISTS lucro_hora DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE jornadas ADD COLUMN IF NOT EXISTS lucro_km DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE jornadas ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS configuracao_carro (
    id SERIAL PRIMARY KEY,
    motorista_id INTEGER NOT NULL REFERENCES motoristas(id) ON DELETE CASCADE,
    modelo VARCHAR(120) NOT NULL,
    tipo_combustivel VARCHAR(60) NOT NULL,
    consumo_medio DECIMAL(10,2) NOT NULL DEFAULT 0,
    preco_combustivel DECIMAL(10,2) NOT NULL DEFAULT 0,
    seguro_mensal DECIMAL(10,2) NOT NULL DEFAULT 0,
    ipva_anual DECIMAL(10,2) NOT NULL DEFAULT 0,
    manutencao_mensal DECIMAL(10,2) NOT NULL DEFAULT 0,
    pneus_anual DECIMAL(10,2) NOT NULL DEFAULT 0,
    oleo_revisao_anual DECIMAL(10,2) NOT NULL DEFAULT 0,
    financiamento_mensal DECIMAL(10,2) NOT NULL DEFAULT 0,
    depreciacao_mensal DECIMAL(10,2) NOT NULL DEFAULT 0,
    km_medio_mes DECIMAL(10,2) NOT NULL DEFAULT 0,
    custo_combustivel_km DECIMAL(10,4) NOT NULL DEFAULT 0,
    custo_fixo_km DECIMAL(10,4) NOT NULL DEFAULT 0,
    custo_total_km DECIMAL(10,4) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_configuracao_carro_motorista
ON configuracao_carro (motorista_id);

CREATE TABLE IF NOT EXISTS avaliacoes_corrida (
    id SERIAL PRIMARY KEY,
    motorista_id INTEGER NOT NULL REFERENCES motoristas(id) ON DELETE CASCADE,
    valor_corrida DECIMAL(10,2) NOT NULL DEFAULT 0,
    distancia_corrida_km DECIMAL(10,2) NOT NULL DEFAULT 0,
    tempo_corrida_min INTEGER NOT NULL DEFAULT 0,
    distancia_pickup_km DECIMAL(10,2) NOT NULL DEFAULT 0,
    tempo_pickup_min INTEGER NOT NULL DEFAULT 0,
    distancia_total_km DECIMAL(10,2) NOT NULL DEFAULT 0,
    tempo_total_min INTEGER NOT NULL DEFAULT 0,
    origem VARCHAR(140) NOT NULL,
    destino VARCHAR(140) NOT NULL,
    categoria VARCHAR(80) NOT NULL,
    observacao TEXT,
    custo_km_usado DECIMAL(10,4) NOT NULL DEFAULT 0,
    custo_estimado DECIMAL(10,2) NOT NULL DEFAULT 0,
    lucro_estimado DECIMAL(10,2) NOT NULL DEFAULT 0,
    lucro_hora DECIMAL(10,2) NOT NULL DEFAULT 0,
    lucro_km DECIMAL(10,2) NOT NULL DEFAULT 0,
    nota_corrida INTEGER NOT NULL DEFAULT 0,
    recomendacao VARCHAR(20) NOT NULL,
    motivo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jornadas_motorista_data
ON jornadas (motorista_id, data DESC);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_corrida_motorista_data
ON avaliacoes_corrida (motorista_id, created_at DESC);
