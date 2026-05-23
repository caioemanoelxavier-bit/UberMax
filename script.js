const API_URL = 'http://localhost:3000/api';

let usuarioLogado = null;
let jornadasCache = [];
let corridasCache = [];
let configCarro = null;

const telaInicial = document.getElementById('telaInicial');
const app = document.getElementById('app');
const btnComecar = document.getElementById('btnComecar');
const btnVerRecursos = document.getElementById('btnVerRecursos');
const btnLimparUsuario = document.getElementById('btnLimparUsuario');

const boxUsuario = document.getElementById('boxUsuario');
const boxMotoristaLogado = document.getElementById('boxMotoristaLogado');
const nomeMotoristaLogado = document.getElementById('nomeMotoristaLogado');
const infoMotoristaLogado = document.getElementById('infoMotoristaLogado');

const formMotorista = document.getElementById('formMotorista');
const formJornada = document.getElementById('formJornada');
const formCarro = document.getElementById('formCarro');
const formCorrida = document.getElementById('formCorrida');

const msgMotorista = document.getElementById('msgMotorista');
const msgJornada = document.getElementById('msgJornada');
const msgCarro = document.getElementById('msgCarro');
const msgCorrida = document.getElementById('msgCorrida');

const filtroMes = document.getElementById('filtroMes');
const historicoLista = document.getElementById('historicoLista');
const rankingRegioes = document.getElementById('rankingRegioes');
const analiseGeralIA = document.getElementById('analiseGeralIA');
const corridasLista = document.getElementById('corridasLista');

const resultadoJornada = document.getElementById('resultadoJornada');
const resultadoCarro = document.getElementById('resultadoCarro');
const resultadoCorrida = document.getElementById('resultadoCorrida');

iniciarApp();

function iniciarApp() {
    document.addEventListener('DOMContentLoaded', () => {
        const inputData = document.getElementById('data');
        if (inputData) inputData.valueAsDate = new Date();

        carregarUsuarioLocal();
        atualizarTelaUsuario();
    });

    btnComecar.addEventListener('click', abrirApp);

    btnVerRecursos.addEventListener('click', () => {
        document.getElementById('recursos').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    btnLimparUsuario.addEventListener('click', limparUsuario);

    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => abrirAba(button.dataset.tab));
    });

    formMotorista.addEventListener('submit', salvarMotorista);
    formJornada.addEventListener('submit', registrarJornada);
    formCarro.addEventListener('submit', salvarCarro);
    formCorrida.addEventListener('submit', avaliarCorrida);
    filtroMes.addEventListener('change', renderizarHistorico);
}

function abrirApp() {
    telaInicial.classList.add('hidden');
    app.classList.remove('hidden');

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
}

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
    mostrarMensagem(msgMotorista, 'Motorista removido deste navegador. Cadastre novamente para continuar.', 'warning');
}

async function salvarMotorista(event) {
    event.preventDefault();

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
        formMotorista.reset();
        atualizarTelaUsuario();
        mostrarMensagem(msgMotorista, 'Motorista salvo com sucesso!', 'success');
        carregarDados();
    } catch (error) {
        mostrarMensagem(msgMotorista, error.message, 'error');
    }
}

