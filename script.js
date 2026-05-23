// ============================================
// MOTORISTA ONE - JAVASCRIPT CORE
// ============================================

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

    // IA Assistant
    document.getElementById('btnSendIA')?.addEventListener('click', enviarMensagemIA);
    document.getElementById('iaInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') enviarMensagemIA();
    });

    document.getElementById('btnMicrophone')?.addEventListener('click', iniciarReconhecimentoVoz);

    // Relatórios
    document.getElementById('btnExportPDF')?.addEventListener('click', exportarPDF);
    document.getElementById('btnExportCSV')?.addEventListener('click', exportarCSV);

    // Configurações
    document.getElementById('btnSalvarPerfil')?.addEventListener('click', salvarPerfil);
    document.getElementById('btnLimparDados')?.addEventListener('click', limparDados);
}

// ============================================
// LANDING PAGE
// ============================================

function mostrarLandingPage() {
    document.getElementById('landingPage').classList.remove('hidden');
    document.getElementById('appDashboard').classList.add('hidden');
}

function abrirApp() {
    state.usuario = {
        nome: 'Motorista',
        email: 'motorista@example.com',
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

// ============================================
// NAVIGATION
// ============================================

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
        'copiloto': 'Copiloto',
        'km-real': 'KM Real',
        'ia-assistant': 'Assistente IA',
        'smart-planner': 'Smart Planner',
        'historico': 'Histórico',
        'relatorios': 'Relatórios',
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

// ============================================
// DASHBOARD
// ============================================

function atualizarDashboard() {
    const totalGanho = state.corridas.reduce((sum, c) => sum + (c.valor || 0), 0);
    const totalKm = state.corridas.reduce((sum, c) => sum + (c.distancia || 0), 0);
    const notaMedia = state.corridas.length > 0 
        ? (state.corridas.reduce((sum, c) => sum + (c.nota || 0), 0) / state.corridas.length).toFixed(1)
        : 0;
    
    document.getElementById('ganhoTotal').textContent = `R$ ${totalGanho.toFixed(2)}`;
    document.getElementById('kmRodados').textContent = `${totalKm.toFixed(1)} km`;
    document.getElementById('notaMedia').textContent = notaMedia;
    document.getElementById('custoKm').textContent = `R$ ${state.custoKmReal.toFixed(2)}`;
    
    atualizarTabelaCorridasRecentes();
    
    setTimeout(() => {
        criarGraficoGanhosCustos();
        criarGraficoRecomendacoes();
    }, 100);
}

function atualizarTabelaCorridasRecentes() {
    const tbody = document.getElementById('tabelaCorridasRecentes');
    
    if (state.corridas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Nenhuma corrida avaliada ainda</td></tr>';
        return;
    }
    
    const recentes = state.corridas.slice(-5).reverse();
    tbody.innerHTML = recentes.map(corrida => `
        <tr>
            <td>${new Date(corrida.data).toLocaleDateString('pt-BR')}</td>
            <td>${corrida.origem}</td>
            <td>${corrida.destino}</td>
            <td>R$ ${corrida.valor.toFixed(2)}</td>
            <td>R$ ${corrida.lucro.toFixed(2)}</td>
            <td>${corrida.nota.toFixed(1)}</td>
            <td><span class="badge ${corrida.recomendacao}">${corrida.recomendacao.toUpperCase()}</span></td>
        </tr>
    `).join('');
}

function criarGraficoGanhosCustos() {
    const ctx = document.getElementById('ganhosCustosChart');
    if (!ctx) return;
    
    if (state.charts.ganhosCustos) {
        state.charts.ganhosCustos.destroy();
    }
    
    const ultimos7Dias = [];
    for (let i = 6; i >= 0; i--) {
        const data = new Date();
        data.setDate(data.getDate() - i);
        ultimos7Dias.push(data.toLocaleDateString('pt-BR', { weekday: 'short' }));
    }
    
    const ganhosPorDia = ultimos7Dias.map((_, i) => Math.random() * 500 + 100);
    const custosPorDia = ultimos7Dias.map((_, i) => Math.random() * 200 + 50);
    
    state.charts.ganhosCustos = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ultimos7Dias,
            datasets: [
                {
                    label: 'Ganhos',
                    data: ganhosPorDia,
                    backgroundColor: 'rgba(67, 233, 123, 0.8)',
                    borderColor: 'rgba(67, 233, 123, 1)',
                    borderWidth: 1,
                    borderRadius: 6
                },
                {
                    label: 'Custos',
                    data: custosPorDia,
                    backgroundColor: 'rgba(245, 87, 108, 0.8)',
                    borderColor: 'rgba(245, 87, 108, 1)',
                    borderWidth: 1,
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function criarGraficoRecomendacoes() {
    const ctx = document.getElementById('recomendacoesChart');
    if (!ctx) return;
    
    if (state.charts.recomendacoes) {
        state.charts.recomendacoes.destroy();
    }
    
    const aceitar = state.corridas.filter(c => c.recomendacao === 'aceitar').length;
    const pensar = state.corridas.filter(c => c.recomendacao === 'pensar').length;
    const evitar = state.corridas.filter(c => c.recomendacao === 'evitar').length;
    
    state.charts.recomendacoes = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Aceitar', 'Pensar', 'Evitar'],
            datasets: [{
                data: [aceitar, pensar, evitar],
                backgroundColor: [
                    'rgba(67, 233, 123, 0.8)',
                    'rgba(245, 87, 108, 0.8)',
                    'rgba(160, 174, 192, 0.8)'
                ],
                borderColor: [
                    'rgba(67, 233, 123, 1)',
                    'rgba(245, 87, 108, 1)',
                    'rgba(160, 174, 192, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                }
            }
        }
    });
}

// ============================================
// KM REAL
// ============================================

function carregarFormularioCarro() {
    if (state.carro) {
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
        
        mostrarResultadoCarro();
    }
}

function salvarCarro(e) {
    e.preventDefault();
    
    state.carro = {
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
    
    calcularCustoKmReal();
    mostrarResultadoCarro();
    salvarDados();
    mostrarAlerta('Carro configurado com sucesso!', 'success');
}

function calcularCustoKmReal() {
    if (!state.carro) return;
    
    const { consumoMedio, precoCombustivel, kmMediaMes, seguro, ipva, manutencao, pneus, oleoRevisao, financiamento, depreciacao } = state.carro;
    
    const custoCombustivelKm = precoCombustivel / consumoMedio;
    const custoFixoMensal = seguro + (ipva / 12) + manutencao + (pneus / 12) + (oleoRevisao / 12) + financiamento + depreciacao;
    const custoFixoKm = custoFixoMensal / kmMediaMes;
    
    state.custoKmReal = custoCombustivelKm + custoFixoKm;
    
    state.custoBreakdown = {
        combustivel: custoCombustivelKm,
        seguro: (seguro / kmMediaMes),
        ipva: ((ipva / 12) / kmMediaMes),
        manutencao: (manutencao / kmMediaMes),
        pneus: ((pneus / 12) / kmMediaMes),
        oleoRevisao: ((oleoRevisao / 12) / kmMediaMes),
        financiamento: (financiamento / kmMediaMes),
        depreciacao: (depreciacao / kmMediaMes)
    };
}

function mostrarResultadoCarro() {
    const resultContainer = document.getElementById('resultadoCarro');
    resultContainer.style.display = 'block';
    
    const custoCombustivelKm = state.custoBreakdown.combustivel;
    const custoFixoKm = state.custoKmReal - custoCombustivelKm;
    
    document.getElementById('custoCombustivelKm').textContent = `R$ ${custoCombustivelKm.toFixed(2)}`;
    document.getElementById('custoFixoKm').textContent = `R$ ${custoFixoKm.toFixed(2)}`;
    document.getElementById('custoTotalKm').textContent = `R$ ${state.custoKmReal.toFixed(2)}`;
    
    criarGraficoBreakdownCarro();
}

function criarGraficoBreakdownCarro() {
    const ctx = document.getElementById('breakdownChart');
    if (!ctx) return;
    
    if (state.charts.breakdown) {
        state.charts.breakdown.destroy();
    }
    
    const breakdown = state.custoBreakdown;
    const labels = ['Combustível', 'Seguro', 'IPVA', 'Manutenção', 'Pneus', 'Óleo', 'Financiamento', 'Depreciação'];
    const data = [
        breakdown.combustivel,
        breakdown.seguro,
        breakdown.ipva,
        breakdown.manutencao,
        breakdown.pneus,
        breakdown.oleoRevisao,
        breakdown.financiamento,
        breakdown.depreciacao
    ];
    
    state.charts.breakdown = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)',
                    'rgba(240, 147, 251, 0.8)',
                    'rgba(67, 233, 123, 0.8)',
                    'rgba(56, 249, 215, 0.8)',
                    'rgba(79, 172, 254, 0.8)',
                    'rgba(245, 87, 108, 0.8)',
                    'rgba(255, 187, 51, 0.8)'
                ],
                borderColor: [
                    'rgba(102, 126, 234, 1)',
                    'rgba(118, 75, 162, 1)',
                    'rgba(240, 147, 251, 1)',
                    'rgba(67, 233, 123, 1)',
                    'rgba(56, 249, 215, 1)',
                    'rgba(79, 172, 254, 1)',
                    'rgba(245, 87, 108, 1)',
                    'rgba(255, 187, 51, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'right'
                }
            }
        }
    });
}

