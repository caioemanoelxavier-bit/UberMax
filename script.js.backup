// =========================================================
// UberMax IA — script.js
// Versão corrigida e completa
// =========================================================

const API_URL = 'http://localhost:3000/api';

let usuarioLogado = null;
let jornadasCache = [];
let corridasCache = [];
let configCarro = null;

// =========================================================
// INICIALIZAÇÃO
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    // Define data de hoje no campo de data
    const inputData = document.getElementById('data');
    if (inputData) inputData.valueAsDate = new Date();

    // Carrega usuário salvo no localStorage
    carregarUsuarioLocal();
    atualizarTelaUsuario();

    // Eventos da tela inicial
    document.getElementById('btnComecar').addEventListener('click', abrirApp);
    document.getElementById('btnVerRecursos').addEventListener('click', () => {
        document.getElementById('recursos').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // Evento de trocar motorista
    document.getElementById('btnLimparUsuario').addEventListener('click', limparUsuario);

    // Navegação por abas
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => abrirAba(button.dataset.tab));
    });

    // Formulários
    document.getElementById('formMotorista').addEventListener('submit', salvarMotorista);
    document.getElementById('formJornada').addEventListener('submit', registrarJornada);
    document.getElementById('formCarro').addEventListener('submit', salvarCarro);
    document.getElementById('formCorrida').addEventListener('submit', avaliarCorrida);

    // Filtro de histórico
    document.getElementById('filtroMes').addEventListener('change', renderizarHistorico);

    // Botão "Ir para Meu Carro" no aviso da aba Avaliar
    const btnIrParaCarro = document.getElementById('btnIrParaCarro');
    if (btnIrParaCarro) {
        btnIrParaCarro.addEventListener('click', () => abrirAba('carro'));
    }
});

// =========================================================
// NAVEGAÇÃO
// =========================================================

function abrirApp() {
    document.getElementById('telaInicial').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');

    if (usuarioLogado) {
        carregarDados();
    }
}

function abrirAba(tab) {
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    const botao = document.querySelector(`.tab-button[data-tab="${tab}"]`);
    const conteudo = document.getElementById(`tab-${tab}`);

    if (botao) botao.classList.add('active');
    if (conteudo) conteudo.classList.add('active');

    if (usuarioLogado && ['historico', 'analise', 'carro', 'avaliar'].includes(tab)) {
        carregarDados();
    }

    // Atualiza aviso de custo do carro ao abrir aba avaliar
    if (tab === 'avaliar') {
        atualizarAvisoCustoKm();
    }
}

// =========================================================
// USUÁRIO / MOTORISTA
// =========================================================

function carregarUsuarioLocal() {
    const salvo = localStorage.getItem('ubermax_motorista');
    if (!salvo) return;

    try {
        usuarioLogado = JSON.parse(salvo);
    } catch {
        localStorage.removeItem('ubermax_motorista');
        usuarioLogado = null;
    }
}

function atualizarTelaUsuario() {
    const boxUsuario = document.getElementById('boxUsuario');
    const boxMotoristaLogado = document.getElementById('boxMotoristaLogado');
    const nomeMotoristaLogado = document.getElementById('nomeMotoristaLogado');
    const infoMotoristaLogado = document.getElementById('infoMotoristaLogado');

    if (usuarioLogado && usuarioLogado.id) {
        boxUsuario.classList.add('hidden');
        boxMotoristaLogado.classList.remove('hidden');
        nomeMotoristaLogado.textContent = usuarioLogado.nome || 'Motorista';
        infoMotoristaLogado.textContent = `${usuarioLogado.cidade || 'Cidade não informada'} • ${usuarioLogado.plataforma || 'Plataforma não informada'} • ID ${usuarioLogado.id}`;
    } else {
        boxUsuario.classList.remove('hidden');
        boxMotoristaLogado.classList.add('hidden');
    }
}

function limparUsuario() {
    localStorage.removeItem('ubermax_motorista');
    usuarioLogado = null;
    jornadasCache = [];
    corridasCache = [];
    configCarro = null;
    atualizarTelaUsuario();
    limparDashboard();
    mostrarMensagem(
        document.getElementById('msgMotorista'),
        'Motorista removido deste navegador. Cadastre novamente para continuar.',
        'warning'
    );
}

