// =========================================================
// UberMax - JAVASCRIPT CORE
// Simulador de Corridas para Motoristas
// =========================================================

const state = {
    usuario: null,
    carro: null,
    corridas: [],
    custoKmReal: 0.87,
    charts: {}
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    inicializarApp();
});

function inicializarApp() {
    carregarDados();
    configurarEventListeners();
    mostrarLandingPage();
}

function configurarEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = item.dataset.tab;
            mudarAba(tab);
        });
    });

    // Buttons
    document.querySelectorAll('button[onclick*="abrirApp"]').forEach(btn => {
        btn.addEventListener('click', abrirApp);
    });

    document.getElementById('btnLogout')?.addEventListener('click', logout);

    // Forms
    document.getElementById('formCarro')?.addEventListener('submit', salvarCarro);
    document.getElementById('formCorrida')?.addEventListener('submit', avaliarCorrida);

    // Relatórios
    document.getElementById('btnExportCSV')?.addEventListener('click', exportarCSV);
    document.getElementById('btnLimparHistorico')?.addEventListener('click', limparHistorico);

    // Configurações
    document.getElementById('btnLimparDados')?.addEventListener('click', limparDados);
}

// =========================================================
// LANDING PAGE
// =========================================================

function mostrarLandingPage() {
    document.getElementById('landingPage').classList.remove('hidden');
    document.getElementById('appDashboard').classList.add('hidden');
}

function abrirApp() {
    state.usuario = {
        nome: 'Motorista',
        email: 'usuario@ubermax.local',
        id: 1
    };
    
    document.getElementById('landingPage').classList.add('hidden');
    document.getElementById('appDashboard').classList.remove('hidden');
    
    document.getElementById('userName').textContent = state.usuario.nome;
    
    mudarAba('dashboard');
    atualizarDashboard();
}

function logout() {
    state.usuario = null;
    state.carro = null;
    state.corridas = [];
    salvarDados();
    mostrarLandingPage();
}

// =========================================================
// NAVIGATION
// =========================================================

function mudarAba(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const tabElement = document.getElementById(tabName);
    if (tabElement) {
        tabElement.classList.add('active');
    }
    
    const navItem = document.querySelector(`[data-tab="${tabName}"]`);
    if (navItem) {
        navItem.classList.add('active');
    }
    
    const titles = {
        'dashboard': 'Dashboard',
        'copiloto': 'Simulador',
        'km-real': 'KM Real',
        'historico': 'Histórico',
        'configuracoes': 'Configurações'
    };
    
    document.getElementById('pageTitle').textContent = titles[tabName] || 'Dashboard';
    
    if (tabName === 'dashboard') {
        atualizarDashboard();
    } else if (tabName === 'km-real') {
        carregarFormularioCarro();
    } else if (tabName === 'copiloto') {
        carregarFormularioCorrida();
    } else if (tabName === 'historico') {
        carregarHistorico();
    }
}

// =========================================================
// DASHBOARD
// =========================================================

function atualizarDashboard() {
    const totalGanho = state.corridas.reduce((sum, c) => sum + (c.lucro || 0), 0);
    const totalKm = state.corridas.reduce((sum, c) => sum + (c.distancia || 0), 0);
    const totalSimulacoes = state.corridas.length;
    
    document.getElementById('ganhoTotal').textContent = `R$ ${totalGanho.toFixed(2)}`;
    document.getElementById('kmRodados').textContent = `${totalKm.toFixed(1)} km`;
    document.getElementById('totalSimulacoes').textContent = totalSimulacoes;
    document.getElementById('custoKm').textContent = `R$ ${state.custoKmReal.toFixed(2)}`;
    
    atualizarTabelaCorridasRecentes();
}

function atualizarTabelaCorridasRecentes() {
    const tbody = document.getElementById('tabelaCorridasRecentes');
    
    if (state.corridas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Nenhuma simulação realizada ainda</td></tr>';
        return;
    }
    
    const recentes = state.corridas.slice(-10).reverse();
    tbody.innerHTML = recentes.map(corrida => `
        <tr>
            <td>${new Date(corrida.data).toLocaleDateString('pt-BR')}</td>
            <td>R$ ${corrida.valor.toFixed(2)}</td>
            <td>${corrida.distancia.toFixed(1)} km</td>
            <td>${corrida.tempo} min</td>
            <td>R$ ${corrida.lucro.toFixed(2)}</td>
            <td><span class="badge ${corrida.recomendacao}">${corrida.recomendacao.toUpperCase()}</span></td>
        </tr>
    `).join('');
}

// =========================================================
// KM REAL - CONFIGURAÇÃO DO VEÍCULO
// =========================================================

