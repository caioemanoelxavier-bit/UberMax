// =========================================================
// UberMax IA — server.js
// Backend Express + PostgreSQL
// =========================================================

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

app.use(cors());
app.use(express.json());

// =========================================================
// CONEXÃO COM POSTGRESQL
// =========================================================

const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    }
    : {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME
    };

const pool = new Pool(poolConfig);

pool.connect()
    .then(client => {
        console.log('✅ Conectado ao PostgreSQL');
        client.release();
    })
    .catch(error => {
        console.error('❌ Erro ao conectar no PostgreSQL:');
        console.error('Mensagem:', error.message);
        console.error('Código:', error.code);
    });

// =========================================================
// ROTAS BÁSICAS
// =========================================================

app.get('/', (req, res) => {
    res.json({
        mensagem: 'UberMax IA API rodando!',
        versao: '2.0',
        rotas: [
            'POST /api/motoristas/registrar',
            'GET  /api/motoristas/:id',
            'POST /api/jornadas/registrar',
            'GET  /api/jornadas/:motorista_id',
            'GET  /api/jornadas/:motorista_id/mes/:mes',
            'GET  /api/resumo/:motorista_id',
            'POST /api/carro/configurar',
            'GET  /api/carro/:motorista_id',
            'POST /api/corridas/avaliar',
            'GET  /api/corridas/:motorista_id',
            'GET  /api/corridas/:motorista_id/stats',
            'GET  /api/health'
        ]
    });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'UberMax IA', timestamp: new Date().toISOString() });
});

// =========================================================
// MOTORISTAS
// =========================================================