async function salvarMotorista(event) {
    event.preventDefault();

    const msgMotorista = document.getElementById('msgMotorista');
    const dados = {
        nome: valorTexto('nome'),
        email: valorTexto('email'),
        plataforma: valorTexto('plataforma'),
        cidade: valorTexto('cidade')
    };

    if (!dados.nome || !dados.email || !dados.plataforma || !dados.cidade) {
        mostrarMensagem(msgMotorista, 'Preencha todos os campos do motorista.', 'error');
        return;
    }

    mostrarMensagem(msgMotorista, 'Salvando motorista...', 'info');

    try {
        const response = await fetch(`${API_URL}/motoristas/registrar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        const resultado = await response.json();
        if (!response.ok) throw new Error(resultado.erro || 'Erro ao salvar motorista.');

        usuarioLogado = resultado.motorista;
        localStorage.setItem('ubermax_motorista', JSON.stringify(usuarioLogado));
        document.getElementById('formMotorista').reset();
        atualizarTelaUsuario();
        mostrarMensagem(msgMotorista, `✅ Motorista salvo com sucesso! Bem-vindo, ${usuarioLogado.nome}!`, 'success');
        carregarDados();
    } catch (error) {
        mostrarMensagem(msgMotorista, `❌ ${error.message}`, 'error');
    }
}

// =========================================================
// REGISTRAR JORNADA
// =========================================================

async function registrarJornada(event) {
    event.preventDefault();

    const msgJornada = document.getElementById('msgJornada');
    if (!exigirMotorista(msgJornada)) return;

    const ganhoBruto = numero('ganho_bruto');
    const horasTrabalhadas = numero('horas_trabalhadas');
    const kmRodados = numero('km_rodados');
    const combustivel = numero('combustivel');
    const outrosCustos = numero('outros_custos');

    if (ganhoBruto <= 0) return mostrarMensagem(msgJornada, 'O ganho bruto precisa ser maior que zero.', 'error');
    if (horasTrabalhadas <= 0) return mostrarMensagem(msgJornada, 'Horas trabalhadas precisa ser maior que zero.', 'error');
    if (kmRodados <= 0) return mostrarMensagem(msgJornada, 'KM rodados precisa ser maior que zero.', 'error');
    if (combustivel < 0 || outrosCustos < 0) return mostrarMensagem(msgJornada, 'Custos não podem ser negativos.', 'error');

    const custosTotais = combustivel + outrosCustos;
    const lucroLiquido = ganhoBruto - custosTotais;
    const lucroHora = lucroLiquido / horasTrabalhadas;
    const lucroKm = lucroLiquido / kmRodados;

    const dados = {
        motorista_id: usuarioLogado.id,
        data: valorTexto('data'),
        ganho_bruto: ganhoBruto,
        km_rodados: kmRodados,
        horas_trabalhadas: horasTrabalhadas,
        regiao_principal: valorTexto('regiao_principal'),
        categoria_principal: valorTexto('categoria_principal'),
        combustivel,
        outros_custos: outrosCustos,
        lucro_liquido: lucroLiquido,
        lucro_hora: lucroHora,
        lucro_km: lucroKm
    };

    if (!dados.data || !dados.regiao_principal || !dados.categoria_principal) {
        return mostrarMensagem(msgJornada, 'Preencha data, região e categoria.', 'error');
    }

    mostrarMensagem(msgJornada, 'Registrando jornada...', 'info');

    try {
        const response = await fetch(`${API_URL}/jornadas/registrar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        const resultado = await response.json();
        if (!response.ok) throw new Error(resultado.erro || 'Erro ao registrar jornada.');

        mostrarResultadoJornada({ ganhoBruto, custosTotais, lucroLiquido, lucroHora, lucroKm });
        mostrarMensagem(msgJornada, '✅ Jornada registrada com sucesso!', 'success');
        document.getElementById('formJornada').reset();
        document.getElementById('data').valueAsDate = new Date();
        carregarDados();
    } catch (error) {
        mostrarMensagem(msgJornada, `❌ ${error.message}`, 'error');
    }
}

// =========================================================
// MEU CARRO
// =========================================================

async function salvarCarro(event) {
    event.preventDefault();

    const msgCarro = document.getElementById('msgCarro');
    if (!exigirMotorista(msgCarro)) return;

    const consumoMedio = numero('consumo_medio');
    const precoCombustivel = numero('preco_combustivel');
    const seguroMensal = numero('seguro_mensal');
    const ipvaAnual = numero('ipva_anual');
    const manutencaoMensal = numero('manutencao_mensal');
    const pneusAnual = numero('pneus_anual');
    const oleoRevisaoAnual = numero('oleo_revisao_anual');
    const financiamentoMensal = numero('financiamento_mensal');
    const depreciacaoMensal = numero('depreciacao_mensal');
    const kmMedioMes = numero('km_medio_mes');

    if (consumoMedio <= 0) return mostrarMensagem(msgCarro, 'Consumo médio precisa ser maior que zero.', 'error');
    if (kmMedioMes <= 0) return mostrarMensagem(msgCarro, 'KM médio por mês precisa ser maior que zero.', 'error');
    if (precoCombustivel <= 0) return mostrarMensagem(msgCarro, 'Preço do combustível precisa ser maior que zero.', 'error');

    // Cálculos locais
    const custoCombustivelKm = precoCombustivel / consumoMedio;
    const custosFixosMensais = seguroMensal + (ipvaAnual / 12) + manutencaoMensal + (pneusAnual / 12) + (oleoRevisaoAnual / 12) + financiamentoMensal + depreciacaoMensal;
    const custoFixoKm = custosFixosMensais / kmMedioMes;
    const custoTotalKm = custoCombustivelKm + custoFixoKm;

    const dados = {
        motorista_id: usuarioLogado.id,
        modelo: valorTexto('modelo_carro'),
        tipo_combustivel: valorTexto('tipo_combustivel'),
        consumo_medio: consumoMedio,
        preco_combustivel: precoCombustivel,
        seguro_mensal: seguroMensal,
        ipva_anual: ipvaAnual,
        manutencao_mensal: manutencaoMensal,
        pneus_anual: pneusAnual,
        oleo_revisao_anual: oleoRevisaoAnual,
        financiamento_mensal: financiamentoMensal,
        depreciacao_mensal: depreciacaoMensal,
        km_medio_mes: kmMedioMes,
        custo_combustivel_km: custoCombustivelKm,
        custo_fixo_km: custoFixoKm,
        custo_total_km: custoTotalKm
    };

    if (!dados.modelo || !dados.tipo_combustivel) {
        return mostrarMensagem(msgCarro, 'Preencha modelo e tipo de combustível.', 'error');
    }

    mostrarMensagem(msgCarro, 'Salvando configuração do carro...', 'info');

    try {
        const response = await fetch(`${API_URL}/carro/configurar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        const resultado = await response.json();
        if (!response.ok) throw new Error(resultado.erro || 'Erro ao salvar carro.');

        configCarro = resultado.carro;

        // Exibe resultado com breakdown detalhado
        mostrarResultadoCarro(configCarro, {
            custoCombustivelMensal: custoCombustivelKm * kmMedioMes,
            seguroMensal,
            ipvaMensal: ipvaAnual / 12,
            manutencaoMensal,
            pneusMensal: pneusAnual / 12,
            oleoMensal: oleoRevisaoAnual / 12,
            financiamentoMensal,
            depreciacaoMensal,
            custosFixosMensais,
            totalMensal: (custoCombustivelKm * kmMedioMes) + custosFixosMensais
        });

        mostrarMensagem(msgCarro, '✅ Configuração do carro salva com sucesso!', 'success');
        atualizarAvisoCustoKm();
    } catch (error) {
        mostrarMensagem(msgCarro, `❌ ${error.message}`, 'error');
    }
}

// =========================================================
// AVALIAR CORRIDA
// =========================================================

async function avaliarCorrida(event) {
    event.preventDefault();

    const msgCorrida = document.getElementById('msgCorrida');
    if (!exigirMotorista(msgCorrida)) return;

    const valorCorrida = numero('valor_corrida');
    const distanciaCorridaKm = numero('distancia_corrida_km');
    const tempoCorridaMin = numero('tempo_corrida_min');
    const distanciaPickupKm = numero('distancia_pickup_km');
    const tempoPickupMin = numero('tempo_pickup_min');

    if (valorCorrida <= 0) return mostrarMensagem(msgCorrida, 'Valor da corrida precisa ser maior que zero.', 'error');
    if (distanciaCorridaKm <= 0) return mostrarMensagem(msgCorrida, 'Distância da corrida precisa ser maior que zero.', 'error');
    if (tempoCorridaMin <= 0) return mostrarMensagem(msgCorrida, 'Tempo da corrida precisa ser maior que zero.', 'error');

    const custoKm = Number(configCarro?.custo_total_km || 0.87);
    const distanciaTotalKm = distanciaCorridaKm + distanciaPickupKm;
    const tempoTotalMin = tempoCorridaMin + tempoPickupMin;
    const custoEstimado = distanciaTotalKm * custoKm;
    const lucroEstimado = valorCorrida - custoEstimado;
    const lucroHora = tempoTotalMin > 0 ? lucroEstimado / (tempoTotalMin / 60) : 0;
    const lucroKm = distanciaTotalKm > 0 ? lucroEstimado / distanciaTotalKm : 0;

    const destino = valorTexto('destino_corrida');
    const origem = valorTexto('origem_corrida');
    const avaliacao = calcularAvaliacaoCorrida({
        lucroHora,
        lucroKm,
        tempoTotalMin,
        distanciaTotalKm,
        destino
    });

    const dados = {
        motorista_id: usuarioLogado.id,
        valor_corrida: valorCorrida,
        distancia_corrida_km: distanciaCorridaKm,
        tempo_corrida_min: tempoCorridaMin,
        distancia_pickup_km: distanciaPickupKm,
        tempo_pickup_min: tempoPickupMin,
        distancia_total_km: distanciaTotalKm,
        tempo_total_min: tempoTotalMin,
        origem,
        destino,
        categoria: valorTexto('categoria_corrida'),
        observacao: valorTexto('observacao_corrida'),
        custo_km_usado: custoKm,
        custo_estimado: custoEstimado,
        lucro_estimado: lucroEstimado,
        lucro_hora: lucroHora,
        lucro_km: lucroKm,
        nota_corrida: avaliacao.notaFinal,
        recomendacao: avaliacao.recomendacao,
        motivo: avaliacao.motivo
    };

    if (!dados.origem || !dados.destino || !dados.categoria) {
        return mostrarMensagem(msgCorrida, 'Preencha origem, destino e categoria.', 'error');
    }

    mostrarMensagem(msgCorrida, 'Avaliando corrida...', 'info');

    try {
        const response = await fetch(`${API_URL}/corridas/avaliar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        const resultado = await response.json();
        if (!response.ok) throw new Error(resultado.erro || 'Erro ao avaliar corrida.');

        // Usa dados do backend se disponíveis, senão usa os calculados localmente
        const dadosResultado = resultado.avaliacao || dados;

        // Adiciona informações extras para exibição
        dadosResultado._origem = origem;
        dadosResultado._destino = destino;
        dadosResultado._distanciaTotal = distanciaTotalKm;
        dadosResultado._tempoTotal = tempoTotalMin;
        dadosResultado._custoKmUsado = custoKm;

        mostrarResultadoCorrida(dadosResultado);

        const mensagemSucesso = configCarro
            ? '✅ Corrida avaliada com sucesso!'
            : '✅ Corrida avaliada! ⚠️ Usando custo padrão de R$ 0,87/km. Cadastre seu carro para maior precisão.';

        mostrarMensagem(msgCorrida, mensagemSucesso, configCarro ? 'success' : 'warning');
        document.getElementById('formCorrida').reset();
        carregarCorridas();
    } catch (error) {
        mostrarMensagem(msgCorrida, `❌ ${error.message}`, 'error');
    }
}

// =========================================================
// CARREGAR DADOS DO SERVIDOR
// =========================================================

async function carregarDados() {
    if (!usuarioLogado || !usuarioLogado.id) return;

    await Promise.all([
        carregarJornadas(),
        carregarResumo(),
        carregarCarro(),
        carregarCorridas()
    ]);

    renderizarHistorico();
    renderizarRanking();
    gerarAnaliseGeral();
}

async function carregarJornadas() {
    const historicoLista = document.getElementById('historicoLista');
    try {
        const response = await fetch(`${API_URL}/jornadas/${usuarioLogado.id}`);
        const dados = await response.json();
        if (!response.ok) throw new Error(dados.erro || 'Erro ao carregar jornadas.');
        jornadasCache = Array.isArray(dados) ? dados : [];
    } catch (error) {
        historicoLista.innerHTML = `<p class="empty">Erro ao carregar histórico: ${error.message}</p>`;
    }
}

async function carregarResumo() {
    try {
        const response = await fetch(`${API_URL}/resumo/${usuarioLogado.id}`);
        const dados = await response.json();
        if (!response.ok) throw new Error(dados.erro || 'Erro ao carregar resumo.');

        setTexto('statBruto', dinheiro(dados.ganho_total));
        setTexto('statLucro', dinheiro(dados.lucro_liquido_total));
        setTexto('statLucroHora', `${dinheiro(dados.media_lucro_hora)}/h`);
        setTexto('statLucroKm', `${dinheiro(dados.media_lucro_km)}/km`);
        setTexto('statHoras', `${formatarNumero(dados.horas_total)} h`);
        setTexto('statKm', `${formatarNumero(dados.km_total)} km`);
        setTexto('statJornadas', dados.total_jornadas || 0);
    } catch (error) {
        console.error('Erro ao carregar resumo:', error);
    }
}

async function carregarCarro() {
    try {
        const response = await fetch(`${API_URL}/carro/${usuarioLogado.id}`);

        if (response.status === 404) {
            configCarro = null;
            atualizarAvisoCustoKm();
            return;
        }

        const dados = await response.json();
        if (!response.ok) throw new Error(dados.erro || 'Erro ao carregar carro.');

        configCarro = dados;
        preencherFormularioCarro(configCarro);
        mostrarResultadoCarro(configCarro, calcularBreakdownCarro(configCarro));
        atualizarAvisoCustoKm();
    } catch (error) {
        console.error('Erro ao carregar carro:', error);
    }
}

async function carregarCorridas() {
    const corridasLista = document.getElementById('corridasLista');
    try {
        const response = await fetch(`${API_URL}/corridas/${usuarioLogado.id}`);
        const dados = await response.json();
        if (!response.ok) throw new Error(dados.erro || 'Erro ao carregar corridas.');

        corridasCache = Array.isArray(dados) ? dados : [];
        renderizarCorridas();
    } catch (error) {
        corridasLista.innerHTML = `<p class="empty">Erro ao carregar corridas: ${error.message}</p>`;
    }
}

// =========================================================
// RENDERIZAÇÃO DE LISTAS
// =========================================================

function renderizarHistorico() {
    const historicoLista = document.getElementById('historicoLista');
    const filtroMes = document.getElementById('filtroMes');
    const mesSelecionado = filtroMes.value;
    let jornadas = [...jornadasCache];

    if (mesSelecionado) {
        jornadas = jornadas.filter(jornada => {
            const data = new Date(jornada.data);
            return data.getUTCMonth() + 1 === Number(mesSelecionado);
        });
    }

    if (jornadas.length === 0) {
        historicoLista.innerHTML = '<p class="empty">Nenhuma jornada encontrada.</p>';
        return;
    }

    historicoLista.innerHTML = jornadas.map(jornada => `
        <article class="historico-item">
            <div>
                <h3>${formatarData(jornada.data)} — ${jornada.regiao_principal || '-'}</h3>
                <small>${jornada.categoria_principal || 'Categoria não informada'}</small>
            </div>
            <div><span>Bruto</span><strong>${dinheiro(jornada.ganho_bruto)}</strong></div>
            <div><span>Lucro</span><strong>${dinheiro(jornada.lucro_liquido)}</strong></div>
            <div><span>Lucro/h</span><strong>${dinheiro(jornada.lucro_hora)}/h</strong></div>
            <div><span>Lucro/km</span><strong>${dinheiro(jornada.lucro_km)}/km</strong></div>
        </article>
    `).join('');
}

function renderizarRanking() {
    const rankingRegioes = document.getElementById('rankingRegioes');

    if (jornadasCache.length === 0) {
        rankingRegioes.innerHTML = '<p class="empty">Nenhuma região registrada ainda.</p>';
        setTexto('statMelhorRegiao', '-');
        return;
    }

    const mapa = {};

    jornadasCache.forEach(jornada => {
        const regiao = jornada.regiao_principal || 'Não informada';

        if (!mapa[regiao]) {
            mapa[regiao] = { regiao, lucroTotal: 0, horasTotal: 0, kmTotal: 0, jornadas: 0 };
        }

        mapa[regiao].lucroTotal += Number(jornada.lucro_liquido || 0);
        mapa[regiao].horasTotal += Number(jornada.horas_trabalhadas || 0);
        mapa[regiao].kmTotal += Number(jornada.km_rodados || 0);
        mapa[regiao].jornadas += 1;
    });

    const ranking = Object.values(mapa)
        .map(item => ({
            ...item,
            lucroHora: item.horasTotal > 0 ? item.lucroTotal / item.horasTotal : 0,
            lucroKm: item.kmTotal > 0 ? item.lucroTotal / item.kmTotal : 0
        }))
        .sort((a, b) => b.lucroHora - a.lucroHora);

    setTexto('statMelhorRegiao', ranking[0]?.regiao || '-');

    rankingRegioes.innerHTML = ranking.map((item, index) => `
        <article class="ranking-item">
            <div class="ranking-posicao">${index + 1}</div>
            <div class="ranking-info">
                <h3>${item.regiao}</h3>
                <p>${item.jornadas} jornada(s) • ${dinheiro(item.lucroKm)}/km</p>
            </div>
            <div class="ranking-valor">${dinheiro(item.lucroHora)}/h</div>
        </article>
    `).join('');
}

function renderizarCorridas() {
    const corridasLista = document.getElementById('corridasLista');
    const corridasStats = document.getElementById('corridasStats');

    if (corridasCache.length === 0) {
        corridasLista.innerHTML = '<p class="empty">Nenhuma corrida avaliada ainda.</p>';
        if (corridasStats) corridasStats.classList.add('hidden');
        return;
    }

    // Calcula estatísticas de recomendação
    const contagem = { aceitar: 0, pensar: 0, evitar: 0 };
    corridasCache.forEach(c => {
        const classe = classeRecomendacao(c.recomendacao);
        contagem[classe] = (contagem[classe] || 0) + 1;
    });

    if (corridasStats) {
        corridasStats.classList.remove('hidden');
        setTexto('statAceitar', contagem.aceitar);
        setTexto('statPensar', contagem.pensar);
        setTexto('statEvitar', contagem.evitar);
    }

    corridasLista.innerHTML = corridasCache.map(corrida => {
        const classe = classeRecomendacao(corrida.recomendacao);
        const nota = Math.round(Number(corrida.nota_corrida || 0));
        return `
            <article class="corrida-item">
                <div>
                    <span class="status ${classe}">${iconeRecomendacao(corrida.recomendacao)} ${corrida.recomendacao}</span>
                    <h3>${corrida.origem || '-'} → ${corrida.destino || '-'}</h3>
                    <small>${formatarData(corrida.created_at)} • ${corrida.categoria || '-'}</small>
                </div>
                <div><span>Valor</span><strong>${dinheiro(corrida.valor_corrida)}</strong></div>
                <div><span>Lucro</span><strong>${dinheiro(corrida.lucro_estimado)}</strong></div>
                <div>
                    <span>Nota</span>
                    <strong>${nota}/100</strong>
                    <div class="mini-progress">
                        <div class="mini-progress-fill ${classe}" style="width:${nota}%"></div>
                    </div>
                </div>
                <div><span>R$/km</span><strong>${dinheiro(corrida.lucro_km)}/km</strong></div>
            </article>
        `;
    }).join('');
}

// =========================================================
// ANÁLISE GERAL (IA LOCAL)
// =========================================================

function gerarAnaliseGeral() {
    const analiseGeralIA = document.getElementById('analiseGeralIA');

    if (jornadasCache.length === 0) {
        analiseGeralIA.textContent = 'Cadastre algumas jornadas para gerar uma análise.';
        return;
    }

    const lucroTotal = jornadasCache.reduce((acc, item) => acc + Number(item.lucro_liquido || 0), 0);
    const horasTotal = jornadasCache.reduce((acc, item) => acc + Number(item.horas_trabalhadas || 0), 0);
    const kmTotal = jornadasCache.reduce((acc, item) => acc + Number(item.km_rodados || 0), 0);
    const mediaHora = horasTotal > 0 ? lucroTotal / horasTotal : 0;
    const mediaKm = kmTotal > 0 ? lucroTotal / kmTotal : 0;

    let texto = `📊 Você tem ${jornadasCache.length} jornada(s) registrada(s). `;

    if (mediaHora < 25) texto += '⚠️ Seu lucro médio por hora está baixo (abaixo de R$25/h). Revise horários, regiões e custos. ';
    else if (mediaHora < 40) texto += '🟡 Seu lucro médio por hora está aceitável (R$25–40/h), mas ainda pode melhorar. ';
    else texto += '✅ Seu lucro médio por hora está saudável (acima de R$40/h). ';

    if (mediaKm < 1.2) texto += '⚠️ Seu lucro por KM está baixo; cuidado com corridas longas e baixa remuneração.';
    else if (mediaKm < 1.8) texto += '🟡 Seu lucro por KM está razoável. Continue comparando regiões.';
    else texto += '✅ Seu lucro por KM está forte. Você parece estar escolhendo boas jornadas.';

    if (configCarro) {
        const custoTotal = Number(configCarro.custo_total_km || 0);
        texto += ` Seu custo real por km é ${dinheiro(custoTotal)}/km.`;
    } else {
        texto += ' 💡 Dica: cadastre seu carro para ter análises ainda mais precisas.';
    }

    analiseGeralIA.textContent = texto;
}

// =========================================================
// EXIBIÇÃO DE RESULTADOS
// =========================================================

function mostrarResultadoJornada(dados) {
    setTexto('resGanhoBruto', dinheiro(dados.ganhoBruto));
    setTexto('resCustos', dinheiro(dados.custosTotais));
    setTexto('resLucroLiquido', dinheiro(dados.lucroLiquido));
    setTexto('resLucroHora', `${dinheiro(dados.lucroHora)}/h`);
    setTexto('resLucroKm', `${dinheiro(dados.lucroKm)}/km`);
    setTexto('resAnaliseIA', gerarAnaliseJornada(dados.lucroHora, dados.lucroKm));
    document.getElementById('resultadoJornada').classList.remove('hidden');
}

function mostrarResultadoCarro(carro, breakdown) {
    if (!carro) return;

    const custoTotal = Number(carro.custo_total_km || 0);
    const custoCombustivel = Number(carro.custo_combustivel_km || 0);
    const custoFixo = Number(carro.custo_fixo_km || 0);

    setTexto('carroCombustivelKm', `${dinheiro(custoCombustivel)}/km`);
    setTexto('carroFixoKm', `${dinheiro(custoFixo)}/km`);
    setTexto('carroTotalKm', `${dinheiro(custoTotal)}/km`);

    // Análise textual
    let texto = `Seu custo real estimado é de ${dinheiro(custoTotal)} por km. `;
    if (custoTotal > 1.5) texto += '🔴 Custo alto! Corridas curtas e mal pagas podem destruir seu lucro. Revise seus custos.';
    else if (custoTotal > 1.0) texto += '🟡 Custo médio. Vale acompanhar bem o lucro por km em cada corrida.';
    else if (custoTotal > 0.7) texto += '🟢 Custo relativamente controlado para uso em aplicativo.';
    else texto += '✅ Excelente custo por km! Seu veículo é muito eficiente.';

    setTexto('carroAnaliseIA', texto);

    // Barra de nível de custo (escala: 0 a R$2,00/km)
    const porcentagem = Math.min((custoTotal / 2.0) * 100, 100);
    const barra = document.getElementById('carroBarra');
    if (barra) {
        barra.style.width = `${porcentagem}%`;
        barra.className = `progress-bar-fill ${custoTotal > 1.5 ? 'fill-red' : custoTotal > 1.0 ? 'fill-yellow' : 'fill-green'}`;
    }

    const nivelTexto = document.getElementById('carroNivelTexto');
    if (nivelTexto) {
        if (custoTotal > 1.5) { nivelTexto.textContent = 'Alto'; nivelTexto.className = 'custo-nivel-badge badge-red'; }
        else if (custoTotal > 1.0) { nivelTexto.textContent = 'Médio'; nivelTexto.className = 'custo-nivel-badge badge-yellow'; }
        else { nivelTexto.textContent = 'Controlado'; nivelTexto.className = 'custo-nivel-badge badge-green'; }
    }

    // Breakdown de custos mensais
    if (breakdown) {
        setTexto('carroTotalMensal', dinheiro(breakdown.totalMensal));
        renderizarBreakdownCarro(breakdown, carro);
    }

    document.getElementById('resultadoCarro').classList.remove('hidden');
}

function renderizarBreakdownCarro(breakdown, carro) {
    const container = document.getElementById('carroBreakdown');
    if (!container) return;

    const itens = [
        { label: '⛽ Combustível', valor: breakdown.custoCombustivelMensal },
        { label: '🛡️ Seguro', valor: breakdown.seguroMensal },
        { label: '📄 IPVA (mensal)', valor: breakdown.ipvaMensal },
        { label: '🔧 Manutenção', valor: breakdown.manutencaoMensal },
        { label: '🚗 Pneus (mensal)', valor: breakdown.pneusMensal },
        { label: '🛢️ Óleo/Revisão (mensal)', valor: breakdown.oleoMensal },
        { label: '💳 Financiamento', valor: breakdown.financiamentoMensal },
        { label: '📉 Depreciação', valor: breakdown.depreciacaoMensal },
    ].filter(item => item.valor > 0);

    const total = breakdown.totalMensal || 1;

    container.innerHTML = itens.map(item => {
        const pct = Math.round((item.valor / total) * 100);
        return `
            <div class="breakdown-item">
                <div class="breakdown-label">
                    <span>${item.label}</span>
                    <span>${dinheiro(item.valor)}/mês</span>
                </div>
                <div class="breakdown-bar-track">
                    <div class="breakdown-bar-fill" style="width: ${pct}%"></div>
                </div>
                <span class="breakdown-pct">${pct}%</span>
            </div>
        `;
    }).join('');
}

function calcularBreakdownCarro(carro) {
    const consumoMedio = Number(carro.consumo_medio || 1);
    const precoCombustivel = Number(carro.preco_combustivel || 0);
    const kmMedioMes = Number(carro.km_medio_mes || 1);
    const seguroMensal = Number(carro.seguro_mensal || 0);
    const ipvaAnual = Number(carro.ipva_anual || 0);
    const manutencaoMensal = Number(carro.manutencao_mensal || 0);
    const pneusAnual = Number(carro.pneus_anual || 0);
    const oleoRevisaoAnual = Number(carro.oleo_revisao_anual || 0);
    const financiamentoMensal = Number(carro.financiamento_mensal || 0);
    const depreciacaoMensal = Number(carro.depreciacao_mensal || 0);

    const custoCombustivelMensal = (precoCombustivel / consumoMedio) * kmMedioMes;
    const ipvaMensal = ipvaAnual / 12;
    const pneusMensal = pneusAnual / 12;
    const oleoMensal = oleoRevisaoAnual / 12;
    const custosFixosMensais = seguroMensal + ipvaMensal + manutencaoMensal + pneusMensal + oleoMensal + financiamentoMensal + depreciacaoMensal;
    const totalMensal = custoCombustivelMensal + custosFixosMensais;

    return {
        custoCombustivelMensal,
        seguroMensal,
        ipvaMensal,
        manutencaoMensal,
        pneusMensal,
        oleoMensal,
        financiamentoMensal,
        depreciacaoMensal,
        custosFixosMensais,
        totalMensal
    };
}

function mostrarResultadoCorrida(corrida) {
    const nota = Math.round(Number(corrida.nota_corrida || 0));

    setTexto('corridaNota', `${nota}/100`);
    setTexto('corridaCusto', dinheiro(corrida.custo_estimado));
    setTexto('corridaLucro', dinheiro(corrida.lucro_estimado));
    setTexto('corridaLucroHora', `${dinheiro(corrida.lucro_hora)}/h`);
    setTexto('corridaLucroKm', `${dinheiro(corrida.lucro_km)}/km`);
    setTexto('corridaMotivo', corrida.motivo || '-');

    // Informações extras de rota e distância
    const origem = corrida._origem || corrida.origem || '-';
    const destino = corrida._destino || corrida.destino || '-';
    const distanciaTotal = corrida._distanciaTotal || corrida.distancia_total_km || 0;
    const tempoTotal = corrida._tempoTotal || corrida.tempo_total_min || 0;
    const custoKmUsado = corrida._custoKmUsado || corrida.custo_km_usado || 0;

    setTexto('corridaRota', `${origem} → ${destino}`);
    setTexto('corridaDistanciaTotal', `${formatarNumero(distanciaTotal)} km`);
    setTexto('corridaTempoTotal', `${tempoTotal} min`);
    setTexto('corridaCustoKmUsado', `${dinheiro(custoKmUsado)}/km`);

    // Badge de recomendação
    const badge = document.getElementById('corridaBadge');
    badge.className = `corrida-badge ${classeRecomendacao(corrida.recomendacao)}`;
    badge.textContent = `${iconeRecomendacao(corrida.recomendacao)} ${corrida.recomendacao}`;

    // Barra de nota
    const barraNota = document.getElementById('corridaBarraNota');
    if (barraNota) {
        barraNota.style.width = `${nota}%`;
        barraNota.className = `progress-bar-fill nota-fill ${classeRecomendacao(corrida.recomendacao)}`;
    }

    document.getElementById('resultadoCorrida').classList.remove('hidden');
}

// =========================================================
// AVISO DE CUSTO DO CARRO NA ABA AVALIAR
// =========================================================

function atualizarAvisoCustoKm() {
    const avisoCustoKm = document.getElementById('avisoCustoKm');
    const infoCustoKm = document.getElementById('infoCustoKm');
    const custoKmAtual = document.getElementById('custoKmAtual');

    if (!avisoCustoKm || !infoCustoKm) return;

    if (configCarro && configCarro.custo_total_km) {
        avisoCustoKm.classList.add('hidden');
        infoCustoKm.classList.remove('hidden');
        if (custoKmAtual) {
            custoKmAtual.textContent = `${dinheiro(configCarro.custo_total_km)}/km`;
        }
    } else {
        avisoCustoKm.classList.remove('hidden');
        infoCustoKm.classList.add('hidden');
    }
}

// =========================================================
// PREENCHER FORMULÁRIO DO CARRO (ao carregar dados)
// =========================================================

function preencherFormularioCarro(carro) {
    if (!carro) return;

    setValor('modelo_carro', carro.modelo);
    setValor('tipo_combustivel', carro.tipo_combustivel);
    setValor('consumo_medio', carro.consumo_medio);
    setValor('preco_combustivel', carro.preco_combustivel);
    setValor('seguro_mensal', carro.seguro_mensal);
    setValor('ipva_anual', carro.ipva_anual);
    setValor('manutencao_mensal', carro.manutencao_mensal);
    setValor('pneus_anual', carro.pneus_anual);
    setValor('oleo_revisao_anual', carro.oleo_revisao_anual);
    setValor('financiamento_mensal', carro.financiamento_mensal);
    setValor('depreciacao_mensal', carro.depreciacao_mensal);
    setValor('km_medio_mes', carro.km_medio_mes);
}

// =========================================================
// ALGORITMO DE AVALIAÇÃO DE CORRIDA (frontend)
// =========================================================

function calcularAvaliacaoCorrida({ lucroHora, lucroKm, tempoTotalMin, distanciaTotalKm, destino }) {
    const notaLucroHora = pontuarIntervalo(lucroHora, 25, 40);
    const notaLucroKm = pontuarIntervalo(lucroKm, 1.2, 1.8);
    const notaDestino = pontuarDestino(destino);
    const notaTransito = pontuarTransito(tempoTotalMin, distanciaTotalKm);
    const notaEvento = 50;

    const notaFinal = Math.round(
        notaLucroHora * 0.35 +
        notaLucroKm * 0.30 +
        notaDestino * 0.20 +
        notaTransito * 0.10 +
        notaEvento * 0.05
    );

    let recomendacao = 'Evitar';
    if (notaFinal >= 80) recomendacao = 'Aceitar';
    else if (notaFinal >= 60) recomendacao = 'Pensar';

    const motivos = [];

    if (lucroHora < 25) motivos.push('lucro por hora baixo');
    else if (lucroHora < 40) motivos.push('lucro por hora aceitável');
    else motivos.push('bom lucro por hora');

    if (lucroKm < 1.2) motivos.push('lucro por km baixo');
    else if (lucroKm < 1.8) motivos.push('lucro por km razoável');
    else motivos.push('bom lucro por km');

    if (notaDestino >= 80) motivos.push('destino com bom histórico no seu registro');
    else if (notaDestino <= 45) motivos.push('destino sem histórico forte de lucro');

    if (notaTransito <= 45) motivos.push('tempo por km alto, indicando possível trânsito');

    return {
        notaFinal,
        recomendacao,
        motivo: `Recomendação: ${recomendacao}. Motivos: ${motivos.join(', ')}.`
    };
}

function pontuarIntervalo(valor, minimoBom, excelente) {
    if (valor <= 0) return 0;
    if (valor < minimoBom) return Math.max(0, Math.round((valor / minimoBom) * 50));
    if (valor >= excelente) return 100;
    return Math.round(60 + ((valor - minimoBom) / (excelente - minimoBom)) * 40);
}

function pontuarDestino(destino) {
    if (!destino || jornadasCache.length === 0) return 55;

    const destinoNormalizado = normalizar(destino);
    const jornadasDestino = jornadasCache.filter(j =>
        normalizar(j.regiao_principal).includes(destinoNormalizado) ||
        destinoNormalizado.includes(normalizar(j.regiao_principal))
    );

    if (jornadasDestino.length === 0) return 55;

    const lucroTotal = jornadasDestino.reduce((acc, item) => acc + Number(item.lucro_liquido || 0), 0);
    const horasTotal = jornadasDestino.reduce((acc, item) => acc + Number(item.horas_trabalhadas || 0), 0);
    const mediaHora = horasTotal > 0 ? lucroTotal / horasTotal : 0;

    return pontuarIntervalo(mediaHora, 25, 40);
}

function pontuarTransito(tempoMin, distanciaKm) {
    if (tempoMin <= 0 || distanciaKm <= 0) return 50;

    const minPorKm = tempoMin / distanciaKm;
    if (minPorKm <= 2) return 95;
    if (minPorKm <= 3) return 80;
    if (minPorKm <= 4) return 60;
    if (minPorKm <= 5) return 40;
    return 20;
}

// =========================================================
// ANÁLISE TEXTUAL DE JORNADA
// =========================================================

function gerarAnaliseJornada(lucroHora, lucroKm) {
    let texto = '';

    if (lucroHora < 25) texto += '⚠️ Jornada fraca: o lucro por hora ficou baixo (abaixo de R$25/h). ';
    else if (lucroHora < 40) texto += '🟡 Jornada aceitável: seu lucro por hora foi razoável (R$25–40/h). ';
    else texto += '✅ Boa jornada: seu lucro por hora ficou saudável (acima de R$40/h). ';

    if (lucroKm < 1.2) texto += '⚠️ O lucro por KM ficou baixo; atenção com corridas longas.';
    else if (lucroKm < 1.8) texto += '🟡 O lucro por KM ficou em uma faixa aceitável.';
    else texto += '✅ O lucro por KM ficou forte.';

    return texto;
}

// =========================================================
// UTILITÁRIOS
// =========================================================

function exigirMotorista(elementoMensagem) {
    if (!usuarioLogado || !usuarioLogado.id) {
        mostrarMensagem(elementoMensagem, '⚠️ Cadastre ou selecione um motorista antes de continuar.', 'error');
        abrirAba('registro');
        return false;
    }
    return true;
}

function limparDashboard() {
    const historicoLista = document.getElementById('historicoLista');
    const rankingRegioes = document.getElementById('rankingRegioes');
    const corridasLista = document.getElementById('corridasLista');
    const analiseGeralIA = document.getElementById('analiseGeralIA');

    if (historicoLista) historicoLista.innerHTML = '<p class="empty">Nenhuma jornada registrada ainda.</p>';
    if (rankingRegioes) rankingRegioes.innerHTML = '<p class="empty">Nenhuma região registrada ainda.</p>';
    if (corridasLista) corridasLista.innerHTML = '<p class="empty">Nenhuma corrida avaliada ainda.</p>';
    if (analiseGeralIA) analiseGeralIA.textContent = 'Cadastre algumas jornadas para gerar uma análise.';

    setTexto('statBruto', 'R$ 0,00');
    setTexto('statLucro', 'R$ 0,00');
    setTexto('statLucroHora', 'R$ 0,00/h');
    setTexto('statLucroKm', 'R$ 0,00/km');
    setTexto('statHoras', '0 h');
    setTexto('statKm', '0 km');
    setTexto('statJornadas', '0');
    setTexto('statMelhorRegiao', '-');

    const resultadoCarro = document.getElementById('resultadoCarro');
    const resultadoCorrida = document.getElementById('resultadoCorrida');
    if (resultadoCarro) resultadoCarro.classList.add('hidden');
    if (resultadoCorrida) resultadoCorrida.classList.add('hidden');
}

function mostrarMensagem(elemento, texto, tipo = 'success') {
    if (!elemento) return;
    elemento.innerHTML = `<div class="alert ${tipo}">${texto}</div>`;
    // Remove a mensagem após 6 segundos (exceto erros)
    if (tipo !== 'error') {
        setTimeout(() => {
            if (elemento.innerHTML.includes(texto.substring(0, 20))) {
                elemento.innerHTML = '';
            }
        }, 6000);
    }
}

function numero(id) {
    const el = document.getElementById(id);
    const valor = Number(el?.value || 0);
    return Number.isNaN(valor) ? 0 : valor;
}

function valorTexto(id) {
    const el = document.getElementById(id);
    return String(el?.value || '').trim();
}

function setValor(id, valor) {
    const el = document.getElementById(id);
    if (el && valor !== undefined && valor !== null) el.value = valor;
}

function setTexto(id, texto) {
    const el = document.getElementById(id);
    if (el) el.textContent = texto;
}

function dinheiro(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function formatarNumero(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
        maximumFractionDigits: 1
    });
}

function formatarData(data) {
    if (!data) return '-';
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function normalizar(texto) {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function classeRecomendacao(recomendacao) {
    const rec = normalizar(recomendacao);
    if (rec.includes('aceitar')) return 'aceitar';
    if (rec.includes('pensar')) return 'pensar';
    return 'evitar';
}

function iconeRecomendacao(recomendacao) {
    const classe = classeRecomendacao(recomendacao);
    if (classe === 'aceitar') return '🟢';
    if (classe === 'pensar') return '🟡';
    return '🔴';
}
