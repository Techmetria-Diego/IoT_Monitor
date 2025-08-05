# Sistema de Monitoramento IoT - Qualidade da Água

Sistema web moderno para monitoramento e análise de dados de consumo de água em condomínios, com integração completa ao Google Drive.

## 🚀 Funcionalidades Principais

- **Dashboard Interativo**: Visualização de períodos disponíveis e resumo de alertas
- **Sistema de Alertas**: Monitoramento automático de alto consumo baseado em dados das planilhas
- **Busca Avançada**: Filtros por período, condomínio e outras características
- **Integração Google Drive**: Sincronização automática com planilhas Excel (.xlsx)
- **OAuth 2.0**: Autenticação segura com Google (implicit flow)
- **Interface Responsiva**: Design moderno com Tailwind CSS e componentes shadcn/ui

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Routing**: React Router
- **Authentication**: Google OAuth 2.0 (implicit flow)
- **API Integration**: Google Drive API v3 + Google Sheets API v4
- **Icons**: Lucide React
- **Build Tool**: Vite

## 📁 Estrutura de Dados Esperada

O sistema espera uma estrutura específica no Google Drive:

```
📁 Pasta Principal
├── 📁 01 - Janeiro - 2025
│   ├── 📁 01_01_2025
│   │   ├── 📄 Alpha_água_01.xlsx
│   │   ├── 📄 Beta_gás_01.xlsx
│   │   └── 📄 ...
│   ├── 📁 02_01_2025
│   └── 📁 ...
├── 📁 02 - Fevereiro - 2025
└── 📁 ...
```

### Formato das Planilhas

- **Arquivos**: Excel (.xlsx) com dados de consumo
- **Estrutura**: Cabeçalhos específicos esperados (DESCRIÇÃO, CONSUMO, TENDÊNCIA, etc.)
- **Detecção de Alto Consumo**: Baseada na coluna TENDÊNCIA da planilha

## ⚙️ Configuração e Instalação

### Pré-requisitos
- Node.js 18+
- Conta Google com acesso ao Google Drive
- Projeto no Google Cloud Console com APIs habilitadas

### APIs Necessárias no Google Cloud
1. Google Drive API v3
2. Google Sheets API v4

### Instalação

```bash
# Clone o repositório
git clone https://github.com/Techmetria-Diego/IoT_Monitor.git

# Instale as dependências
cd IoT_Monitor
npm install

# Execute o projeto
npm run dev
```

### Configuração OAuth

1. Acesse o Google Cloud Console
2. Crie um projeto ou use um existente
3. Habilite as APIs necessárias
4. Configure as credenciais OAuth 2.0:
   - Tipo: Aplicação Web
   - Origens autorizadas: `http://localhost:8083`
   - URIs de redirecionamento: `http://localhost:8083/auth/callback`

## 🔧 Como Usar

### 1. Primeira Configuração
1. Acesse a página de **Configurações**
2. Insira o **Client ID** do Google OAuth
3. Configure o **ID da pasta principal** do Google Drive
4. Teste a conexão

### 2. Autenticação
1. Faça login com sua conta Google
2. Autorize o acesso ao Google Drive
3. O sistema sincronizará automaticamente os dados

### 3. Navegação
- **Dashboard**: Visão geral dos períodos e alertas
- **Busca Avançada**: Filtros personalizados para encontrar relatórios
- **Detalhes do Período**: Visualização de relatórios por período
- **Detalhes do Relatório**: Análise completa dos dados de consumo

## 📊 Sistema de Status

- **🟢 Normal**: Consumo dentro dos parâmetros
- **🟡 Alerta**: 1-2 unidades com alto consumo
- **🔴 Erro**: 3+ unidades com alto consumo

## 🔐 Segurança

- Autenticação OAuth 2.0 com Google
- Tokens armazenados localmente com refresh automático
- Acesso somente leitura ao Google Drive
- Validação de permissões em todas as operações

## 🚀 Deploy

### Opções de Deploy Disponíveis

O projeto pode ser facilmente deployed em:

#### 🐳 Docker (Recomendado para Back4App)
```bash
# Build da imagem Docker
docker build -t iot-monitor .

# Executar localmente
docker run -p 3000:3000 iot-monitor
```

#### ☁️ Plataformas Cloud
- **Back4App**: Suporte completo via Docker
- **Vercel**: Deploy automático via GitHub
- **Netlify**: Deploy de SPA
- **GitHub Pages**: Páginas estáticas
- **Heroku**: Via Docker ou buildpack Node.js

### Configuração para Back4App

1. Conecte seu repositório GitHub ao Back4App
2. O sistema detectará automaticamente o `Dockerfile`
3. Configure as variáveis de ambiente se necessário
4. Deploy automático será realizado

### Variáveis de Ambiente (Opcionais)

```bash
# Para configuração avançada
VITE_GOOGLE_CLIENT_ID=seu_client_id_aqui
VITE_MAIN_FOLDER_ID=id_da_pasta_principal
```

## 📝 Desenvolvimento

### Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Verificação de código
```

### Estrutura do Projeto

```
src/
├── components/      # Componentes React reutilizáveis
├── pages/          # Páginas da aplicação
├── stores/         # Gerenciamento de estado (Zustand)
├── lib/           # Utilitários e integrações (Google Drive)
├── types/         # Definições TypeScript
└── hooks/         # Hooks customizados
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é propriedade da Techmetria.

## 👨‍💻 Desenvolvido por

**Diego - Techmetria**
- Sistema desenvolvido para monitoramento IoT de qualidade da água
- Integração avançada com Google Drive e Sheets APIs
- Interface moderna e responsiva

---

Para suporte técnico ou dúvidas sobre o sistema, entre em contato com a equipe de desenvolvimento.