function carregarFormularioCarro() {
    if (state.carro) {
        document.getElementById('avisoCustoKm').classList.remove('alert-info');
        document.getElementById('avisoCustoKm').classList.add('alert-success');
        document.getElementById('textoAvisoCustoKm').textContent = `Seu custo/km configurado: R$ ${state.custoKmReal.toFixed(2)}`;
        
        // Preencher formulário com dados salvos
        document.getElementById('modelo').value = state.carro.modelo || '';
        document.getElementById('tipoCombustivel').value = state.carro.tipoCombustivel || '';
        document.getElementById('consumoMedio').value = state.carro.consumoMedio || '';
        document.getElementById('precoCombustivel').value = state.carro.precoCombustivel || '';
        document.getElementById('kmMediaMes').value = state.carro.kmMediaMes || '';
        document.getElementById('seguro').value = state.carro.seguro || '';
        document.getElementById('ipva').value = state.carro.ipva || '';
        document.getElementById('manutencao').value = state.carro.manutencao || '';
        document.getElementById('pneus').value = state.carro.pneus || '';
        document.getElementById('oleoRevisao').value = state.carro.oleoRevisao || '';
        document.getElementById('financiamento').value = state.carro.financiamento || '';
        document.getElementById('depreciacao').value = state.carro.depreciacao || '';
    } else {
        document.getElementById('avisoCustoKm').classList.add('alert-info');
        document.getElementById('avisoCustoKm').classList.remove('alert-success');
        document.getElementById('textoAvisoCustoKm').textContent = 'Nenhum carro configurado. Configure em KM Real para cálculos precisos.';
    }
}

function salvarCarro(e) {
    e.preventDefault();
    
    const carro = {
        modelo: document.getElementById('modelo').value,
        tipoCombustivel: document.getElementById('tipoCombustivel').value,
        consumoMedio: parseFloat(document.getElementById('consumoMedio').value),
        precoCombustivel: parseFloat(document.getElementById('precoCombustivel').value),
        kmMediaMes: parseFloat(document.getElementById('kmMediaMes').value),
        seguro: parseFloat(document.getElementById('seguro').value) || 0,
        ipva: parseFloat(document.getElementById('ipva').value) || 0,
        manutencao: parseFloat(document.getElementById('manutencao').value) || 0,
        pneus: parseFloat(document.getElementById('pneus').value) || 0,
        oleoRevisao: parseFloat(document.getElementById('oleoRevisao').value) || 0,
        financiamento: parseFloat(document.getElementById('financiamento').value) || 0,
        depreciacao: parseFloat(document.getElementById('depreciacao').value) || 0
    };
    
    // Calcular custo por km
    const custoCombustivelKm = carro.precoCombustivel / carro.consumoMedio;
    
    const custoFixoMensal = 
        carro.seguro +
        (carro.ipva / 12) +
        carro.manutencao +
        (carro.pneus / 12) +
        (carro.oleoRevisao / 12) +
        carro.financiamento +
        carro.depreciacao;
    
    const custoFixoKm = custoFixoMensal / carro.kmMediaMes;
    const custoTotalKm = custoCombustivelKm + custoFixoKm;
    
    state.carro = carro;
    state.custoKmReal = custoTotalKm;
    salvarDados();
    
    // Mostrar resultado
    document.getElementById('custoCombustivelKm').textContent = `R$ ${custoCombustivelKm.toFixed(2)}`;
    document.getElementById('custoFixoKm').textContent = `R$ ${custoFixoKm.toFixed(2)}`;
    document.getElementById('custoTotalKm').textContent = `R$ ${custoTotalKm.toFixed(2)}`;
    document.getElementById('resultadoCarro').style.display = 'block';
    
    // Atualizar aviso no formulário de corrida
    document.getElementById('avisoCustoKm').classList.remove('alert-info');
    document.getElementById('avisoCustoKm').classList.add('alert-success');
    document.getElementById('textoAvisoCustoKm').textContent = `Seu custo/km configurado: R$ ${state.custoKmReal.toFixed(2)}`;
    
    alert('Configuração de veículo salva com sucesso!');
}

// =========================================================
// SIMULADOR DE CORRIDAS
// =========================================================

function carregarFormularioCorrida() {
    if (state.carro) {
        document.getElementById('avisoCustoKm').classList.remove('alert-info');
        document.getElementById('avisoCustoKm').classList.add('alert-success');
        document.getElementById('textoAvisoCustoKm').textContent = `Seu custo/km configurado: R$ ${state.custoKmReal.toFixed(2)}`;
    } else {
        document.getElementById('avisoCustoKm').classList.add('alert-info');
        document.getElementById('avisoCustoKm').classList.remove('alert-success');
        document.getElementById('textoAvisoCustoKm').textContent = 'Nenhum carro configurado. Configure em KM Real para cálculos precisos.';
    }
}