// POST /api/motoristas/registrar
// Cadastra novo motorista ou retorna existente pelo email
app.post('/api/motoristas/registrar', async (req, res) => {
    try {
        const { email, nome, plataforma, cidade } = req.body;

        if (!email || !nome || !plataforma || !cidade) {
            return res.status(400).json({ erro: 'Preencha email, nome, plataforma e cidade.' });
        }

        // Verifica se já existe
        const existente = await pool.query(
            'SELECT * FROM motoristas WHERE email = $1 LIMIT 1',
            [email.toLowerCase().trim()]
        );

        if (existente.rows.length > 0) {
            return res.status(200).json({
                mensagem: 'Motorista já cadastrado. Bem-vindo de volta!',
                motorista: existente.rows[0]
            });
        }

        const result = await pool.query(
            `INSERT INTO motoristas (email, nome, plataforma, cidade)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [email.toLowerCase().trim(), nome.trim(), plataforma, cidade.trim()]
        );

        res.status(201).json({
            mensagem: 'Motorista registrado com sucesso!',
            motorista: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao registrar motorista:', error);
        res.status(400).json({ erro: error.message });
    }
});

// GET /api/motoristas/:id
app.get('/api/motoristas/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM motoristas WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Motorista não encontrado.' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar motorista:', error);
        res.status(500).json({ erro: error.message });
    }
});

// =========================================================
// JORNADAS
// =========================================================

// POST /api/jornadas/registrar
app.post('/api/jornadas/registrar', async (req, res) => {
    try {
        const {
            motorista_id,
            data,
            ganho_bruto,
            km_rodados,
            horas_trabalhadas,
            regiao_principal,
            categoria_principal,
            combustivel = 0,
            outros_custos = 0,
            lucro_liquido,
            lucro_hora,
            lucro_km
        } = req.body;

        if (!motorista_id || !data || ganho_bruto === undefined || km_rodados === undefined || horas_trabalhadas === undefined || !regiao_principal || !categoria_principal) {
            return res.status(400).json({ erro: 'Dados obrigatórios não fornecidos.' });
        }

        const ganho = toNumber(ganho_bruto);
        const km = toNumber(km_rodados);
        const horas = toNumber(horas_trabalhadas);
        const combustivelNum = toNumber(combustivel);
        const outrosNum = toNumber(outros_custos);

        if ([ganho, km, horas, combustivelNum, outrosNum].some(Number.isNaN)) {
            return res.status(400).json({ erro: 'Valores numéricos inválidos.' });
        }

        if (ganho < 0 || combustivelNum < 0 || outrosNum < 0) {
            return res.status(400).json({ erro: 'Ganhos e custos não podem ser negativos.' });
        }

        if (km <= 0 || horas <= 0) {
            return res.status(400).json({ erro: 'Horas e KM devem ser maiores que zero.' });
        }

        const motorista = await pool.query('SELECT id FROM motoristas WHERE id = $1', [motorista_id]);
        if (motorista.rows.length === 0) {
            return res.status(404).json({ erro: 'Motorista não encontrado.' });
        }

        const lucroLiquidoFinal = lucro_liquido !== undefined ? toNumber(lucro_liquido) : ganho - combustivelNum - outrosNum;
        const lucroHoraFinal    = lucro_hora    !== undefined ? toNumber(lucro_hora)    : lucroLiquidoFinal / horas;
        const lucroKmFinal      = lucro_km      !== undefined ? toNumber(lucro_km)      : lucroLiquidoFinal / km;

        const result = await pool.query(
            `INSERT INTO jornadas
                (motorista_id, data, ganho_bruto, km_rodados, horas_trabalhadas,
                 regiao_principal, categoria_principal, combustivel, outros_custos,
                 lucro_liquido, lucro_hora, lucro_km)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING *`,
            [motorista_id, data, ganho, km, horas, regiao_principal, categoria_principal,
             combustivelNum, outrosNum, lucroLiquidoFinal, lucroHoraFinal, lucroKmFinal]
        );

        res.status(201).json({
            mensagem: 'Jornada registrada com sucesso!',
            jornada: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao registrar jornada:', error);
        res.status(400).json({ erro: error.message });
    }
});

// GET /api/jornadas/:motorista_id
app.get('/api/jornadas/:motorista_id', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM jornadas
             WHERE motorista_id = $1
             ORDER BY data DESC, id DESC`,
            [req.params.motorista_id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar jornadas:', error);
        res.status(500).json({ erro: error.message });
    }
});

// GET /api/jornadas/:motorista_id/mes/:mes
app.get('/api/jornadas/:motorista_id/mes/:mes', async (req, res) => {
    try {
        const { motorista_id, mes } = req.params;

        const result = await pool.query(
            `SELECT * FROM jornadas
             WHERE motorista_id = $1
               AND EXTRACT(MONTH FROM data) = $2
             ORDER BY data DESC, id DESC`,
            [motorista_id, Number(mes)]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar jornadas por mês:', error);
        res.status(500).json({ erro: error.message });
    }
});

// GET /api/resumo/:motorista_id
app.get('/api/resumo/:motorista_id', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                COUNT(*)                                            AS total_jornadas,
                COALESCE(SUM(ganho_bruto), 0)                      AS ganho_total,
                COALESCE(SUM(km_rodados), 0)                       AS km_total,
                COALESCE(SUM(horas_trabalhadas), 0)                AS horas_total,
                COALESCE(SUM(combustivel), 0)                      AS combustivel_total,
                COALESCE(SUM(outros_custos), 0)                    AS outros_custos_total,
                COALESCE(SUM(lucro_liquido), 0)                    AS lucro_liquido_total,
                CASE
                    WHEN COALESCE(SUM(horas_trabalhadas), 0) > 0
                    THEN COALESCE(SUM(lucro_liquido), 0) / SUM(horas_trabalhadas)
                    ELSE 0
                END                                                 AS media_lucro_hora,
                CASE
                    WHEN COALESCE(SUM(km_rodados), 0) > 0
                    THEN COALESCE(SUM(lucro_liquido), 0) / SUM(km_rodados)
                    ELSE 0
                END                                                 AS media_lucro_km
             FROM jornadas
             WHERE motorista_id = $1`,
            [req.params.motorista_id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao obter resumo:', error);
        res.status(500).json({ erro: error.message });
    }
});

// =========================================================
// MEU CARRO / KM REAL
// =========================================================

// POST /api/carro/configurar
// Cria ou atualiza (upsert) a configuração do carro do motorista
app.post('/api/carro/configurar', async (req, res) => {
    try {
        const {
            motorista_id,
            modelo,
            tipo_combustivel,
            consumo_medio,
            preco_combustivel,
            seguro_mensal        = 0,
            ipva_anual           = 0,
            manutencao_mensal    = 0,
            pneus_anual          = 0,
            oleo_revisao_anual   = 0,
            financiamento_mensal = 0,
            depreciacao_mensal   = 0,
            km_medio_mes,
            custo_combustivel_km,
            custo_fixo_km,
            custo_total_km
        } = req.body;

        if (!motorista_id || !modelo || !tipo_combustivel || consumo_medio === undefined || preco_combustivel === undefined || km_medio_mes === undefined) {
            return res.status(400).json({ erro: 'Dados obrigatórios do carro não fornecidos.' });
        }

        const valores = {
            consumo_medio:        toNumber(consumo_medio),
            preco_combustivel:    toNumber(preco_combustivel),
            seguro_mensal:        toNumber(seguro_mensal),
            ipva_anual:           toNumber(ipva_anual),
            manutencao_mensal:    toNumber(manutencao_mensal),
            pneus_anual:          toNumber(pneus_anual),
            oleo_revisao_anual:   toNumber(oleo_revisao_anual),
            financiamento_mensal: toNumber(financiamento_mensal),
            depreciacao_mensal:   toNumber(depreciacao_mensal),
            km_medio_mes:         toNumber(km_medio_mes)
        };

        if (Object.values(valores).some(Number.isNaN)) {
            return res.status(400).json({ erro: 'Valores numéricos inválidos.' });
        }

        if (Object.values(valores).some(v => v < 0)) {
            return res.status(400).json({ erro: 'Custos do carro não podem ser negativos.' });
        }

        if (valores.consumo_medio <= 0 || valores.km_medio_mes <= 0) {
            return res.status(400).json({ erro: 'Consumo médio e KM médio por mês devem ser maiores que zero.' });
        }

        // Calcula custos por km (usa valores do frontend se enviados, senão recalcula)
        const custoCombustivelFinal = custo_combustivel_km !== undefined
            ? toNumber(custo_combustivel_km)
            : valores.preco_combustivel / valores.consumo_medio;

        const custoFixoFinal = custo_fixo_km !== undefined
            ? toNumber(custo_fixo_km)
            : (
                valores.seguro_mensal +
                valores.ipva_anual / 12 +
                valores.manutencao_mensal +
                valores.pneus_anual / 12 +
                valores.oleo_revisao_anual / 12 +
                valores.financiamento_mensal +
                valores.depreciacao_mensal
            ) / valores.km_medio_mes;

        const custoTotalFinal = custo_total_km !== undefined
            ? toNumber(custo_total_km)
            : custoCombustivelFinal + custoFixoFinal;

        const motorista = await pool.query('SELECT id FROM motoristas WHERE id = $1', [motorista_id]);
        if (motorista.rows.length === 0) {
            return res.status(404).json({ erro: 'Motorista não encontrado.' });
        }

        const result = await pool.query(
            `INSERT INTO configuracao_carro
                (motorista_id, modelo, tipo_combustivel, consumo_medio, preco_combustivel,
                 seguro_mensal, ipva_anual, manutencao_mensal, pneus_anual, oleo_revisao_anual,
                 financiamento_mensal, depreciacao_mensal, km_medio_mes,
                 custo_combustivel_km, custo_fixo_km, custo_total_km)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
             ON CONFLICT (motorista_id)
             DO UPDATE SET
                modelo               = EXCLUDED.modelo,
                tipo_combustivel     = EXCLUDED.tipo_combustivel,
                consumo_medio        = EXCLUDED.consumo_medio,
                preco_combustivel    = EXCLUDED.preco_combustivel,
                seguro_mensal        = EXCLUDED.seguro_mensal,
                ipva_anual           = EXCLUDED.ipva_anual,
                manutencao_mensal    = EXCLUDED.manutencao_mensal,
                pneus_anual          = EXCLUDED.pneus_anual,
                oleo_revisao_anual   = EXCLUDED.oleo_revisao_anual,
                financiamento_mensal = EXCLUDED.financiamento_mensal,
                depreciacao_mensal   = EXCLUDED.depreciacao_mensal,
                km_medio_mes         = EXCLUDED.km_medio_mes,
                custo_combustivel_km = EXCLUDED.custo_combustivel_km,
                custo_fixo_km        = EXCLUDED.custo_fixo_km,
                custo_total_km       = EXCLUDED.custo_total_km,
                updated_at           = CURRENT_TIMESTAMP
             RETURNING *`,
            [
                motorista_id, modelo, tipo_combustivel,
                valores.consumo_medio, valores.preco_combustivel,
                valores.seguro_mensal, valores.ipva_anual, valores.manutencao_mensal,
                valores.pneus_anual, valores.oleo_revisao_anual,
                valores.financiamento_mensal, valores.depreciacao_mensal, valores.km_medio_mes,
                custoCombustivelFinal, custoFixoFinal, custoTotalFinal
            ]
        );

        res.status(201).json({
            mensagem: 'Configuração do carro salva com sucesso!',
            carro: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao salvar configuração do carro:', error);
        res.status(400).json({ erro: error.message });
    }
});

// GET /api/carro/:motorista_id
app.get('/api/carro/:motorista_id', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM configuracao_carro
             WHERE motorista_id = $1
             LIMIT 1`,
            [req.params.motorista_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Configuração do carro não encontrada.' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar carro:', error);
        res.status(500).json({ erro: error.message });
    }
});

// =========================================================
// AVALIAR CORRIDA / CHERRY PICKER
// =========================================================

// POST /api/corridas/avaliar
app.post('/api/corridas/avaliar', async (req, res) => {
    try {
        const {
            motorista_id,
            valor_corrida,
            distancia_corrida_km,
            tempo_corrida_min,
            distancia_pickup_km  = 0,
            tempo_pickup_min     = 0,
            origem,
            destino,
            categoria,
            observacao           = '',
            custo_km_usado,
            custo_estimado,
            lucro_estimado,
            lucro_hora,
            lucro_km,
            nota_corrida,
            recomendacao,
            motivo
        } = req.body;

        if (!motorista_id || valor_corrida === undefined || distancia_corrida_km === undefined || tempo_corrida_min === undefined || !origem || !destino || !categoria) {
            return res.status(400).json({ erro: 'Dados obrigatórios da corrida não fornecidos.' });
        }

        const valor          = toNumber(valor_corrida);
        const distCorrida    = toNumber(distancia_corrida_km);
        const tempoCorrida   = toNumber(tempo_corrida_min);
        const distPickup     = toNumber(distancia_pickup_km);
        const tempoPickup    = toNumber(tempo_pickup_min);

        if ([valor, distCorrida, tempoCorrida, distPickup, tempoPickup].some(Number.isNaN)) {
            return res.status(400).json({ erro: 'Valores numéricos inválidos.' });
        }

        if (valor <= 0 || distCorrida <= 0 || tempoCorrida <= 0) {
            return res.status(400).json({ erro: 'Valor, distância e tempo da corrida devem ser maiores que zero.' });
        }

        if (distPickup < 0 || tempoPickup < 0) {
            return res.status(400).json({ erro: 'Distância e tempo de pickup não podem ser negativos.' });
        }

        const motorista = await pool.query('SELECT id FROM motoristas WHERE id = $1', [motorista_id]);
        if (motorista.rows.length === 0) {
            return res.status(404).json({ erro: 'Motorista não encontrado.' });
        }

        const distanciaTotal = distCorrida + distPickup;
        const tempoTotal     = tempoCorrida + tempoPickup;

        // Determina custo/km: usa o enviado, ou busca do banco, ou usa padrão
        let custoKm = custo_km_usado !== undefined ? toNumber(custo_km_usado) : undefined;

        if (custoKm === undefined || Number.isNaN(custoKm) || custoKm <= 0) {
            const carro = await pool.query(
                'SELECT custo_total_km FROM configuracao_carro WHERE motorista_id = $1 LIMIT 1',
                [motorista_id]
            );
            custoKm = carro.rows[0] ? toNumber(carro.rows[0].custo_total_km) : 0.87;
        }

        const custoFinal    = custo_estimado  !== undefined ? toNumber(custo_estimado)  : distanciaTotal * custoKm;
        const lucroFinal    = lucro_estimado  !== undefined ? toNumber(lucro_estimado)  : valor - custoFinal;
        const lucroHoraFinal = lucro_hora     !== undefined ? toNumber(lucro_hora)      : (tempoTotal > 0 ? lucroFinal / (tempoTotal / 60) : 0);
        const lucroKmFinal  = lucro_km        !== undefined ? toNumber(lucro_km)        : (distanciaTotal > 0 ? lucroFinal / distanciaTotal : 0);

        const avaliacao     = calcularAvaliacaoCorridaBackend(lucroHoraFinal, lucroKmFinal, tempoTotal, distanciaTotal);
        const notaFinal     = nota_corrida    !== undefined ? Math.round(toNumber(nota_corrida)) : avaliacao.nota_corrida;
        const recFinal      = recomendacao    || avaliacao.recomendacao;
        const motivoFinal   = motivo          || avaliacao.motivo;

        const result = await pool.query(
            `INSERT INTO avaliacoes_corrida
                (motorista_id, valor_corrida, distancia_corrida_km, tempo_corrida_min,
                 distancia_pickup_km, tempo_pickup_min, distancia_total_km, tempo_total_min,
                 origem, destino, categoria, observacao, custo_km_usado, custo_estimado,
                 lucro_estimado, lucro_hora, lucro_km, nota_corrida, recomendacao, motivo)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
             RETURNING *`,
            [
                motorista_id, valor, distCorrida, tempoCorrida,
                distPickup, tempoPickup, distanciaTotal, tempoTotal,
                origem, destino, categoria, observacao,
                custoKm, custoFinal, lucroFinal, lucroHoraFinal, lucroKmFinal,
                notaFinal, recFinal, motivoFinal
            ]
        );

        res.status(201).json({
            mensagem: 'Corrida avaliada com sucesso!',
            avaliacao: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao avaliar corrida:', error);
        res.status(400).json({ erro: error.message });
    }
});

// GET /api/corridas/:motorista_id
app.get('/api/corridas/:motorista_id', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM avaliacoes_corrida
             WHERE motorista_id = $1
             ORDER BY created_at DESC, id DESC`,
            [req.params.motorista_id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar avaliações de corridas:', error);
        res.status(500).json({ erro: error.message });
    }
});

// GET /api/corridas/:motorista_id/stats
// Retorna estatísticas agregadas das corridas avaliadas
app.get('/api/corridas/:motorista_id/stats', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                COUNT(*)                                                    AS total_avaliadas,
                COUNT(*) FILTER (WHERE recomendacao = 'Aceitar')           AS total_aceitar,
                COUNT(*) FILTER (WHERE recomendacao = 'Pensar')            AS total_pensar,
                COUNT(*) FILTER (WHERE recomendacao = 'Evitar')            AS total_evitar,
                ROUND(AVG(nota_corrida)::NUMERIC, 1)                       AS nota_media,
                ROUND(AVG(lucro_estimado)::NUMERIC, 2)                     AS lucro_medio,
                ROUND(AVG(lucro_hora)::NUMERIC, 2)                         AS lucro_hora_medio,
                ROUND(AVG(distancia_total_km)::NUMERIC, 2)                 AS distancia_media
             FROM avaliacoes_corrida
             WHERE motorista_id = $1`,
            [req.params.motorista_id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao obter stats de corridas:', error);
        res.status(500).json({ erro: error.message });
    }
});

// =========================================================
// FUNÇÕES AUXILIARES DO BACKEND
// =========================================================

function calcularAvaliacaoCorridaBackend(lucroHora, lucroKm, tempoTotalMin, distanciaTotalKm) {
    const notaLucroHora = pontuarIntervalo(lucroHora, 25, 40);
    const notaLucroKm   = pontuarIntervalo(lucroKm, 1.2, 1.8);
    const notaDestino   = 55; // neutro no backend (sem histórico disponível)
    const notaTransito  = pontuarTransito(tempoTotalMin, distanciaTotalKm);
    const notaEvento    = 50;

    const nota_corrida = Math.round(
        notaLucroHora * 0.35 +
        notaLucroKm   * 0.30 +
        notaDestino   * 0.20 +
        notaTransito  * 0.10 +
        notaEvento    * 0.05
    );

    let recomendacao = 'Evitar';
    if (nota_corrida >= 80) recomendacao = 'Aceitar';
    else if (nota_corrida >= 60) recomendacao = 'Pensar';

    const motivos = [];

    if (lucroHora < 25)       motivos.push('lucro por hora baixo');
    else if (lucroHora < 40)  motivos.push('lucro por hora aceitável');
    else                      motivos.push('bom lucro por hora');

    if (lucroKm < 1.2)        motivos.push('lucro por km baixo');
    else if (lucroKm < 1.8)   motivos.push('lucro por km razoável');
    else                      motivos.push('bom lucro por km');

    if (notaTransito <= 45)   motivos.push('tempo por km alto, possível trânsito');

    return {
        nota_corrida,
        recomendacao,
        motivo: `Recomendação: ${recomendacao}. Motivos: ${motivos.join(', ')}.`
    };
}

function pontuarIntervalo(valor, minimoBom, excelente) {
    const n = toNumber(valor);
    if (n <= 0) return 0;
    if (n < minimoBom) return Math.max(0, Math.round((n / minimoBom) * 50));
    if (n >= excelente) return 100;
    return Math.round(60 + ((n - minimoBom) / (excelente - minimoBom)) * 40);
}

function pontuarTransito(tempoMin, distanciaKm) {
    const tempo     = toNumber(tempoMin);
    const distancia = toNumber(distanciaKm);

    if (tempo <= 0 || distancia <= 0) return 50;

    const minPorKm = tempo / distancia;
    if (minPorKm <= 2) return 95;
    if (minPorKm <= 3) return 80;
    if (minPorKm <= 4) return 60;
    if (minPorKm <= 5) return 40;
    return 20;
}

function toNumber(value) {
    const n = Number(value);
    return Number.isNaN(n) ? NaN : n;
}

// =========================================================
// INICIAR SERVIDOR
// =========================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 UberMax IA API rodando em http://localhost:${PORT}`);
    console.log(`📋 Documentação: http://localhost:${PORT}/`);
});