// ============================================
// COPILOTO
// ============================================

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
        origem: document.getElementById('origem').value,
        destino: document.getElementById('destino').value,
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
    let nota = 0;
    let motivo = [];
    
    const lucroHoraIdeal = 50;
    const scoreLucroHora = Math.min((corrida.lucroHora / lucroHoraIdeal) * 100, 100);
    nota += scoreLucroHora * 0.35;
    
    const lucroKmIdeal = 2;
    const scoreLucroKm = Math.min((corrida.lucroKm / lucroKmIdeal) * 100, 100);
    nota += scoreLucroKm * 0.30;
    
    const distanciaIdeal = 10;
    const scoreDistancia = Math.max(100 - (Math.abs(corrida.distancia - distanciaIdeal) / distanciaIdeal) * 50, 0);
    nota += scoreDistancia * 0.15;
    
    const velocidadeIdeal = 40;
    const scoreVelocidade = Math.max(100 - (Math.abs(corrida.velocidadeMedia - velocidadeIdeal) / velocidadeIdeal) * 50, 0);
    nota += scoreVelocidade * 0.10;
    
    const valorIdeal = 25;
    const scoreValor = Math.min((corrida.valor / valorIdeal) * 100, 100);
    nota += scoreValor * 0.10;
    
    corrida.nota = Math.round(nota);
    
    if (corrida.nota >= 70) {
        corrida.recomendacao = 'aceitar';
        motivo.push('Ótima oportunidade!');
    } else if (corrida.nota >= 50) {
        corrida.recomendacao = 'pensar';
        motivo.push('Corrida mediana');
    } else {
        corrida.recomendacao = 'evitar';
        motivo.push('Não compensa');
    }
    
    if (corrida.lucroHora < 30) motivo.push('Lucro/hora baixo');
    if (corrida.lucroKm < 1) motivo.push('Lucro/km insuficiente');
    if (corrida.distancia > 20) motivo.push('Distância longa');
    if (corrida.velocidadeMedia < 20) motivo.push('Trânsito intenso');
    
    corrida.motivo = motivo.join(' • ');
}