function avaliarCorrida(e) {
    e.preventDefault();
    
    const corrida = {
        data: new Date().toISOString(),
        valor: parseFloat(document.getElementById('valorCorrida').value),
        distancia: parseFloat(document.getElementById('distancia').value),
        tempo: parseFloat(document.getElementById('tempo').value),
        origem: document.getElementById('origem').value || 'Origem desconhecida',
        destino: document.getElementById('destino').value || 'Destino desconhecido',
        categoria: document.getElementById('categoria').value,
        observacao: document.getElementById('observacao').value
    };
    
    const custoCorrida = corrida.distancia * state.custoKmReal;
    corrida.lucro = corrida.valor - custoCorrida;
    corrida.lucroHora = (corrida.lucro / corrida.tempo) * 60;
    corrida.lucroKm = corrida.lucro / corrida.distancia;
    corrida.velocidadeMedia = (corrida.distancia / corrida.tempo) * 60;
    
    calcularAvaliacaoCorrida(corrida);
    
    state.corridas.push(corrida);
    salvarDados();
    mostrarResultadoCorrida(corrida);
}

function calcularAvaliacaoCorrida(corrida) {
    // Lógica de classificação baseada em critérios reais
    let recomendacao = 'MEIO_TERMO';
    let motivos = [];
    
    // Critérios principais
    const lucroHoraIdeal = 50;
    const lucroKmIdeal = 2;
    
    // Verificar se compensa
    if (corrida.lucroHora >= lucroHoraIdeal && corrida.lucroKm >= lucroKmIdeal) {
        recomendacao = 'COMPENSA';
        motivos.push('Lucro/hora e lucro/km acima do esperado');
    } else if (corrida.lucroHora < 30 || corrida.lucroKm < 1 || corrida.lucro < 5) {
        recomendacao = 'NAO_COMPENSA';
        motivos.push('Lucro insuficiente para o esforço');
    } else {
        recomendacao = 'MEIO_TERMO';
        motivos.push('Corrida aceitável, mas não excelente');
    }
    
    // Detalhes adicionais
    if (corrida.lucroHora < 30) motivos.push('Lucro/hora baixo');
    if (corrida.lucroKm < 1) motivos.push('Lucro/km insuficiente');
    if (corrida.distancia > 20) motivos.push('Distância longa');
    if (corrida.velocidadeMedia < 20) motivos.push('Velocidade média baixa (trânsito?)');
    if (corrida.lucro <= 0) motivos.push('Sem lucro ou prejuízo');
    
    corrida.recomendacao = recomendacao;
    corrida.motivos = motivos;
    
    // Calcular nota de 0 a 100
    let nota = 50; // Base
    
    if (corrida.lucroHora >= lucroHoraIdeal) {
        nota += 25;
    } else if (corrida.lucroHora >= 30) {
        nota += 15;
    } else if (corrida.lucroHora >= 20) {
        nota += 5;
    }
    
    if (corrida.lucroKm >= lucroKmIdeal) {
        nota += 25;
    } else if (corrida.lucroKm >= 1) {
        nota += 15;
    } else if (corrida.lucroKm >= 0.5) {
        nota += 5;
    }
    
    corrida.nota = Math.min(Math.max(nota, 0), 100);
}

