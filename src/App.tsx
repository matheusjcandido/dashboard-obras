import { useState, useEffect } from 'react';
import { ObrasPorForcaChart } from './components/ObrasPorForcaChart';
import { ValorPorForcaChart } from './components/ValorPorForcaChart';
import { ObrasConcluidasPorAnoChart } from './components/ObrasConcluidasPorAnoChart';
import { MapaParana } from './components/MapaParana';

// Definir o tipo Obra localmente para evitar problemas de importação
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
  loaStatus?: string;
}

// Função para carregar dados via Google Apps Script
const loadDataFromAppsScript = async (): Promise<Obra[]> => {
  // URL do Google Apps Script configurado (atualizada)
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbze9GAoz6swTzy4F105HMbEyCu-mOqIA_EfyPMe-JZrcMwfU9E6p2qQHfldYGRaTWOW/exec';
  
  console.log('🔄 Carregando dados via Google Apps Script...');
  console.log('📍 URL:', APPS_SCRIPT_URL);
  
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'GET',
    mode: 'no-cors',
    redirect: 'follow',
  });
  
  console.log('📋 Informações da resposta:');
  console.log('  - Type:', response.type);
  console.log('  - OK:', response.ok);
  console.log('  - Status:', response.status);
  console.log('  - Status Text:', response.statusText);
  console.log('  - Headers:', [...response.headers.entries()]);
  
  // Se for no-cors, vamos tentar novamente com cors
  let finalResponse = response;
  if (response.type === 'opaque') {
    console.log('⚠️ Resposta opaca detectada, tentando novamente com CORS...');
    finalResponse = await fetch(APPS_SCRIPT_URL, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
      },
    });
    console.log('📡 Resposta CORS - Status:', finalResponse.status);
  }
  
  console.log('📡 Status da resposta:', finalResponse.status);
  console.log('🔗 URL final:', finalResponse.url);
  
  if (!finalResponse.ok) {
    const errorText = await finalResponse.text();
    console.error('❌ Erro HTTP:', finalResponse.status, errorText);
    throw new Error(`Erro HTTP ${finalResponse.status}: ${errorText}`);
  }
  
  const result = await finalResponse.json();
  console.log('📊 Resposta completa do Apps Script:', result);
  console.log('📊 Tipo da resposta:', typeof result);
  
  // Se a resposta é um array direto (sem wrapper)
  if (Array.isArray(result)) {
    console.log('✅ Dados recebidos como array:', result.length, 'itens');
    return result.map((item: any, index: number) => ({
      protocolo: item.protocolo || item.Protocolo || `P${index + 1}`,
      objeto: item.objeto || item.Objeto || 'Sem descrição',
      local: item.local || item.Local || 'Não informado',
      area: parseFloat(item.area || item.Area) || 0,
      tipo: item.tipo || item.Tipo || 'Não definido',
      status: item.status || item.Status || 'Em análise',
      previsaoAno: parseInt(item.previsaoano || item.ano || item.Ano) || 2024,
      valorPrevisto: parseFloat(String(item.valorprevisto || item.orcamento || item.ValorPrevisto || '0').replace(/[^\d.,]/g, '')) || 0,
      valorContratado: parseFloat(String(item.valorcontratado || item.valor || item.ValorContratado || '0').replace(/[^\d.,]/g, '')) || 0,
      andamento: parseFloat(item.andamento || item.progresso || item.Andamento) || 0,
      forca: item.forca || item.Forca || 'Não identificado'
    }));
  }
  
  // Se tem wrapper success/data
  if (result.success === false) {
    throw new Error(`Erro do Apps Script: ${result.error}`);
  }
  
  const data = result.data || result;
  if (!data || data.length === 0) {
    console.warn('⚠️ Nenhum dado encontrado na planilha');
    throw new Error('Nenhum dado encontrado na planilha');
  }
  
  console.log('✅ Mapeando dados para formato esperado...');
  console.log('🔍 Primeiros 3 itens brutos:', data.slice(0, 3));
  console.log('🔍 Chaves disponíveis no primeiro item:', Object.keys(data[0] || {}));
  
  // Filtrar apenas linhas preenchidas e mapear dados
  console.log('🔍 Analisando filtro de linhas preenchidas...');
  const linhasPreenchidas = data.filter((item: any, index: any) => {
    // Considera preenchida se tem pelo menos PROTOCOLO E (OBJETO ou LOCAL)
    // Isso garante que não processemos linhas vazias ou apenas com cabeçalho
    const temProtocolo = item.PROTOCOLO && item.PROTOCOLO.toString().trim() !== '';
    const temObjeto = item.OBJETO && item.OBJETO.toString().trim() !== '';
    // const temLocal = item.LOCAL && item.LOCAL.toString().trim() !== '';
    const temStatus = item.STATUS && item.STATUS.toString().trim() !== '';
    
    // Uma linha válida deve ter pelo menos (PROTOCOLO) OU (OBJETO + STATUS)
    // Isso permite capturar obras em planejamento mesmo sem protocolo
    const isValid = temProtocolo || (temObjeto && temStatus);
    
    // Log das primeiras 10 linhas eliminadas para debug
    if (!isValid && index < 10) {
      console.log(`❌ Linha ${index} eliminada:`, {
        PROTOCOLO: item.PROTOCOLO,
        OBJETO: item.OBJETO?.substring(0, 50),
        STATUS: item.STATUS,
        LOA: item['LOA 2026']
      });
    }
    
    return isValid;
  });
  
  console.log('📋 Total de linhas:', data.length);
  console.log('📋 Linhas preenchidas:', linhasPreenchidas.length);
  
  // Debug: Contar SIM antes e depois do filtro
  const simAntesDoFiltro = data.filter((item: any) => {
    const allKeys = Object.keys(item);
    for (let i = 8; i <= 10; i++) {
      if (allKeys[i] && String(item[allKeys[i]]).trim().toLowerCase() === 'sim') {
        return true;
      }
    }
    return false;
  }).length;
  
  const simDepoisDoFiltro = linhasPreenchidas.filter((item: any) => {
    const allKeys = Object.keys(item);
    for (let i = 8; i <= 10; i++) {
      if (allKeys[i] && String(item[allKeys[i]]).trim().toLowerCase() === 'sim') {
        return true;
      }
    }
    return false;
  }).length;
  
  console.log(`🔍 SIM antes do filtro: ${simAntesDoFiltro}`);
  console.log(`🔍 SIM depois do filtro: ${simDepoisDoFiltro}`);
  console.log(`🔍 Diferença (perdidos): ${simAntesDoFiltro - simDepoisDoFiltro}`);
  
  const mappedData = linhasPreenchidas.map((item: any, index: number) => {
    // Capturar todas as colunas para debug
    const allKeys = Object.keys(item);
    if (index < 3) {
      console.log(`🔍 ITEM ${index} - Todas as chaves disponíveis:`, allKeys);
      console.log(`🔍 ITEM ${index} - Item completo:`, item);
      if (index === 0) {
        console.log('🔍 ANÁLISE DETALHADA DAS COLUNAS:');
        allKeys.forEach((key, idx) => {
          console.log(`   Índice ${idx} (Coluna ${String.fromCharCode(65 + idx)}): "${key}" = "${item[key]}"`);
        });
      }
    }
    
    // Extrair ano da coluna N (data de término)
    let anoExecucao = 2024; // valor padrão
    const dataTermino = item[allKeys[13]] || item['DATA TÉRMINO'] || item['DATA_TERMINO']; // Coluna N é índice 13
    
    if (dataTermino) {
      const dataStr = dataTermino.toString();
      // Tentar extrair ano de diferentes formatos de data
      const anoMatch = dataStr.match(/(\d{4})/);
      if (anoMatch) {
        anoExecucao = parseInt(anoMatch[1]);
      }
    }
    
    // Capturar localização da coluna X (índice 23: A=0, B=1... X=23)
    const localizacaoX = item[allKeys[23]] || item['LOCALIZAÇÃO'] || item['LOCALIZACAO'] || item['MUNICÍPIO'] || item['MUNICIPIO'];
    
    if (index === 0) {
      console.log('🔍 Coluna N (data término):', dataTermino, '-> Ano extraído:', anoExecucao);
      console.log('🔍 Coluna X (localização):', localizacaoX);
    }
    
    return {
      protocolo: item.PROTOCOLO || item.protocolo || `P${index + 1}`,
      objeto: item.OBJETO || item.objeto || 'Sem descrição',
      local: localizacaoX || item.LOCAL || item.local || 'Não informado', 
      area: parseFloat(item['ÁREA (m²)'] || item.area || item.AREA) || 0,
      tipo: item.TIPO || item.tipo || 'Não definido',
      // Coluna H é o 8º índice (começando de 0: A=0, B=1... H=7)
      status: item.STATUS || item.status || allKeys[7] ? item[allKeys[7]] : 'Em análise',
      previsaoAno: anoExecucao,
      valorPrevisto: parseFloat(String(item['VALOR PREVISTO'] || item.valorprevisto || '0').replace(/[^\d.,]/g, '')) || 0,
      valorContratado: parseFloat(String(item['VALOR CONTRATADO'] || item.valorcontratado || '0').replace(/[^\d.,]/g, '')) || 0,
      andamento: 0, // removido o campo de andamento
      forca: item['FORÇA'] || item.FORCA || item.forca || 'Não identificado',
      // Capturar diretamente a coluna I (LOA 2026)
      loaStatus: item['LOA 2026'] || ''
    };
  });
  
  console.log('✅ Primeiros 3 itens mapeados:', mappedData.slice(0, 3));
  
  return mappedData;
};

