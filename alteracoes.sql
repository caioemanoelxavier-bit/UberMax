-- =========================================================
-- UberMax IA — Banco de Dados PostgreSQL
-- Arquivo: alteracoes.sql
-- Execute este arquivo uma vez no banco ubermax_db.
--
-- Tabelas criadas/gerenciadas:
--   1. motoristas         — Cadastro de motoristas
--   2. jornadas           — Registro de jornadas de trabalho
--   3. configuracao_carro — Custo real por km do veículo
--   4. avaliacoes_corrida — Avaliações de corridas (Cherry Picker)
--
-- Seguro para re-execução: usa IF NOT EXISTS e ADD COLUMN IF NOT EXISTS
-- =========================================================


-- =========================================================
-- 1. TABELA: motoristas
-- =========================================================

CREATE TABLE IF NOT EXISTS motoristas (
    id          SERIAL PRIMARY KEY,
    email       VARCHAR(150) NOT NULL UNIQUE,
    nome        VARCHAR(150) NOT NULL,
    plataforma  VARCHAR(60)  NOT NULL,
    cidade      VARCHAR(100) NOT NULL,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Índice para busca por email (login/verificação)
CREATE INDEX IF NOT EXISTS idx_motoristas_email
ON motoristas (email);


-- =========================================================
-- 2. TABELA: jornadas
-- =========================================================

CREATE TABLE IF NOT EXISTS jornadas (
    id                  SERIAL PRIMARY KEY,
    motorista_id        INTEGER        NOT NULL REFERENCES motoristas(id) ON DELETE CASCADE,
    data                DATE           NOT NULL,
    ganho_bruto         DECIMAL(10,2)  NOT NULL DEFAULT 0,
    km_rodados          DECIMAL(10,2)  NOT NULL DEFAULT 0,
    horas_trabalhadas   DECIMAL(10,2)  NOT NULL DEFAULT 0,
    regiao_principal    VARCHAR(120)   NOT NULL,
    categoria_principal VARCHAR(80)    NOT NULL,
    combustivel         DECIMAL(10,2)  NOT NULL DEFAULT 0,
    outros_custos       DECIMAL(10,2)  NOT NULL DEFAULT 0,
    lucro_liquido       DECIMAL(10,2)  NOT NULL DEFAULT 0,
    lucro_hora          DECIMAL(10,4)  NOT NULL DEFAULT 0,
    lucro_km            DECIMAL(10,4)  NOT NULL DEFAULT 0,
    created_at          TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);

-- Caso a tabela jornadas já exista sem as colunas novas,
-- estes comandos adicionam os campos sem quebrar instalações existentes.
ALTER TABLE jornadas ADD COLUMN IF NOT EXISTS combustivel       DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE jornadas ADD COLUMN IF NOT EXISTS outros_custos     DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE jornadas ADD COLUMN IF NOT EXISTS lucro_liquido     DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE jornadas ADD COLUMN IF NOT EXISTS lucro_hora        DECIMAL(10,4) NOT NULL DEFAULT 0;
ALTER TABLE jornadas ADD COLUMN IF NOT EXISTS lucro_km          DECIMAL(10,4) NOT NULL DEFAULT 0;
ALTER TABLE jornadas ADD COLUMN IF NOT EXISTS created_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP;

-- Índices para performance nas consultas mais comuns
CREATE INDEX IF NOT EXISTS idx_jornadas_motorista_data
ON jornadas (motorista_id, data DESC);

CREATE INDEX IF NOT EXISTS idx_jornadas_motorista_regiao
ON jornadas (motorista_id, regiao_principal);

CREATE INDEX IF NOT EXISTS idx_jornadas_motorista_mes
ON jornadas (motorista_id, EXTRACT(MONTH FROM data));


-- =========================================================
-- 3. TABELA: configuracao_carro (Meu Carro / KM Real)
-- =========================================================

CREATE TABLE IF NOT EXISTS configuracao_carro (
    id                   SERIAL PRIMARY KEY,
    motorista_id         INTEGER        NOT NULL REFERENCES motoristas(id) ON DELETE CASCADE,
    modelo               VARCHAR(120)   NOT NULL,
    tipo_combustivel     VARCHAR(60)    NOT NULL,
    consumo_medio        DECIMAL(10,2)  NOT NULL DEFAULT 0,   -- km/l ou km/kWh
    preco_combustivel    DECIMAL(10,2)  NOT NULL DEFAULT 0,   -- R$/l ou R$/kWh
    seguro_mensal        DECIMAL(10,2)  NOT NULL DEFAULT 0,
    ipva_anual           DECIMAL(10,2)  NOT NULL DEFAULT 0,
    manutencao_mensal    DECIMAL(10,2)  NOT NULL DEFAULT 0,
    pneus_anual          DECIMAL(10,2)  NOT NULL DEFAULT 0,
    oleo_revisao_anual   DECIMAL(10,2)  NOT NULL DEFAULT 0,
    financiamento_mensal DECIMAL(10,2)  NOT NULL DEFAULT 0,
    depreciacao_mensal   DECIMAL(10,2)  NOT NULL DEFAULT 0,
    km_medio_mes         DECIMAL(10,2)  NOT NULL DEFAULT 0,
    -- Resultados calculados (armazenados para consulta rápida)
    custo_combustivel_km DECIMAL(10,4)  NOT NULL DEFAULT 0,   -- R$/km só combustível
    custo_fixo_km        DECIMAL(10,4)  NOT NULL DEFAULT 0,   -- R$/km custos fixos
    custo_total_km       DECIMAL(10,4)  NOT NULL DEFAULT 0,   -- R$/km total real
    created_at           TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);

-- Índice único: cada motorista tem apenas uma configuração de carro (upsert)
CREATE UNIQUE INDEX IF NOT EXISTS idx_configuracao_carro_motorista
ON configuracao_carro (motorista_id);

-- Caso a tabela já exista, adiciona colunas novas se necessário
ALTER TABLE configuracao_carro ADD COLUMN IF NOT EXISTS custo_combustivel_km DECIMAL(10,4) NOT NULL DEFAULT 0;
ALTER TABLE configuracao_carro ADD COLUMN IF NOT EXISTS custo_fixo_km        DECIMAL(10,4) NOT NULL DEFAULT 0;
ALTER TABLE configuracao_carro ADD COLUMN IF NOT EXISTS custo_total_km       DECIMAL(10,4) NOT NULL DEFAULT 0;
ALTER TABLE configuracao_carro ADD COLUMN IF NOT EXISTS updated_at           TIMESTAMP     DEFAULT CURRENT_TIMESTAMP;


-- =========================================================
-- 4. TABELA: avaliacoes_corrida (Avaliar Corrida / Cherry Picker)
-- =========================================================

CREATE TABLE IF NOT EXISTS avaliacoes_corrida (
    id                    SERIAL PRIMARY KEY,
    motorista_id          INTEGER        NOT NULL REFERENCES motoristas(id) ON DELETE CASCADE,
    -- Dados da oferta
    valor_corrida         DECIMAL(10,2)  NOT NULL DEFAULT 0,
    distancia_corrida_km  DECIMAL(10,2)  NOT NULL DEFAULT 0,
    tempo_corrida_min     INTEGER        NOT NULL DEFAULT 0,
    distancia_pickup_km   DECIMAL(10,2)  NOT NULL DEFAULT 0,
    tempo_pickup_min      INTEGER        NOT NULL DEFAULT 0,
    -- Totais calculados
    distancia_total_km    DECIMAL(10,2)  NOT NULL DEFAULT 0,
    tempo_total_min       INTEGER        NOT NULL DEFAULT 0,
    -- Localização
    origem                VARCHAR(140)   NOT NULL,
    destino               VARCHAR(140)   NOT NULL,
    categoria             VARCHAR(80)    NOT NULL,
    observacao            TEXT,
    -- Resultado financeiro
    custo_km_usado        DECIMAL(10,4)  NOT NULL DEFAULT 0,   -- custo/km utilizado na avaliação
    custo_estimado        DECIMAL(10,2)  NOT NULL DEFAULT 0,
    lucro_estimado        DECIMAL(10,2)  NOT NULL DEFAULT 0,
    lucro_hora            DECIMAL(10,4)  NOT NULL DEFAULT 0,
    lucro_km              DECIMAL(10,4)  NOT NULL DEFAULT 0,
    -- Resultado da avaliação IA
    nota_corrida          INTEGER        NOT NULL DEFAULT 0,    -- 0 a 100
    recomendacao          VARCHAR(20)    NOT NULL,              -- 'Aceitar', 'Pensar', 'Evitar'
    motivo                TEXT,
    created_at            TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);

-- Índices para consultas de histórico e estatísticas
CREATE INDEX IF NOT EXISTS idx_avaliacoes_corrida_motorista_data
ON avaliacoes_corrida (motorista_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_corrida_recomendacao
ON avaliacoes_corrida (motorista_id, recomendacao);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_corrida_destino
ON avaliacoes_corrida (motorista_id, destino);

-- Caso a tabela já exista, adiciona colunas novas se necessário
ALTER TABLE avaliacoes_corrida ADD COLUMN IF NOT EXISTS custo_km_usado DECIMAL(10,4) NOT NULL DEFAULT 0;
ALTER TABLE avaliacoes_corrida ADD COLUMN IF NOT EXISTS motivo         TEXT;


-- =========================================================
-- VIEWS ÚTEIS (opcionais, facilitam consultas no painel)
-- =========================================================

-- View: resumo por motorista
CREATE OR REPLACE VIEW vw_resumo_motorista AS
SELECT
    m.id                                                        AS motorista_id,
    m.nome,
    m.cidade,
    m.plataforma,
    COUNT(j.id)                                                 AS total_jornadas,
    COALESCE(SUM(j.ganho_bruto), 0)                            AS ganho_total,
    COALESCE(SUM(j.km_rodados), 0)                             AS km_total,
    COALESCE(SUM(j.horas_trabalhadas), 0)                      AS horas_total,
    COALESCE(SUM(j.lucro_liquido), 0)                          AS lucro_liquido_total,
    CASE
        WHEN COALESCE(SUM(j.horas_trabalhadas), 0) > 0
        THEN COALESCE(SUM(j.lucro_liquido), 0) / SUM(j.horas_trabalhadas)
        ELSE 0
    END                                                         AS media_lucro_hora,
    CASE
        WHEN COALESCE(SUM(j.km_rodados), 0) > 0
        THEN COALESCE(SUM(j.lucro_liquido), 0) / SUM(j.km_rodados)
        ELSE 0
    END                                                         AS media_lucro_km
FROM motoristas m
LEFT JOIN jornadas j ON j.motorista_id = m.id
GROUP BY m.id, m.nome, m.cidade, m.plataforma;

-- View: ranking de regiões por motorista
CREATE OR REPLACE VIEW vw_ranking_regioes AS
SELECT
    motorista_id,
    regiao_principal,
    COUNT(*)                                                    AS total_jornadas,
    COALESCE(SUM(lucro_liquido), 0)                            AS lucro_total,
    COALESCE(SUM(horas_trabalhadas), 0)                        AS horas_total,
    COALESCE(SUM(km_rodados), 0)                               AS km_total,
    CASE
        WHEN COALESCE(SUM(horas_trabalhadas), 0) > 0
        THEN COALESCE(SUM(lucro_liquido), 0) / SUM(horas_trabalhadas)
        ELSE 0
    END                                                         AS lucro_hora_medio,
    CASE
        WHEN COALESCE(SUM(km_rodados), 0) > 0
        THEN COALESCE(SUM(lucro_liquido), 0) / SUM(km_rodados)
        ELSE 0
    END                                                         AS lucro_km_medio
FROM jornadas
GROUP BY motorista_id, regiao_principal
ORDER BY motorista_id, lucro_hora_medio DESC;

-- View: estatísticas de corridas avaliadas por motorista
CREATE OR REPLACE VIEW vw_stats_corridas AS
SELECT
    motorista_id,
    COUNT(*)                                                    AS total_avaliadas,
    COUNT(*) FILTER (WHERE recomendacao = 'Aceitar')           AS total_aceitar,
    COUNT(*) FILTER (WHERE recomendacao = 'Pensar')            AS total_pensar,
    COUNT(*) FILTER (WHERE recomendacao = 'Evitar')            AS total_evitar,
    ROUND(AVG(nota_corrida), 1)                                AS nota_media,
    ROUND(AVG(lucro_estimado)::NUMERIC, 2)                     AS lucro_medio_corrida,
    ROUND(AVG(lucro_hora)::NUMERIC, 2)                         AS lucro_hora_medio_corrida
FROM avaliacoes_corrida
GROUP BY motorista_id;