function mostrarResultadoCorrida(corrida) {
    const resultContainer = document.getElementById('resultadoCorrida');
    resultContainer.style.display = 'block';
    
    // Nota
    document.getElementById('notaValor').textContent = Math.round(corrida.nota);
    
    // Progresso circular
    const circle = document.querySelector('.progress-fill');
    if (circle) {
        const circumference = 2 * Math.PI * 45;
        const offset = circumference - (corrida.nota / 100) * circumference;
        circle.style.strokeDasharray = circumference;
        circle.style.strokeDashoffset = offset;
    }
    
    // Badge de recomendação
    const badge = document.getElementById('badgeRecomendacao');
    const recomendacaoTexto = {
        'COMPENSA': '✅ COMPENSA',
        'MEIO_TERMO': '⚠️ MEIO TERMO',
        'NAO_COMPENSA': '❌ NÃO COMPENSA'
    };
    
    badge.textContent = recomendacaoTexto[corrida.recomendacao] || 'ANALISAR';
    badge.className = `badge ${corrida.recomendacao.toLowerCase()}`;
    
    // Texto de recomendação
    const textoDetalhado = {
        'COMPENSA': 'Ótima oportunidade! Esta corrida oferece bom lucro considerando tempo e distância.',
        'MEIO_TERMO': 'Corrida aceitável. Considere se vale a pena neste momento.',
        'NAO_COMPENSA': 'Não compensa. O lucro é baixo demais para o tempo e custo investido.'
    };
    
    document.getElementById('textoRecomendacao').textContent = textoDetalhado[corrida.recomendacao] || 'Análise concluída';
    
    // Detalhes
    document.getElementById('lucroEstimado').textContent = `R$ ${corrida.lucro.toFixed(2)}`;
    document.getElementById('lucroHora').textContent = `R$ ${corrida.lucroHora.toFixed(2)}`;
    document.getElementById('lucroKm').textContent = `R$ ${corrida.lucroKm.toFixed(2)}`;
    document.getElementById('custoCorrida').textContent = `R$ ${(corrida.distancia * state.custoKmReal).toFixed(2)}`;
    
    // Motivos
    document.getElementById('motivoAnalise').textContent = corrida.motivos.join(' • ');
    
    // Scroll para resultado
    setTimeout(() => {
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

function salvarCorrida() {
    alert('Simulação salva no histórico!');
    document.getElementById('resultadoCorrida').style.display = 'none';
    document.getElementById('formCorrida').reset();
    carregarHistorico();
}

// =========================================================
// HISTÓRICO
// =========================================================

function carregarHistorico() {
    const tbody = document.getElementById('tabelaHistorico');
    
    if (state.corridas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Nenhuma simulação no histórico</td></tr>';
        return;
    }
    
    const historico = state.corridas.slice().reverse();
    tbody.innerHTML = historico.map((corrida, index) => `
        <tr>
            <td>${new Date(corrida.data).toLocaleDateString('pt-BR')}</td>
            <td>R$ ${corrida.valor.toFixed(2)}</td>
            <td>${corrida.distancia.toFixed(1)} km</td>
            <td>${corrida.tempo} min</td>
            <td>R$ ${corrida.lucro.toFixed(2)}</td>
            <td>R$ ${corrida.lucroHora.toFixed(2)}</td>
            <td><span class="badge ${corrida.recomendacao.toLowerCase()}">${corrida.recomendacao.replace('_', ' ')}</span></td>
            <td>
                <button class="btn-small" onclick="removerCorrida(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function removerCorrida(index) {
    if (confirm('Deseja remover esta simulação?')) {
        state.corridas.splice(state.corridas.length - 1 - index, 1);
        salvarDados();
        carregarHistorico();
    }
}

function limparHistorico() {
    if (confirm('Deseja limpar todo o histórico de simulações?')) {
        state.corridas = [];
        salvarDados();
        carregarHistorico();
        atualizarDashboard();
    }
}

function exportarCSV() {
    if (state.corridas.length === 0) {
        alert('Nenhuma simulação para exportar');
        return;
    }
    
    let csv = 'Data,Valor,Distância (km),Tempo (min),Lucro,Lucro/Hora,Lucro/km,Recomendação,Origem,Destino\n';
    
    state.corridas.forEach(corrida => {
        csv += `"${new Date(corrida.data).toLocaleDateString('pt-BR')}",`;
        csv += `"R$ ${corrida.valor.toFixed(2)}",`;
        csv += `"${corrida.distancia.toFixed(1)}",`;
        csv += `"${corrida.tempo}",`;
        csv += `"R$ ${corrida.lucro.toFixed(2)}",`;
        csv += `"R$ ${corrida.lucroHora.toFixed(2)}",`;
        csv += `"R$ ${corrida.lucroKm.toFixed(2)}",`;
        csv += `"${corrida.recomendacao}",`;
        csv += `"${corrida.origem}",`;
        csv += `"${corrida.destino}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `ubermax_simulacoes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// =========================================================
// DADOS LOCAIS
// =========================================================

function salvarDados() {
    const dados = {
        usuario: state.usuario,
        carro: state.carro,
        corridas: state.corridas,
        custoKmReal: state.custoKmReal
    };
    localStorage.setItem('ubermax_dados', JSON.stringify(dados));
}

function carregarDados() {
    const dados = localStorage.getItem('ubermax_dados');
    if (dados) {
        try {
            const parsed = JSON.parse(dados);
            state.usuario = parsed.usuario;
            state.carro = parsed.carro;
            state.corridas = parsed.corridas || [];
            state.custoKmReal = parsed.custoKmReal || 0.87;
        } catch (e) {
            console.error('Erro ao carregar dados:', e);
        }
    }
}

function limparDados() {
    if (confirm('Deseja limpar TODOS os dados salvos? Esta ação não pode ser desfeita.')) {
        state.usuario = null;
        state.carro = null;
        state.corridas = [];
        state.custoKmReal = 0.87;
        localStorage.removeItem('ubermax_dados');
        alert('Todos os dados foram limpos.');
        logout();
    }
}
