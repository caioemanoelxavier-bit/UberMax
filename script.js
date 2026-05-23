// ============================================
// UBERMAX IA - PROFESSIONAL DASHBOARD SCRIPT
// ============================================

// Estado da aplicação
const appState = {
    motorista: null,
    carro: null,
    corridas: [],
    charts: {}
};

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', () => {
    inicializarEventos();
    carregarDados();
    renderizarDashboard();
});

// ============================================
// NAVEGAÇÃO E EVENTOS
// ============================================

function inicializarEventos() {
    // Navegação por abas
    document.querySelectorAll('[data-tab]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = link.getAttribute('data-tab');
            mudarAba(tabName);
        });
    });

    // Formulários
    document.getElementById('formCarro').addEventListener('submit', salvarCarro);
    document.getElementById('formCorrida').addEventListener('submit', avaliarCorrida);

    // Botões
    document.getElementById('btnLogout').addEventListener('click', logout);
    document.getElementById('btnSalvarPerfil').addEventListener('click', salvarPerfil);
    document.getElementById('btnLimparDados').addEventListener('click', limparDados);
    document.getElementById('btnExportPDF').addEventListener('click', exportarPDF);
    document.getElementById('btnExportCSV').addEventListener('click', exportarCSV);

    // Filtros
    document.getElementById('filtroMes').addEventListener('change', filtrarHistorico);
    document.getElementById('filtroRecomendacao').addEventListener('change', filtrarHistorico);

    // Sidebar toggle
    document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);
}

function mudarAba(tabName) {
    // Remover active de todas as abas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('[data-tab]').forEach(link => {
        link.classList.remove('active');
    });

    // Ativar aba selecionada
    const tab = document.getElementById(tabName);
    if (tab) {
        tab.classList.add('active');
    }

    // Ativar link de navegação
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Atualizar título
    const titles = {
        'dashboard': 'Dashboard',
        'meu-carro': 'Meu Carro',
        'avaliar-corrida': 'Avaliar Corrida',
        'historico': 'Histórico',
        'relatorios': 'Relatórios',
        'configuracoes': 'Configurações'
    };
    document.getElementById('pageTitle').textContent = titles[tabName] || 'Dashboard';

    // Inicializar gráficos se necessário
    if (tabName === 'dashboard') {
        setTimeout(() => inicializarGraficos(), 100);
    }
}

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('collapsed');
}

// ============================================
// GERENCIAMENTO DE DADOS
// ============================================

function carregarDados() {
    const motorista = localStorage.getItem('motorista');
    const carro = localStorage.getItem('carro');
    const corridas = localStorage.getItem('corridas');

    if (motorista) {
        appState.motorista = JSON.parse(motorista);
        document.getElementById('userName').textContent = appState.motorista.nome || 'Motorista';
    }

    if (carro) {
        appState.carro = JSON.parse(carro);
    }

    if (corridas) {
        appState.corridas = JSON.parse(corridas);
    }
}

function salvarDados() {
    localStorage.setItem('motorista', JSON.stringify(appState.motorista));
    localStorage.setItem('carro', JSON.stringify(appState.carro));
    localStorage.setItem('corridas', JSON.stringify(appState.corridas));
}

// ============================================
// FORMULÁRIO: MEU CARRO
// ============================================

