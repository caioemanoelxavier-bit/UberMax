# UberMax - Simulador de Corridas para Motoristas

**Status:** Projeto em desenvolvimento (Fase 1)

UberMax é uma ferramenta web para motoristas de aplicativo analisarem se uma corrida compensa ou não, com base em valor da corrida, distância, tempo, custo real por km e lucro estimado.

## 🎯 Objetivo

Ajudar motoristas a tomar decisões melhores sobre quais corridas aceitar, fornecendo uma análise rápida e honesta do lucro real de cada oferta.

## ✨ Funcionalidades Atuais (Fase 1)

- **Simulador Manual de Corridas**: Insira os dados de uma corrida e receba uma análise
- **Cálculo de Custo Real por KM**: Configure seu veículo e descubra quanto custa realmente cada quilômetro
- **Classificação de Corridas**: Receba recomendações (COMPENSA, MEIO TERMO, NÃO COMPENSA)
- **Histórico Local**: Mantenha registro de todas as simulações no seu navegador
- **Exportar para CSV**: Baixe seus dados em formato CSV

## 🚀 Como Usar

### Instalação Local

1. **Clone o repositório:**
```bash
git clone https://github.com/caioemanoelxavier-bit/UberMax.git
cd UberMax
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure o arquivo `.env`:**
```bash
cp .env.example .env
```

Se você vai usar apenas o simulador web (sem backend), pode deixar o `.env` vazio ou com valores padrão.

4. **Inicie o servidor:**
```bash
npm start
```

O servidor rodará em `http://localhost:3000`

### Uso

1. Acesse a landing page
2. Clique em "Testar Simulador" ou "Acessar"
3. Configure seu veículo em "KM Real" (opcional, mas recomendado)
4. Use o "Simulador" para analisar corridas
5. Veja o histórico de simulações em "Histórico"

## 📋 Estrutura do Projeto

```
UberMax/
├── index.html           # Landing page + app dashboard
├── style.css            # Estilos (responsivo, mobile-first)
├── script.js            # Lógica do simulador
├── server.js            # Backend Express (opcional)
├── package.json         # Dependências do projeto
├── .env.example         # Exemplo de configuração
├── .gitignore           # Arquivos ignorados pelo Git
└── alteracoes.sql       # Schema do banco de dados (opcional)
```

## 🔧 Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Backend**: Node.js + Express (opcional)
- **Banco de Dados**: PostgreSQL (opcional)
- **Armazenamento**: LocalStorage (padrão)

## 📱 Design

- ✅ Mobile-first e responsivo
- ✅ Interface limpa e profissional
- ✅ Sem dados falsos ou enganosos
- ✅ Foco em usabilidade

## 🗺️ Roadmap

### Fase 1: ✅ Concluída
- Simulador manual de corridas
- Cálculo de custo real por km
- Histórico local

### Fase 2: Em desenvolvimento
- Sincronização em nuvem
- Relatórios mais detalhados
- Exportação para PDF

### Fase 3: Planejado
- Configuração avançada de veículos
- Análise de regiões
- Dashboard com gráficos

### Fase 4: Futuro
- App Android com alerta flutuante
- Integração com APIs (se possível)
- Assistente de IA

## 🔐 Privacidade e Segurança

- Todos os dados são salvos **localmente no seu navegador**
- Nenhum dado é enviado para servidores externos
- Você tem controle total sobre seus dados
- Pode limpar tudo a qualquer momento

## ⚠️ Importante

- **Não é integrado** com Uber, 99 ou inDrive (ainda)
- **Não lê corridas automaticamente** (simulador manual)
- **Não promete resultados garantidos** - é uma ferramenta de análise
- **Sempre verifique seus cálculos** antes de tomar decisões

## 🤝 Contribuindo

Como o projeto está em desenvolvimento, feedbacks são bem-vindos! Se você tiver sugestões ou encontrar problemas, por favor compartilhe.

## 📄 Licença

Este projeto é de código aberto. Sinta-se livre para usar, modificar e distribuir.

## 📞 Contato

Para dúvidas ou sugestões sobre o UberMax, você pode abrir uma issue no repositório.

---

**Desenvolvido com ❤️ para motoristas de aplicativo**

*Versão 1.0.0 - Fase 1 (Simulador Manual)*
