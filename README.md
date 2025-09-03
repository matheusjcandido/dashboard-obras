# Dashboard de Obras - SESP

Dashboard em tempo real para monitoramento das obras das cinco forças de segurança da Secretaria de Estado de Segurança Pública do Paraná (SESP).

## 🚀 Características

- **Página única** - Todas as informações em uma tela sem scroll
- **Tempo real** - Atualização automática a cada 5 minutos via Google Sheets API
- **Responsivo** - Otimizado para resoluções desktop (1366px+)
- **Interativo** - Filtros sincronizados entre todos os componentes

## 📊 Componentes do Dashboard

### Header (10% da altura)
- Logo e título da SESP
- Filtros globais: Força, Status, Ano, Município
- Indicador de última atualização

### Grid Principal (90% da altura) - Layout 3x3

#### Linha 1 (33%)
1. **Cards de Métricas** - Total de obras, orçamento, concluídas, em andamento
2. **Gráfico de Status** - Pizza com distribuição por status
3. **Gráfico Orçamentário** - Barras com previsto vs contratado por força

#### Linha 2 (33%)
1. **Mapa Interativo** (2 colunas) - Localização das obras por município
2. **Timeline** - Cronograma de obras por ano

#### Linha 3 (34%)
1. **Tabela de Obras** (3 colunas) - Lista completa com paginação e busca

## 🛠️ Tecnologias

- **React 18** com TypeScript
- **Vite** para build e desenvolvimento
- **Tailwind CSS** para estilização
- **Zustand** para gerenciamento de estado
- **Chart.js** para gráficos
- **Leaflet** para mapas
- **Google Sheets API** para dados em tempo real

## ⚙️ Instalação

```bash
# Instalar dependências
npm install

# Configurar API Key do Google Sheets
# Editar src/services/googleSheets.ts e substituir YOUR_GOOGLE_SHEETS_API_KEY

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 🔧 Configuração da API

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a Google Sheets API
4. Crie credenciais (API Key)
5. Substitua `YOUR_GOOGLE_SHEETS_API_KEY` em `src/services/googleSheets.ts`

## 📱 Funcionalidades

### Filtros Interativos
- **Força de Segurança**: Bombeiros, PM, PC, Polícia Científica, DEPEN
- **Status**: Em andamento, Planejamento, Concluída, Suspensa
- **Ano**: 2023-2026
- **Município**: Busca textual

### Visualizações
- **Métricas em tempo real** com cards coloridos
- **Gráfico de pizza** para status das obras
- **Gráfico de barras** para comparação orçamentária
- **Mapa com marcadores** coloridos por status
- **Timeline empilhada** por ano e status
- **Tabela paginada** com busca e ordenação

### Atualizações
- **Polling automático** a cada 5 minutos
- **Indicador visual** de sincronização
- **Fallback para dados mock** em caso de erro

## 🎨 Design

- **Cores da SESP**: Azul institucional (#003366) e variações
- **Layout responsivo**: Adaptável para diferentes resoluções
- **Interface limpa**: Foco na informação sem distrações
- **Animações sutis**: Transições suaves entre estados

## 📈 Performance

- **Lazy loading** de componentes pesados
- **Memoização** com React.memo
- **Virtualização** de listas grandes
- **Cache inteligente** para reduzir requisições
- **Bundle splitting** por componente

## 🔒 Segurança

- **Sanitização** de dados da planilha
- **Validação** de tipos em runtime
- **Rate limiting** nas requisições
- **HTTPS** obrigatório

## 📊 Estrutura de Dados

### Obra
```typescript
interface Obra {
  protocolo: string;
  objeto: string;
  local: string;
  area: number;
  tipo: string;
  status: string;
  previsaoAno: number;
  valorPrevisto: number;
  valorContratado: number;
  andamento: number;
  forca?: string;
}
```

## 🌐 URLs

- **Desenvolvimento**: http://localhost:5173/
- **Planilha fonte**: [Google Sheets](https://docs.google.com/spreadsheets/d/1NlNynrORZhhUJnoRzu-4EwtP4VgOFdHw1ZQnGSAn98I/edit?gid=1563349625#gid=1563349625)

## 📝 Scripts Disponíveis

```bash
npm run dev        # Servidor de desenvolvimento
npm run build      # Build para produção
npm run preview    # Preview do build
```

## 🎯 Métricas de Sucesso

- ✅ Carregamento inicial < 3 segundos
- ✅ Atualização de dados < 1 segundo
- ✅ Compatibilidade com navegadores modernos
- ✅ Responsividade em resoluções 1366px+
- ✅ Zero necessidade de scroll vertical

## ⚠️ Observações Importantes

1. **API Key**: Substitua `YOUR_GOOGLE_SHEETS_API_KEY` em `src/services/googleSheets.ts` pela sua chave real do Google Sheets API
2. **Dados Mock**: O dashboard inclui dados de exemplo que são usados como fallback
3. **Resolução**: Otimizado para desktop com resolução mínima de 1366px
4. **Navegadores**: Testado em Chrome, Firefox, Safari e Edge modernos

## 🚀 Status do Projeto

✅ **Concluído** - Dashboard funcional com todos os componentes implementados

- Layout responsivo 3x3
- Integração com Google Sheets API
- Filtros sincronizados
- Gráficos interativos
- Mapa com Leaflet
- Tabela paginada
- Polling em tempo real
- Performance otimizada