async function registrarJornada(event) {
    event.preventDefault();

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

    try {
        const response = await fetch(`${API_URL}/jornadas/registrar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        const resultado = await response.json();
        if (!response.ok) throw new Error(resultado.erro || 'Erro ao registrar jornada.');

        mostrarResultadoJornada({ ganhoBruto, custosTotais, lucroLiquido, lucroHora, lucroKm });
        mostrarMensagem(msgJornada, 'Jornada registrada com sucesso!', 'success');
        formJornada.reset();
        document.getElementById('data').valueAsDate = new Date();
        carregarDados();
    } catch (error) {
        mostrarMensagem(msgJornada, error.message, 'error');
    }
}

async function salvarCarro(event) {
    event.preventDefault();

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

    try {
        const response = await fetch(`${API_URL}/carro/configurar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        const resultado = await response.json();
        if (!response.ok) throw new Error(resultado.erro || 'Erro ao salvar carro.');

        configCarro = resultado.carro;
        mostrarResultadoCarro(configCarro);
        mostrarMensagem(msgCarro, 'Configuração do carro salva com sucesso!', 'success');
    } catch (error) {
        mostrarMensagem(msgCarro, error.message, 'error');
    }
}

async function avaliarCorrida(event) {
    event.preventDefault();

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
        origem: valorTexto('origem_corrida'),
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

    try {
        const response = await fetch(`${API_URL}/corridas/avaliar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        const resultado = await response.json();
        if (!response.ok) throw new Error(resultado.erro || 'Erro ao avaliar corrida.');

        mostrarResultadoCorrida(resultado.avaliacao || dados);
        mostrarMensagem(msgCorrida, configCarro ? 'Corrida avaliada com sucesso!' : 'Corrida avaliada usando custo padrão de R$ 0,87/km. Cadastre seu carro para maior precisão.', configCarro ? 'success' : 'warning');
        formCorrida.reset();
        carregarCorridas();
    } catch (error) {
        mostrarMensagem(msgCorrida, error.message, 'error');
    }
}

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

        document.getElementById('statBruto').textContent = dinheiro(dados.ganho_total);
        document.getElementById('statLucro').textContent = dinheiro(dados.lucro_liquido_total);
        document.getElementById('statLucroHora').textContent = `${dinheiro(dados.media_lucro_hora)}/h`;
        document.getElementById('statLucroKm').textContent = `${dinheiro(dados.media_lucro_km)}/km`;
        document.getElementById('statHoras').textContent = `${formatarNumero(dados.horas_total)} h`;
        document.getElementById('statKm').textContent = `${formatarNumero(dados.km_total)} km`;
        document.getElementById('statJornadas').textContent = dados.total_jornadas || 0;
    } catch (error) {
        console.error(error);
    }
}

async function carregarCarro() {
    try {
        const response = await fetch(`${API_URL}/carro/${usuarioLogado.id}`);

        if (response.status === 404) {
            configCarro = null;
            return;
        }

        const dados = await response.json();
        if (!response.ok) throw new Error(dados.erro || 'Erro ao carregar carro.');

        configCarro = dados;
        preencherFormularioCarro(configCarro);
        mostrarResultadoCarro(configCarro);
    } catch (error) {
        console.error(error);
    }
}

async function carregarCorridas() {
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

function renderizarHistorico() {
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
    if (jornadasCache.length === 0) {
        rankingRegioes.innerHTML = '<p class="empty">Nenhuma região registrada ainda.</p>';
        document.getElementById('statMelhorRegiao').textContent = '-';
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

    document.getElementById('statMelhorRegiao').textContent = ranking[0]?.regiao || '-';

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
    if (corridasCache.length === 0) {
        corridasLista.innerHTML = '<p class="empty">Nenhuma corrida avaliada ainda.</p>';
        return;
    }

    corridasLista.innerHTML = corridasCache.map(corrida => {
        const classe = classeRecomendacao(corrida.recomendacao);
        return `
            <article class="corrida-item">
                <div>
                    <span class="status ${classe}">${corrida.recomendacao}</span>
                    <h3>${corrida.origem || '-'} → ${corrida.destino || '-'}</h3>
                    <small>${formatarData(corrida.created_at)} • ${corrida.categoria || '-'}</small>
                </div>
                <div><span>Valor</span><strong>${dinheiro(corrida.valor_corrida)}</strong></div>
                <div><span>Lucro</span><strong>${dinheiro(corrida.lucro_estimado)}</strong></div>
                <div><span>Nota</span><strong>${Math.round(Number(corrida.nota_corrida || 0))}/100</strong></div>
                <div><span>R$/km</span><strong>${dinheiro(corrida.lucro_km)}/km</strong></div>
            </article>
        `;
    }).join('');
}

function gerarAnaliseGeral() {
    if (jornadasCache.length === 0) {
        analiseGeralIA.textContent = 'Cadastre algumas jornadas para gerar uma análise.';
        return;
    }

    const lucroTotal = jornadasCache.reduce((acc, item) => acc + Number(item.lucro_liquido || 0), 0);
    const horasTotal = jornadasCache.reduce((acc, item) => acc + Number(item.horas_trabalhadas || 0), 0);
    const kmTotal = jornadasCache.reduce((acc, item) => acc + Number(item.km_rodados || 0), 0);
    const mediaHora = horasTotal > 0 ? lucroTotal / horasTotal : 0;
    const mediaKm = kmTotal > 0 ? lucroTotal / kmTotal : 0;

    let texto = '';

    if (mediaHora < 25) texto += 'Seu lucro médio por hora está baixo. Revise horários, regiões e custos. ';
    else if (mediaHora < 40) texto += 'Seu lucro médio por hora está aceitável, mas ainda pode melhorar. ';
    else texto += 'Seu lucro médio por hora está saudável. ';

    if (mediaKm < 1.2) texto += 'Seu lucro por KM está baixo; cuidado com corridas longas e baixa remuneração.';
    else if (mediaKm < 1.8) texto += 'Seu lucro por KM está razoável. Continue comparando regiões.';
    else texto += 'Seu lucro por KM está forte. Você parece estar escolhendo boas jornadas.';

    analiseGeralIA.textContent = texto;
}

function mostrarResultadoJornada(dados) {
    document.getElementById('resGanhoBruto').textContent = dinheiro(dados.ganhoBruto);
    document.getElementById('resCustos').textContent = dinheiro(dados.custosTotais);
    document.getElementById('resLucroLiquido').textContent = dinheiro(dados.lucroLiquido);
    document.getElementById('resLucroHora').textContent = `${dinheiro(dados.lucroHora)}/h`;
    document.getElementById('resLucroKm').textContent = `${dinheiro(dados.lucroKm)}/km`;
    document.getElementById('resAnaliseIA').textContent = gerarAnaliseJornada(dados.lucroHora, dados.lucroKm);
    resultadoJornada.classList.remove('hidden');
}

function mostrarResultadoCarro(carro) {
    if (!carro) return;

    document.getElementById('carroCombustivelKm').textContent = `${dinheiro(carro.custo_combustivel_km)}/km`;
    document.getElementById('carroFixoKm').textContent = `${dinheiro(carro.custo_fixo_km)}/km`;
    document.getElementById('carroTotalKm').textContent = `${dinheiro(carro.custo_total_km)}/km`;

    let texto = `Seu custo real estimado é de ${dinheiro(carro.custo_total_km)} por km. `;
    if (Number(carro.custo_total_km) > 1.2) texto += 'Esse custo é alto; corridas curtas e mal pagas podem destruir seu lucro.';
    else if (Number(carro.custo_total_km) > 0.8) texto += 'Esse custo é médio; vale acompanhar bem lucro por km.';
    else texto += 'Esse custo está relativamente controlado para uso em aplicativo.';

    document.getElementById('carroAnaliseIA').textContent = texto;
    resultadoCarro.classList.remove('hidden');
}

function mostrarResultadoCorrida(corrida) {
    document.getElementById('corridaNota').textContent = `${Math.round(Number(corrida.nota_corrida || 0))}/100`;
    document.getElementById('corridaCusto').textContent = dinheiro(corrida.custo_estimado);
    document.getElementById('corridaLucro').textContent = dinheiro(corrida.lucro_estimado);
    document.getElementById('corridaLucroHora').textContent = `${dinheiro(corrida.lucro_hora)}/h`;
    document.getElementById('corridaLucroKm').textContent = `${dinheiro(corrida.lucro_km)}/km`;
    document.getElementById('corridaMotivo').textContent = corrida.motivo || '-';

    const badge = document.getElementById('corridaBadge');
    badge.className = `corrida-badge ${classeRecomendacao(corrida.recomendacao)}`;
    badge.textContent = `${iconeRecomendacao(corrida.recomendacao)} ${corrida.recomendacao}`;

    resultadoCorrida.classList.remove('hidden');
}

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

    if (notaDestino >= 80) motivos.push('destino com bom histórico no seu próprio registro');
    else if (notaDestino <= 45) motivos.push('destino sem histórico forte de lucro');

    if (notaTransito <= 45) motivos.push('tempo por km alto, indicando possível trânsito ou deslocamento lento');

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
    const jornadasDestino = jornadasCache.filter(j => normalizar(j.regiao_principal).includes(destinoNormalizado) || destinoNormalizado.includes(normalizar(j.regiao_principal)));

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

function gerarAnaliseJornada(lucroHora, lucroKm) {
    let texto = '';

    if (lucroHora < 25) texto += 'Jornada fraca: o lucro por hora ficou baixo. ';
    else if (lucroHora < 40) texto += 'Jornada aceitável: seu lucro por hora foi razoável. ';
    else texto += 'Boa jornada: seu lucro por hora ficou saudável. ';

    if (lucroKm < 1.2) texto += 'O lucro por KM ficou baixo; atenção com corridas longas.';
    else if (lucroKm < 1.8) texto += 'O lucro por KM ficou em uma faixa aceitável.';
    else texto += 'O lucro por KM ficou forte.';

    return texto;
}

function exigirMotorista(elementoMensagem) {
    if (!usuarioLogado || !usuarioLogado.id) {
        mostrarMensagem(elementoMensagem, 'Cadastre ou selecione um motorista antes de continuar.', 'error');
        abrirAba('registro');
        return false;
    }

    return true;
}

function limparDashboard() {
    historicoLista.innerHTML = '<p class="empty">Nenhuma jornada registrada ainda.</p>';
    rankingRegioes.innerHTML = '<p class="empty">Nenhuma região registrada ainda.</p>';
    corridasLista.innerHTML = '<p class="empty">Nenhuma corrida avaliada ainda.</p>';
    analiseGeralIA.textContent = 'Cadastre algumas jornadas para gerar uma análise.';

    setTexto('statBruto', 'R$ 0,00');
    setTexto('statLucro', 'R$ 0,00');
    setTexto('statLucroHora', 'R$ 0,00/h');
    setTexto('statLucroKm', 'R$ 0,00/km');
    setTexto('statHoras', '0 h');
    setTexto('statKm', '0 km');
    setTexto('statJornadas', '0');
    setTexto('statMelhorRegiao', '-');

    resultadoCarro.classList.add('hidden');
    resultadoCorrida.classList.add('hidden');
}

function mostrarMensagem(elemento, texto, tipo = 'success') {
    elemento.innerHTML = `<div class="alert ${tipo}">${texto}</div>`;
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
