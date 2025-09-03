import axios from 'axios';
import type { Obra } from '../types';

const SHEET_ID = '1NlNynrORZhhUJnoRzu-4EwtP4VgOFdHw1ZQnGSAn98I';
const SHEET_NAME = 'Obras';
const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;

export const fetchObrasData = async (): Promise<Obra[]> => {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;
    console.log('URL da API:', url);
    
    const response = await axios.get(url);
    console.log('Resposta da API:', response.data);

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      console.log('Nenhuma linha de dados encontrada');
      return getMockData();
    }

    const headers = rows[0];
    const data = rows.slice(1);
    console.log('Headers:', headers);
    console.log('Dados:', data.length, 'linhas');

    return data.map((row: any[]) => {
      const obra: Obra = {
        protocolo: row[0] || '',
        objeto: row[1] || '',
        local: row[2] || '',
        area: parseFloat(row[3]) || 0,
        tipo: row[4] || '',
        status: row[5] || '',
        previsaoAno: parseInt(row[6]) || new Date().getFullYear(),
        valorPrevisto: parseFloat(row[7]?.replace(/[R$.,]/g, '')) || 0,
        valorContratado: parseFloat(row[8]?.replace(/[R$.,]/g, '')) || 0,
        andamento: parseFloat(row[9]) || 0,
        forca: inferirForcaSeguranca(row[1] || '', row[2] || ''),
      };
      return obra;
    });
  } catch (error: any) {
    console.error('Erro detalhado ao buscar dados da planilha:');
    console.error('- Mensagem:', error.message);
    console.error('- Status:', error.response?.status);
    console.error('- Data:', error.response?.data);
    console.error('- URL:', `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`);
    
    return getMockData(); // Fallback para dados mock
  }
};

const inferirForcaSeguranca = (objeto: string, local: string): string => {
  const texto = `${objeto} ${local}`.toLowerCase();
  
  if (texto.includes('bombeiro') || texto.includes('cbm')) return 'Bombeiros';
  if (texto.includes('polícia militar') || texto.includes('pm')) return 'Polícia Militar';
  if (texto.includes('polícia civil') || texto.includes('pc')) return 'Polícia Civil';
  if (texto.includes('polícia científica') || texto.includes('ic')) return 'Polícia Científica';
  if (texto.includes('casa custódia') || texto.includes('penitenciária')) return 'DEPEN';
  
  return 'Não identificado';
};

const getMockData = (): Obra[] => [
  {
    protocolo: 'P001',
    objeto: 'Construção de Quartel do Corpo de Bombeiros',
    local: 'Curitiba',
    area: 1200,
    tipo: 'Construção',
    status: 'Em andamento',
    previsaoAno: 2024,
    valorPrevisto: 2500000,
    valorContratado: 2300000,
    andamento: 65,
    forca: 'Bombeiros'
  },
  {
    protocolo: 'P002',
    objeto: 'Reforma de Delegacia da Polícia Civil',
    local: 'Londrina',
    area: 800,
    tipo: 'Reforma',
    status: 'Em planejamento',
    previsaoAno: 2026,
    valorPrevisto: 800000,
    valorContratado: 750000,
    andamento: 15,
    forca: 'Polícia Civil'
  },
  {
    protocolo: 'P003',
    objeto: 'Ampliação de Batalhão da Polícia Militar',
    local: 'Maringá',
    area: 1500,
    tipo: 'Ampliação',
    status: 'Concluída',
    previsaoAno: 2023,
    valorPrevisto: 1800000,
    valorContratado: 1650000,
    andamento: 100,
    forca: 'Polícia Militar'
  },
  {
    protocolo: 'P004',
    objeto: 'Construção de Instituto de Criminalística',
    local: 'Cascavel',
    area: 2000,
    tipo: 'Construção',
    status: 'Em andamento',
    previsaoAno: 2024,
    valorPrevisto: 3200000,
    valorContratado: 3000000,
    andamento: 40,
    forca: 'Polícia Científica'
  },
  {
    protocolo: 'P005',
    objeto: 'Reforma de Casa de Custódia',
    local: 'Foz do Iguaçu',
    area: 3000,
    tipo: 'Reforma',
    status: 'Em andamento',
    previsaoAno: 2024,
    valorPrevisto: 4500000,
    valorContratado: 4200000,
    andamento: 30,
    forca: 'DEPEN'
  },
  {
    protocolo: 'P006',
    objeto: 'Construção de Nova Delegacia Regional',
    local: 'Ponta Grossa',
    area: 1800,
    tipo: 'Construção',
    status: 'Em planejamento',
    previsaoAno: 2026,
    valorPrevisto: 2800000,
    valorContratado: 0,
    andamento: 0,
    forca: 'Polícia Civil'
  }
];