async function salvarCarro(e) {
    e.preventDefault();

    const formData = {
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

    // Calcular custos
    const custosCombustivel = (formData.precoCombustivel / formData.consumoMedio);
    const custosFixos = (formData.seguro + formData.ipva + formData.manutencao + formData.pneus + formData.oleoRevisao + formData.financiamento + formData.depreciacao) / formData.kmMediaMes;
    const custoTotal = custosCombustivel + custosFixos;

    formData.custoCombustivelKm = custosCombustivel;
    formData.custoFixoKm = custosFixos;
    formData.custoTotalKm = custoTotal;

    appState.carro = formData;
    salvarDados();

    // Mostrar resultado
    mostrarResultadoCarro();

    // Atualizar aviso na aba de corridas
    atualizarAvisoCustoKm();

    mostrarAlerta('success', 'Configuração do carro salva com sucesso!');
}

function mostrarResultadoCarro() {
    if (!appState.carro) return;

    const resultContainer = document.getElementById('resultadoCarro');
    resultContainer.style.display = 'block';

    document.getElementById('custoCombustivelKm').textContent = `R$ ${appState.carro.custoCombustivelKm.toFixed(2)}`;
    document.getElementById('custoFixoKm').textContent = `R$ ${appState.carro.custoFixoKm.toFixed(2)}`;
    document.getElementById('custoTotalKm').textContent = `R$ ${appState.carro.custoTotalKm.toFixed(2)}`;

    // Atualizar KPI
    document.getElementById('custoKm').textContent = `R$ ${appState.carro.custoTotalKm.toFixed(2)}`;

    // Gráfico de breakdown
    renderizarBreakdownChart();
}

function renderizarBreakdownChart() {
    if (!appState.carro) return;

    const ctx = document.getElementById('breakdownChart');
    if (!ctx) return;

    const carro = appState.carro;
    const custos = {
        'Combustível': carro.precoCombustivel * (carro.kmMediaMes / carro.consumoMedio),
        'Seguro': carro.seguro,
        'IPVA': carro.ipva,
        'Manutenção': carro.manutencao,
        'Pneus': carro.pneus,
        'Óleo/Revisão': carro.oleoRevisao,
        'Financiamento': carro.financiamento,
        'Depreciação': carro.depreciacao
    };

    if (appState.charts.breakdown) {
        appState.charts.breakdown.destroy();
    }

    appState.charts.breakdown = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(custos),
            datasets: [{
                data: Object.values(custos),
                backgroundColor: [
                    '#667eea',
                    '#764ba2',
                    '#f093fb',
                    '#f5576c',
                    '#43e97b',
                    '#4facfe',
                    '#fa709a',
                    '#fee140'
                ],
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function atualizarAvisoCustoKm() {
    const aviso = document.getElementById('avisoCustoKm');
    const texto = document.getElementById('textoAvisoCustoKm');

    if (appState.carro) {
        aviso.style.display = 'flex';
        aviso.classList.remove('alert-info');
        aviso.classList.add('alert-success');
        texto.textContent = `Usando custo configurado: R$ ${appState.carro.custoTotalKm.toFixed(2)}/km`;
    } else {
        aviso.style.display = 'flex';
        aviso.classList.add('alert-info');
        aviso.classList.remove('alert-success');
        texto.textContent = `Nenhum carro configurado. Usando custo padrão: R$ 0,87/km`;
    }
}

// ============================================
// FORMULÁRIO: AVALIAR CORRIDA
// ============================================

async function avaliarCorrida(e) {
    e.preventDefault();

    const formData = {
        data: new Date().toISOString(),
        valor: parseFloat(document.getElementById('valorCorrida').value),
        distancia: parseFloat(document.getElementById('distancia').value),
        tempo: parseFloat(document.getElementById('tempo').value),
        origem: document.getElementById('origem').value,
        destino: document.getElementById('destino').value,
        categoria: document.getElementById('categoria').value,
        observacao: document.getElementById('observacao').value
    };

    // Calcular custo
    const custoKm = appState.carro ? appState.carro.custoTotalKm : 0.87;
    const custoEstimado = formData.distancia * custoKm;
    const lucroEstimado = formData.valor - custoEstimado;
    const lucroHora = (lucroEstimado / formData.tempo) * 60;
    const lucroKm = lucroEstimado / formData.distancia;

    formData.custoEstimado = custoEstimado;
    formData.lucroEstimado = lucroEstimado;
    formData.lucroHora = lucroHora;
    formData.lucroKm = lucroKm;

    // Calcular avaliação
    const avaliacao = calcularAvaliacao(formData);
    formData.nota = avaliacao.nota;
    formData.recomendacao = avaliacao.recomendacao;
    formData.motivo = avaliacao.motivo;

    appState.corridas.push(formData);
    salvarDados();

    // Mostrar resultado
    mostrarResultadoCorrida(formData);

    // Limpar formulário
    document.getElementById('formCorrida').reset();
    atualizarAvisoCustoKm();

    mostrarAlerta('success', 'Corrida avaliada com sucesso!');
}

function calcularAvaliacao(corrida) {
    let nota = 0;
    let motivos = [];

    // Critério 1: Lucro por hora (35%)
    if (corrida.lucroHora >= 50) {
        nota += 35;
        motivos.push('Lucro/hora excelente');
    } else if (corrida.lucroHora >= 35) {
        nota += 25;
        motivos.push('Lucro/hora bom');
    } else if (corrida.lucroHora >= 20) {
        nota += 15;
        motivos.push('Lucro/hora aceitável');
    } else {
        nota += 5;
        motivos.push('Lucro/hora baixo');
    }

    // Critério 2: Lucro por KM (30%)
    if (corrida.lucroKm >= 3) {
        nota += 30;
        motivos.push('Lucro/km excelente');
    } else if (corrida.lucroKm >= 2) {
        nota += 22;
        motivos.push('Lucro/km bom');
    } else if (corrida.lucroKm >= 1) {
        nota += 12;
        motivos.push('Lucro/km aceitável');
    } else {
        nota += 3;
        motivos.push('Lucro/km baixo');
    }

    // Critério 3: Distância (15%)
    if (corrida.distancia <= 5) {
        nota += 15;
        motivos.push('Distância curta (eficiente)');
    } else if (corrida.distancia <= 15) {
        nota += 12;
    } else if (corrida.distancia <= 30) {
        nota += 8;
    } else {
        nota += 3;
        motivos.push('Distância longa');
    }

    // Critério 4: Tempo (10%)
    const velocidadeMedia = (corrida.distancia / corrida.tempo) * 60;
    if (velocidadeMedia >= 40) {
        nota += 10;
        motivos.push('Velocidade média boa');
    } else if (velocidadeMedia >= 25) {
        nota += 7;
    } else {
        nota += 3;
        motivos.push('Trânsito intenso');
    }

    // Critério 5: Valor (10%)
    if (corrida.valor >= 50) {
        nota += 10;
        motivos.push('Valor alto');
    } else if (corrida.valor >= 30) {
        nota += 7;
    } else {
        nota += 3;
    }

    // Determinar recomendação
    let recomendacao = 'evitar';
    if (nota >= 70) {
        recomendacao = 'aceitar';
    } else if (nota >= 50) {
        recomendacao = 'pensar';
    }

    return {
        nota: Math.min(100, Math.round(nota)),
        recomendacao,
        motivo: motivos.slice(0, 3).join(' • ')
    };
}

function mostrarResultadoCorrida(corrida) {
    const resultContainer = document.getElementById('resultadoCorrida');
    resultContainer.style.display = 'block';

    document.getElementById('notaValor').textContent = corrida.nota;
    document.getElementById('badgeRecomendacao').textContent = corrida.recomendacao.toUpperCase();
    document.getElementById('badgeRecomendacao').className = `badge ${corrida.recomendacao}`;
    document.getElementById('textoRecomendacao').textContent = corrida.motivo;

    document.getElementById('lucroEstimado').textContent = `R$ ${corrida.lucroEstimado.toFixed(2)}`;
    document.getElementById('lucroHora').textContent = `R$ ${corrida.lucroHora.toFixed(2)}`;
    document.getElementById('lucroKm').textContent = `R$ ${corrida.lucroKm.toFixed(2)}`;
    document.getElementById('motivoAvaliacao').textContent = corrida.motivo;

    // Atualizar gráfico de progresso
    atualizarProgressoCirculo(corrida.nota);
}

function atualizarProgressoCirculo(nota) {
    const percentual = (nota / 100) * 283;
    const circulo = document.querySelector('.progress-fill');
    if (circulo) {
        circulo.style.strokeDashoffset = 283 - percentual;
    }
}

// ============================================
// HISTÓRICO
// ============================================

function filtrarHistorico() {
    const mes = document.getElementById('filtroMes').value;
    const recomendacao = document.getElementById('filtroRecomendacao').value;

    let corridasFiltradas = appState.corridas;

    if (mes) {
        corridasFiltradas = corridasFiltradas.filter(c => {
            const dataCorrida = new Date(c.data);
            const mesAno = `${dataCorrida.getFullYear()}-${String(dataCorrida.getMonth() + 1).padStart(2, '0')}`;
            return mesAno === mes;
        });
    }

    if (recomendacao) {
        corridasFiltradas = corridasFiltradas.filter(c => c.recomendacao === recomendacao);
    }

    renderizarHistorico(corridasFiltradas);
}

function renderizarHistorico(corridas) {
    const container = document.getElementById('historicoList');

    if (corridas.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>Nenhuma corrida encontrada</p></div>';
        return;
    }

    container.innerHTML = corridas.map(c => `
        <div class="historico-item">
            <div>
                <strong>${c.origem} → ${c.destino}</strong>
                <p>${new Date(c.data).toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
                <span class="badge ${c.recomendacao}">${c.recomendacao.toUpperCase()}</span>
            </div>
            <div>
                <strong>R$ ${c.valor.toFixed(2)}</strong>
                <p>Lucro: R$ ${c.lucroEstimado.toFixed(2)}</p>
            </div>
            <div>
                <strong>${c.nota}</strong>
                <p>Nota</p>
            </div>
        </div>
    `).join('');
}

// ============================================
// DASHBOARD E GRÁFICOS
// ============================================

function renderizarDashboard() {
    atualizarKPIs();
    atualizarAvisoCustoKm();
    inicializarGraficos();
    renderizarTabelaRecentes();
}

function atualizarKPIs() {
    let ganhoTotal = 0;
    let kmRodados = 0;
    let notaMedia = 0;

    if (appState.corridas.length > 0) {
        ganhoTotal = appState.corridas.reduce((sum, c) => sum + c.valor, 0);
        kmRodados = appState.corridas.reduce((sum, c) => sum + c.distancia, 0);
        notaMedia = appState.corridas.reduce((sum, c) => sum + c.nota, 0) / appState.corridas.length;
    }

    document.getElementById('ganhoTotal').textContent = `R$ ${ganhoTotal.toFixed(2)}`;
    document.getElementById('kmRodados').textContent = `${kmRodados.toFixed(1)} km`;
    document.getElementById('notaMedia').textContent = `${notaMedia.toFixed(1)}`;
}

function inicializarGraficos() {
    inicializarGraficoGanhosCustos();
    inicializarGraficoRecomendacoes();
}

function inicializarGraficoGanhosCustos() {
    const ctx = document.getElementById('ganhosCustosChart');
    if (!ctx) return;

    const dias = [];
    const ganhos = [];
    const custos = [];

    for (let i = 6; i >= 0; i--) {
        const data = new Date();
        data.setDate(data.getDate() - i);
        const dia = data.toLocaleDateString('pt-BR', { weekday: 'short' });
        dias.push(dia);

        const corridasDia = appState.corridas.filter(c => {
            const dataCorrida = new Date(c.data);
            return dataCorrida.toDateString() === data.toDateString();
        });

        const ganho = corridasDia.reduce((sum, c) => sum + c.valor, 0);
        const custo = corridasDia.reduce((sum, c) => sum + c.custoEstimado, 0);

        ganhos.push(ganho);
        custos.push(custo);
    }

    if (appState.charts.ganhosCustos) {
        appState.charts.ganhosCustos.destroy();
    }

    appState.charts.ganhosCustos = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dias,
            datasets: [
                {
                    label: 'Ganhos',
                    data: ganhos,
                    backgroundColor: 'rgba(67, 233, 123, 0.8)',
                    borderColor: '#43e97b',
                    borderWidth: 1
                },
                {
                    label: 'Custos',
                    data: custos,
                    backgroundColor: 'rgba(245, 87, 108, 0.8)',
                    borderColor: '#f5576c',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
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

function inicializarGraficoRecomendacoes() {
    const ctx = document.getElementById('recomendacoesChart');
    if (!ctx) return;

    const aceitar = appState.corridas.filter(c => c.recomendacao === 'aceitar').length;
    const pensar = appState.corridas.filter(c => c.recomendacao === 'pensar').length;
    const evitar = appState.corridas.filter(c => c.recomendacao === 'evitar').length;

    if (appState.charts.recomendacoes) {
        appState.charts.recomendacoes.destroy();
    }

    appState.charts.recomendacoes = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Aceitar', 'Pensar', 'Evitar'],
            datasets: [{
                data: [aceitar, pensar, evitar],
                backgroundColor: [
                    '#43e97b',
                    '#f5576c',
                    '#a0aec0'
                ],
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function renderizarTabelaRecentes() {
    const tbody = document.getElementById('tabelaCorridasRecentes');

    if (appState.corridas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Nenhuma corrida avaliada ainda</td></tr>';
        return;
    }

    const recentes = appState.corridas.slice(-5).reverse();

    tbody.innerHTML = recentes.map(c => `
        <tr>
            <td>${new Date(c.data).toLocaleDateString('pt-BR')}</td>
            <td>${c.origem}</td>
            <td>${c.destino}</td>
            <td>R$ ${c.valor.toFixed(2)}</td>
            <td>R$ ${c.lucroEstimado.toFixed(2)}</td>
            <td><strong>${c.nota}</strong></td>
            <td><span class="badge ${c.recomendacao}">${c.recomendacao.toUpperCase()}</span></td>
        </tr>
    `).join('');
}

// ============================================
// CONFIGURAÇÕES
// ============================================

function salvarPerfil() {
    const nome = document.getElementById('nomeConfig').value;
    if (appState.motorista) {
        appState.motorista.nome = nome;
        salvarDados();
        document.getElementById('userName').textContent = nome;
        mostrarAlerta('success', 'Perfil atualizado com sucesso!');
    }
}

function limparDados() {
    if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
        localStorage.clear();
        appState.corridas = [];
        appState.carro = null;
        location.reload();
    }
}

function logout() {
    if (confirm('Deseja realmente sair?')) {
        localStorage.clear();
        location.reload();
    }
}

// ============================================
// EXPORTAÇÃO
// ============================================

function exportarPDF() {
    mostrarAlerta('info', 'Funcionalidade de exportação PDF em desenvolvimento');
}

function exportarCSV() {
    if (appState.corridas.length === 0) {
        mostrarAlerta('warning', 'Nenhuma corrida para exportar');
        return;
    }

    let csv = 'Data,Origem,Destino,Valor,Distância,Tempo,Lucro,Nota,Recomendação\n';

    appState.corridas.forEach(c => {
        csv += `${new Date(c.data).toLocaleDateString('pt-BR')},${c.origem},${c.destino},${c.valor},${c.distancia},${c.tempo},${c.lucroEstimado},${c.nota},${c.recomendacao}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ubermax-corridas-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    mostrarAlerta('success', 'Arquivo exportado com sucesso!');
}

// ============================================
// UTILITÁRIOS
// ============================================

function mostrarAlerta(tipo, mensagem) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${tipo}`;
    alert.innerHTML = `<i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : tipo === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i><span>${mensagem}</span>`;

    const container = document.querySelector('.content') || document.body;
    container.insertBefore(alert, container.firstChild);

    setTimeout(() => alert.remove(), 4000);
}

// Inicializar ao carregar
window.addEventListener('load', () => {
    renderizarDashboard();
});