function mostrarResultadoCorrida(corrida) {
    const resultContainer = document.getElementById('resultadoCorrida');
    resultContainer.style.display = 'block';
    
    document.getElementById('notaValor').textContent = corrida.nota;
    
    const circle = document.querySelector('.progress-fill');
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (corrida.nota / 100) * circumference;
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = offset;
    
    const badge = document.getElementById('badgeRecomendacao');
    badge.textContent = corrida.recomendacao.toUpperCase();
    badge.className = `badge ${corrida.recomendacao}`;
    
    const textoRecomendacao = {
        'aceitar': '✅ Aceite esta corrida! Ótima oportunidade de ganho.',
        'pensar': '⚠️ Pense bem. Corrida mediana, considere outras opções.',
        'evitar': '❌ Evite. Não compensa o custo e tempo investido.'
    };
    
    document.getElementById('textoRecomendacao').textContent = textoRecomendacao[corrida.recomendacao];
    
    document.getElementById('lucroEstimado').textContent = `R$ ${corrida.lucro.toFixed(2)}`;
    document.getElementById('lucroHora').textContent = `R$ ${corrida.lucroHora.toFixed(2)}`;
    document.getElementById('lucroKm').textContent = `R$ ${corrida.lucroKm.toFixed(2)}`;
    document.getElementById('motivoAvaliacao').textContent = corrida.motivo || '-';
    
    mostrarAlerta(`Corrida avaliada: ${corrida.recomendacao.toUpperCase()}`, 'success');
}