function App() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('carregando');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval] = useState(5); // minutos

  const loadData = async () => {
    setLoading(true);
    console.log('🔄 Iniciando carregamento de dados...');
    try {
      console.log('🔄 Chamando loadDataFromAppsScript...');
      const obrasData = await loadDataFromAppsScript();
      console.log('✅ loadDataFromAppsScript retornou:', obrasData.length, 'obras');
      setObras(obrasData);
      setDataSource('apps_script');
      setLastUpdate(new Date());
      console.log('✅ Sucesso! Dashboard atualizado com', obrasData.length, 'obras da planilha');
    } catch (error) {
      console.error('❌ ERRO DETALHADO:', error);
      console.error('❌ Tipo do erro:', typeof error);
      console.error('❌ Mensagem do erro:', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      setDataSource('error');
      setLastUpdate(new Date());
      setObras([]);
    } finally {
      setLoading(false);
      console.log('🏁 Carregamento finalizado');
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, []);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      console.log(`🔄 Auto refresh: atualizando dados a cada ${refreshInterval} minutos`);
      loadData();
    }, refreshInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Analisar status únicos para debug
  const statusUnicos = [...new Set(obras.map(obra => obra.status))];
  console.log('📊 Status únicos encontrados:', statusUnicos);
  console.log('📊 Contagem por status:', statusUnicos.reduce((acc, status) => {
    acc[status] = obras.filter(obra => obra.status === status).length;
    return acc;
  }, {} as Record<string, number>));
  
  // Filtrar obras em andamento (baseado na informação real da planilha)
  // Vamos ser mais específicos e olhar apenas os status que realmente indicam andamento
  const obrasEmAndamento = obras.filter(obra => {
    const status = obra.status?.toString().trim() || '';
    
    // Log apenas dos primeiros 10 para não poluir o console
    if (obras.indexOf(obra) < 10) {
      console.log(`🔍 Obra ${obra.protocolo}: status="${status}"`);
    }
    
    // Termos exatos que indicam obra em andamento (ser mais restritivo)
    const statusLower = status.toLowerCase();
    return statusLower === 'em andamento' || 
           statusLower === 'andamento' ||
           statusLower === 'em execução' ||
           statusLower === 'execução' ||
           statusLower === 'em obra' ||
           statusLower === 'iniciada' ||
           statusLower === 'em construção' ||
           statusLower === 'construção';
  });
  
  console.log('🚧 Obras em andamento encontradas:', obrasEmAndamento.length);
  console.log('🚧 Exemplos de status:', obrasEmAndamento.slice(0, 5).map(o => o.status));

  // Filtrar obras em contratação
  const obrasEmContratacao = obras.filter(obra => {
    const status = obra.status?.toString().trim() || '';
    const statusLower = status.toLowerCase();
    return statusLower === 'em contratação' || 
           statusLower === 'contratação' ||
           statusLower.includes('contrata') ||
           statusLower === 'em processo de contratação' ||
           statusLower === 'processo de contratação';
  });
  
  console.log('🔶 Obras em contratação encontradas:', obrasEmContratacao.length);
  console.log('🔶 Exemplos de status contratação:', obrasEmContratacao.slice(0, 5).map(o => o.status));

  // Filtrar obras em planejamento com SIM na LOA (ignorando ano completamente)
  // Considerando status "Em planejamento" na coluna H e "SIM" na coluna I
  const obrasPlanejamento2026 = obras.filter(obra => {
    const status = obra.status?.toString().trim() || '';
    const loaStatus = obra.loaStatus?.toString().trim() || '';
    
    // Verificar se é planejamento (case-insensitive e variações)
    const statusLower = status.toLowerCase();
    const isPlanning = statusLower === 'em planejamento' || 
                      statusLower.includes('planejamento') ||
                      statusLower === 'planejamento';
    
    // Verificar se tem SIM na coluna I
    const isInLOA = loaStatus === 'SIM';
    
    return isPlanning && isInLOA;
  });
  
  console.log('📋 Obras em planejamento com SIM na LOA:', obrasPlanejamento2026.length);
  console.log('📋 Exemplos de status planejamento:', obrasPlanejamento2026.slice(0, 5).map(o => `${o.protocolo}: ${o.status} | LOA: ${o.loaStatus}`));
  
  // Debug dos primeiros matches
  obrasPlanejamento2026.slice(0, 5).forEach(obra => {
    console.log(`✅ MATCH: ${obra.protocolo} | Status: "${obra.status}" | LOA: "${obra.loaStatus}"`);
  });
  
  // Análise detalhada dos filtros
  const totalPlanejamento = obras.filter(o => {
    const status = o.status?.toLowerCase() || '';
    return status.includes('planejamento');
  }).length;
  
  const totalSIM = obras.filter(o => o.loaStatus === 'SIM').length;
  
  console.log(`📊 Total obras carregadas: ${obras.length}`);
  console.log(`📊 Total com "planejamento" no status: ${totalPlanejamento}`);
  console.log(`📊 Total com "SIM" na coluna I: ${totalSIM}`);
  console.log(`📊 Interseção (planejamento + SIM): ${obrasPlanejamento2026.length}`);
  console.log(`📊 ESPERADO: 344 planejamento total, 109 com SIM`);
  
  // Se não estamos encontrando 109, vamos ver alguns exemplos
  if (obrasPlanejamento2026.length !== 109) {
    console.log('🔍 Analisando discrepância...');
    console.log('🔍 Primeiras obras em planejamento:');
    obras.filter(o => o.status?.toLowerCase().includes('planejamento')).slice(0, 10).forEach(o => {
      console.log(`   ${o.protocolo}: Status="${o.status}" | LOA="${o.loaStatus}"`);
    });
  }
  
  // Debug adicional para entender os dados
  console.log('🔍 Debug - Todas as obras com status de planejamento:');
  obras.filter(obra => {
    const status = obra.status?.toString().trim().toLowerCase() || '';
    return status.includes('planejamento');
  }).slice(0, 10).forEach(obra => {
    console.log(`   ${obra.protocolo}: Status="${obra.status}" | LOA="${obra.loaStatus}" | Ano=${obra.previsaoAno}`);
  });
  
  console.log('🔍 Debug - Todas as obras com SIM na LOA:');
  const obrasSIM = obras.filter(obra => {
    const loaStatus = obra.loaStatus?.toString().trim().toLowerCase() || '';
    return loaStatus.includes('sim');
  });
  
  console.log(`📊 TOTAL DE OBRAS COM "SIM" NA COLUNA I: ${obrasSIM.length}`);
  
  obrasSIM.slice(0, 10).forEach(obra => {
    console.log(`   ${obra.protocolo}: Status="${obra.status}" | LOA="${obra.loaStatus}" | Ano=${obra.previsaoAno}`);
  });
  
  // Análise completa da coluna I
  console.log('🔍 Análise completa da coluna I (LOA):');
  const loaAnalysis = obras.reduce((acc, obra) => {
    const loaValue = obra.loaStatus?.toString().trim() || 'VAZIO';
    acc[loaValue] = (acc[loaValue] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('📊 Contagem por valor na coluna I:', loaAnalysis);

  const metrics = {
    totalObras: obras.length,
    valorObrasAndamento: obrasEmAndamento.reduce((sum, obra) => sum + (obra.valorContratado || obra.valorPrevisto), 0),
    obrasConcluidas: obras.filter(obra => {
      const status = obra.status?.toLowerCase() || '';
      const isCompleted = status.includes('concluída') || 
                         status.includes('concluida') ||
                         status.includes('finalizada') ||
                         status.includes('entregue') ||
                         status.includes('terminada');
      const isInValidPeriod = obra.previsaoAno >= 2017 && obra.previsaoAno <= 2025;
      return isCompleted && isInValidPeriod;
    }).length,
    obrasAndamento: obrasEmAndamento.length,
    obrasContratacao: obrasEmContratacao.length,
    valorObrasContratacao: obrasEmContratacao.reduce((sum, obra) => sum + (obra.valorContratado || obra.valorPrevisto), 0),
    obrasPlanejamento2026: obrasPlanejamento2026.length,
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-x-hidden relative">
      {/* Header com cores do Paraná */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-4 shadow-lg" style={{backgroundColor: '#2D4A7D'}}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl gotham-bold tracking-tight">Dashboard de Obras - CEA/SESP</h1>
            <p className="text-blue-100 mt-1 gotham-regular">
              {loading ? 'Carregando dados da planilha...' : 
               obras.length > 0 ? `${obras.length} obras carregadas` :
               'Aguardando conexão com a planilha'}
              {!loading && (
                <span className={`ml-2 text-xs px-2 py-1 rounded-full gotham-medium ${
                  dataSource === 'apps_script' ? 'bg-green-600 text-white' :
                  dataSource === 'error' ? 'bg-red-600 text-white' :
                  'bg-blue-800 opacity-75'
                }`}>
                  {dataSource === 'apps_script' ? '✅ Conectado' : 
                   dataSource === 'error' ? '❌ Erro de Conexão' : 
                   '⏳ Conectando...'}
                </span>
              )}
            </p>
            {lastUpdate && (
              <p className="text-xs text-blue-200 mt-1 gotham-regular">
                Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
              </p>
            )}
          </div>
          <div className="text-right space-y-2">
            <div>
              <div className="text-sm text-blue-100 gotham-medium">Secretaria de Estado da Segurança Pública</div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => loadData()}
                disabled={loading}
                className="px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white text-xs rounded gotham-medium transition-colors disabled:opacity-50"
              >
                {loading ? '🔄' : '↻'} Atualizar
              </button>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1 text-xs rounded gotham-medium transition-colors ${
                  autoRefresh ? 'bg-green-600 text-white' : 'bg-blue-200 text-blue-800'
                }`}
              >
                Auto: {autoRefresh ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Métricas com cores do Paraná */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-white to-purple-50 p-6 rounded-xl shadow-lg border-l-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300" style={{borderColor: '#9333EA'}}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm gotham-medium text-gray-600 uppercase tracking-wide">EM PLANEJAMENTO</h3>
              <p className="text-3xl gotham-bold mt-2" style={{color: '#9333EA'}}>{metrics.obrasPlanejamento2026}</p>
              <p className="text-xs text-gray-500 mt-1 gotham-regular">LOA 2026</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shadow-md">
              <div className="w-6 h-6 rounded-full" style={{backgroundColor: '#9333EA'}}></div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-xl shadow-lg border-l-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300" style={{borderColor: '#5BA5D6'}}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm gotham-medium text-gray-600 uppercase tracking-wide">Em Andamento</h3>
              <p className="text-3xl gotham-bold mt-2" style={{color: '#5BA5D6'}}>{metrics.obrasAndamento}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shadow-md">
              <div className="w-6 h-6 rounded-full" style={{backgroundColor: '#5BA5D6'}}></div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-orange-50 p-6 rounded-xl shadow-lg border-l-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300" style={{borderColor: '#EA580C'}}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm gotham-medium text-gray-600 uppercase tracking-wide">Em Contratação</h3>
              <p className="text-3xl gotham-bold mt-2" style={{color: '#EA580C'}}>{metrics.obrasContratacao}</p>
              <p className="text-xs text-gray-500 mt-1 gotham-regular">
                {metrics.valorObrasContratacao >= 1000000 
                  ? `R$ ${(metrics.valorObrasContratacao / 1000000).toFixed(1)}M`
                  : `R$ ${(metrics.valorObrasContratacao / 1000).toFixed(0)} mil`
                }
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center shadow-md">
              <div className="w-6 h-6 rounded-full" style={{backgroundColor: '#EA580C'}}></div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-green-50 p-6 rounded-xl shadow-lg border-l-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300" style={{borderColor: '#228B22'}}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm gotham-medium text-gray-600 uppercase tracking-wide">Valor Obras em Andamento</h3>
              <p className="text-3xl gotham-bold mt-2" style={{color: '#228B22'}}>
                {metrics.valorObrasAndamento >= 1000000 
                  ? `R$ ${(metrics.valorObrasAndamento / 1000000).toFixed(1)}M`
                  : `R$ ${(metrics.valorObrasAndamento / 1000).toFixed(0)} mil`
                }
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shadow-md">
              <div className="w-6 h-6 rounded-full" style={{backgroundColor: '#228B22'}}></div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-emerald-50 p-6 rounded-xl shadow-lg border-l-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300" style={{borderColor: '#228B22'}}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm gotham-medium text-gray-600 uppercase tracking-wide">Concluídas</h3>
              <p className="text-3xl gotham-bold mt-2" style={{color: '#228B22'}}>{metrics.obrasConcluidas}</p>
              <p className="text-xs text-gray-500 mt-1 gotham-regular">2017-2025</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shadow-md">
              <div className="w-6 h-6 rounded-full" style={{backgroundColor: '#228B22'}}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Divisor visual */}
      <div className="px-6">
        <div className="border-t border-gray-200 relative">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
        </div>
      </div>

      {/* Gráficos com design moderno */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100">
          <ObrasPorForcaChart obras={obras} />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100">
          <ValorPorForcaChart obras={obras} />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100">
          <ObrasConcluidasPorAnoChart obras={obras} />
        </div>
      </div>

      {/* Divisor visual */}
      <div className="px-6 py-3">
        <div className="border-t border-gray-200 relative">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent"></div>
        </div>
      </div>

      {/* Lista de Obras em Andamento e Mapa */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden max-h-96 border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200" style={{background: 'linear-gradient(135deg, #2D4A7D 0%, #5BA5D6 100%)'}}>
            <h3 className="text-xl gotham-bold text-white">Obras em Andamento</h3>
            <p className="text-blue-100 mt-1 gotham-regular">{obrasEmAndamento.length} obras em execução</p>
          </div>
          
          {obrasEmAndamento.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-lg gotham-medium text-gray-600 mb-2">
                {dataSource === 'error' ? 'Erro na Conexão' : 'Nenhuma obra em andamento'}
              </h4>
              <p className="text-sm text-gray-500 gotham-regular">
                {dataSource === 'error' ? 
                  'Verifique a conexão com a planilha e tente novamente' :
                  'Os dados aparecerão aqui quando a planilha for conectada'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-auto max-h-80">
              <table className="min-w-full">
                <thead>
                  <tr style={{backgroundColor: '#f8fafc'}}>
                    <th className="px-6 py-4 text-left text-xs gotham-bold uppercase tracking-wider" style={{color: '#2D4A7D'}}>Protocolo</th>
                    <th className="px-10 py-4 text-left text-xs gotham-bold uppercase tracking-wider" style={{color: '#2D4A7D'}}>Objeto</th>
                    <th className="px-6 py-4 text-left text-xs gotham-bold uppercase tracking-wider" style={{color: '#2D4A7D'}}>Local</th>
                    <th className="px-6 py-4 text-left text-xs gotham-bold uppercase tracking-wider" style={{color: '#2D4A7D'}}>Força</th>
                    <th className="px-6 py-4 text-left text-xs gotham-bold uppercase tracking-wider" style={{color: '#2D4A7D'}}>Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {obrasEmAndamento.map((obra, index) => (
                  <tr key={index} className="hover:bg-blue-50 transition-colors duration-200">
                    <td className="px-6 py-4 text-sm gotham-bold" style={{color: '#2D4A7D'}}>{obra.protocolo}</td>
                    <td className="px-10 py-4 text-sm text-gray-900 gotham-medium">{obra.objeto}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 gotham-regular">{obra.local.replace(/, ?(PT-BR|PR-BR|Brasil|Brazil)$/i, '')}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex px-3 py-1 text-xs gotham-bold rounded-full ${
                        obra.forca === 'CBMPR' ? 'text-white' :
                        obra.forca === 'PMPR' ? 'text-white' :
                        obra.forca === 'PCPR' ? 'text-white' :
                        obra.forca === 'PCP' ? 'text-white' :
                        obra.forca === 'DEPPEN' ? 'text-white' :
                        'bg-gray-100 text-gray-800'
                      }`} style={{
                        backgroundColor: 
                          obra.forca === 'CBMPR' ? '#DC2626' :
                          obra.forca === 'PMPR' ? '#EAB308' :
                          obra.forca === 'PCPR' ? '#6B7280' :
                          obra.forca === 'PCP' ? '#2563EB' :
                          obra.forca === 'DEPPEN' ? '#16A34A' :
                          '#9CA3AF'
                      }}>
                        {obra.forca}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm gotham-bold" style={{color: '#228B22'}}>
                      {(obra.valorContratado || obra.valorPrevisto) >= 1000000 
                        ? `R$ ${((obra.valorContratado || obra.valorPrevisto) / 1000000).toFixed(1)}M`
                        : `R$ ${((obra.valorContratado || obra.valorPrevisto) / 1000).toFixed(0)} mil`
                      }
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Mapa do Paraná */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200" style={{background: 'linear-gradient(135deg, #2D4A7D 0%, #5BA5D6 100%)'}}>
            <h3 className="text-xl gotham-bold text-white">Localização das Obras</h3>
            <p className="text-blue-100 mt-1 gotham-regular">Distribuição geográfica no Paraná</p>
          </div>
          <div className="p-4 h-80">
            <MapaParana obras={obras} obrasEmAndamento={obrasEmAndamento} />
          </div>
        </div>
      </div>

      {/* Divisor visual */}
      <div className="px-6 py-2">
        <div className="border-t border-gray-200 relative">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent"></div>
        </div>
      </div>

      {/* Lista de Obras em Contratação */}
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden max-h-96 border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200" style={{background: 'linear-gradient(135deg, #EA580C 0%, #FB923C 100%)'}}>
            <h3 className="text-xl gotham-bold text-white">Obras em Contratação</h3>
            <p className="text-orange-100 mt-1 gotham-regular">{obrasEmContratacao.length} obras em processo de contratação</p>
          </div>
          
          {obrasEmContratacao.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-lg gotham-medium text-gray-600 mb-2">
                Nenhuma obra em contratação
              </h4>
              <p className="text-sm text-gray-500 gotham-regular">
                As obras em processo de contratação aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-auto max-h-80">
              <table className="min-w-full">
                <thead>
                  <tr style={{backgroundColor: '#fef3f2'}}>
                    <th className="px-6 py-4 text-left text-xs gotham-bold uppercase tracking-wider" style={{color: '#EA580C'}}>Protocolo</th>
                    <th className="px-10 py-4 text-left text-xs gotham-bold uppercase tracking-wider" style={{color: '#EA580C'}}>Objeto</th>
                    <th className="px-6 py-4 text-left text-xs gotham-bold uppercase tracking-wider" style={{color: '#EA580C'}}>Local</th>
                    <th className="px-6 py-4 text-left text-xs gotham-bold uppercase tracking-wider" style={{color: '#EA580C'}}>Força</th>
                    <th className="px-6 py-4 text-left text-xs gotham-bold uppercase tracking-wider" style={{color: '#EA580C'}}>Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {obrasEmContratacao.map((obra, index) => (
                  <tr key={index} className="hover:bg-orange-50 transition-colors duration-200">
                    <td className="px-6 py-4 text-sm gotham-bold" style={{color: '#EA580C'}}>{obra.protocolo}</td>
                    <td className="px-10 py-4 text-sm text-gray-900 gotham-medium">{obra.objeto}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 gotham-regular">{obra.local.replace(/, ?(PT-BR|PR-BR|Brasil|Brazil)$/i, '')}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex px-3 py-1 text-xs gotham-bold rounded-full ${
                        obra.forca === 'CBMPR' ? 'text-white' :
                        obra.forca === 'PMPR' ? 'text-white' :
                        obra.forca === 'PCPR' ? 'text-white' :
                        obra.forca === 'PCP' ? 'text-white' :
                        obra.forca === 'DEPPEN' ? 'text-white' :
                        'bg-gray-100 text-gray-800'
                      }`} style={{
                        backgroundColor: 
                          obra.forca === 'CBMPR' ? '#DC2626' :
                          obra.forca === 'PMPR' ? '#EAB308' :
                          obra.forca === 'PCPR' ? '#6B7280' :
                          obra.forca === 'PCP' ? '#2563EB' :
                          obra.forca === 'DEPPEN' ? '#16A34A' :
                          '#9CA3AF'
                      }}>
                        {obra.forca}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm gotham-bold" style={{color: '#228B22'}}>
                      {(obra.valorContratado || obra.valorPrevisto) >= 1000000 
                        ? `R$ ${((obra.valorContratado || obra.valorPrevisto) / 1000000).toFixed(1)}M`
                        : `R$ ${((obra.valorContratado || obra.valorPrevisto) / 1000).toFixed(0)} mil`
                      }
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;