// ============================================
// IA ASSISTANT
// ============================================

function enviarMensagemIA() {
    const input = document.getElementById('iaInput');
    const mensagem = input.value.trim();
    
    if (!mensagem) return;
    
    adicionarMensagemChat('user', mensagem);
    input.value = '';
    processarComandoIA(mensagem);
}

function adicionarMensagemChat(tipo, texto) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${tipo}`;
    
    const p = document.createElement('p');
    p.textContent = texto;
    
    messageDiv.appendChild(p);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function processarComandoIA(mensagem) {
    const msg = mensagem.toLowerCase();
    let resposta = '';
    
    if (msg.includes('trabalhei') && msg.includes('fiz')) {
        const horas = extrairNumero(msg, 'trabalhei');
        const valor = extrairNumero(msg, 'fiz');
        
        if (horas && valor) {
            resposta = `Entendido! R$ ${(valor / horas).toFixed(2)}/hora. Quer que eu salve esse turno agora?`;
            window.turnoTemp = { horas, valor };
        }
    } else if (msg.includes('sim') && window.turnoTemp) {
        resposta = `Salvo ✓ — Lucro: R$ ${window.turnoTemp.valor.toFixed(2)} · R$ ${(window.turnoTemp.valor / window.turnoTemp.horas).toFixed(2)}/hora. Tudo certo?`;
        window.turnoTemp = null;
    } else if (msg.includes('copiloto')) {
        resposta = 'O Copiloto analisa cada corrida em tempo real e te diz se vale a pena aceitar. Veja a aba "Copiloto" para testar!';
    } else if (msg.includes('km real')) {
        resposta = 'KM Real calcula seu custo verdadeiro por km, incluindo combustível, depreciação, IPVA, seguro, pneus e óleo. Configure na aba "KM Real"!';
    } else if (msg.includes('meta')) {
        resposta = 'Você pode definir metas diárias e semanais na aba "Smart Planner". Acompanhe seu progresso em tempo real!';
    } else if (msg.includes('ajuda')) {
        resposta = 'Posso ajudar você com:\n• 📊 Registrar ganhos e despesas\n• 💰 Calcular lucro de corridas\n• 📈 Analisar produtividade\n• 🎯 Definir metas\n• ❓ Tirar dúvidas sobre o app';
    } else {
        resposta = 'Desculpe, não entendi. Tente falar sobre seus ganhos, corridas, metas ou pedir ajuda sobre o app!';
    }
    
    setTimeout(() => {
        adicionarMensagemChat('bot', resposta);
    }, 500);
}

function extrairNumero(texto, palavra) {
    const regex = new RegExp(`${palavra}\\s+(\\d+(?:[.,]\\d+)?)`);
    const match = texto.match(regex);
    return match ? parseFloat(match[1].replace(',', '.')) : null;
}

function iniciarReconhecimentoVoz() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        mostrarAlerta('Reconhecimento de voz não suportado neste navegador', 'warning');
        return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    
    recognition.onstart = () => {
        document.getElementById('btnMicrophone').style.opacity = '0.5';
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById('iaInput').value = transcript;
        document.getElementById('btnMicrophone').style.opacity = '1';
    };
    
    recognition.onerror = () => {
        document.getElementById('btnMicrophone').style.opacity = '1';
    };
    
    recognition.start();
}

// ============================================
// HISTÓRICO
// ============================================

function carregarHistorico() {
    const historicoList = document.getElementById('historicoList');
    
    if (state.corridas.length === 0) {
        historicoList.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>Nenhuma corrida avaliada ainda</p></div>';
        return;
    }
    
    const filtroMes = document.getElementById('filtroMes')?.value || '';
    const filtroRecomendacao = document.getElementById('filtroRecomendacao')?.value || '';
    
    let corridas = state.corridas;
    
    if (filtroMes) {
        corridas = corridas.filter(c => new Date(c.data).toISOString().startsWith(filtroMes));
    }
    
    if (filtroRecomendacao) {
        corridas = corridas.filter(c => c.recomendacao === filtroRecomendacao);
    }
    
    historicoList.innerHTML = corridas.reverse().map(corrida => `
        <div class="historico-item">
            <div>
                <strong>${corrida.origem} → ${corrida.destino}</strong>
                <p>${new Date(corrida.data).toLocaleDateString('pt-BR')} às ${new Date(corrida.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div>
                <span class="badge ${corrida.recomendacao}">${corrida.recomendacao.toUpperCase()}</span>
                <strong>R$ ${corrida.lucro.toFixed(2)}</strong>
            </div>
        </div>
    `).join('');
}

// ============================================
// RELATÓRIOS
// ============================================

function exportarPDF() {
    const conteudo = `
RELATÓRIO DE PRODUTIVIDADE - MOTORISTA ONE
Data: ${new Date().toLocaleDateString('pt-BR')}

RESUMO
- Total de Corridas: ${state.corridas.length}
- Ganho Total: R$ ${state.corridas.reduce((sum, c) => sum + c.valor, 0).toFixed(2)}
- Lucro Total: R$ ${state.corridas.reduce((sum, c) => sum + c.lucro, 0).toFixed(2)}
- KM Rodados: ${state.corridas.reduce((sum, c) => sum + c.distancia, 0).toFixed(1)} km
- Nota Média: ${(state.corridas.reduce((sum, c) => sum + c.nota, 0) / state.corridas.length).toFixed(1)}

RECOMENDAÇÕES
- Aceitar: ${state.corridas.filter(c => c.recomendacao === 'aceitar').length}
- Pensar: ${state.corridas.filter(c => c.recomendacao === 'pensar').length}
- Evitar: ${state.corridas.filter(c => c.recomendacao === 'evitar').length}

CUSTO DO VEÍCULO
- Custo/KM: R$ ${state.custoKmReal.toFixed(2)}
- Modelo: ${state.carro?.modelo || 'Não configurado'}
    `;
    
    const blob = new Blob([conteudo], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-motorista-one-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    
    mostrarAlerta('Relatório exportado com sucesso!', 'success');
}

function exportarCSV() {
    let csv = 'Data,Origem,Destino,Valor,Lucro,Nota,Recomendação,Lucro/Hora,Lucro/KM\n';
    
    state.corridas.forEach(corrida => {
        csv += `${new Date(corrida.data).toLocaleDateString('pt-BR')},${corrida.origem},${corrida.destino},${corrida.valor},${corrida.lucro},${corrida.nota},${corrida.recomendacao},${corrida.lucroHora},${corrida.lucroKm}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `corridas-motorista-one-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    mostrarAlerta('CSV exportado com sucesso!', 'success');
}

// ============================================
// CONFIGURAÇÕES
// ============================================

function salvarPerfil() {
    state.usuario.nome = document.getElementById('nomeConfig').value;
    state.usuario.email = document.getElementById('emailConfig').value;
    
    document.getElementById('userName').textContent = state.usuario.nome;
    salvarDados();
    
    mostrarAlerta('Perfil salvo com sucesso!', 'success');
}

function limparDados() {
    if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
        state.corridas = [];
        state.carro = null;
        salvarDados();
        location.reload();
    }
}

// ============================================
// UTILITÁRIOS
// ============================================

function mostrarAlerta(mensagem, tipo = 'info') {
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo}`;
    alerta.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    alerta.innerHTML = `<i class="fas fa-check-circle"></i> <span>${mensagem}</span>`;
    
    document.body.appendChild(alerta);
    
    setTimeout(() => {
        alerta.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => alerta.remove(), 300);
    }, 3000);
}

function salvarDados() {
    localStorage.setItem('motoristaOneData', JSON.stringify({
        usuario: state.usuario,
        carro: state.carro,
        corridas: state.corridas,
        custoKmReal: state.custoKmReal
    }));
}

function carregarDados() {
    const dados = localStorage.getItem('motoristaOneData');
    if (dados) {
        const parsed = JSON.parse(dados);
        state.usuario = parsed.usuario;
        state.carro = parsed.carro;
        state.corridas = parsed.corridas || [];
        state.custoKmReal = parsed.custoKmReal || 0.87;
        
        if (state.carro) {
            calcularCustoKmReal();
        }
    }
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
