import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

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

interface ObrasPorForcaChartProps {
  obras: Obra[];
}

export const ObrasPorForcaChart: React.FC<ObrasPorForcaChartProps> = ({ obras }) => {
  // Filtrar apenas obras em andamento
  const obrasEmAndamento = obras.filter(obra => {
    const status = obra.status?.toLowerCase() || '';
    return status === 'em andamento' || 
           status === 'andamento' ||
           status === 'em execução' ||
           status === 'execução' ||
           status === 'em obra' ||
           status === 'iniciada' ||
           status === 'em construção' ||
           status === 'construção';
  });

  const dadosPorForca = obrasEmAndamento.reduce((acc, obra) => {
    const forca = obra.forca || 'Não identificado';
    acc[forca] = (acc[forca] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getCorPorForca = (forca: string) => {
    switch (forca) {
      case 'CBMPR': return { bg: '#DC2626', border: '#B91C1C' }; // Vermelho - Bombeiros
      case 'PMPR': return { bg: '#EAB308', border: '#CA8A04' }; // Amarelo - Polícia Militar
      case 'PCPR': return { bg: '#6B7280', border: '#4B5563' }; // Cinza - Polícia Civil
      case 'PCP': return { bg: '#2563EB', border: '#1D4ED8' }; // Azul - Polícia Científica
      case 'DEPPEN': return { bg: '#16A34A', border: '#15803D' }; // Verde - Polícia Penal
      default: return { bg: '#9CA3AF', border: '#6B7280' }; // Cinza padrão
    }
  };

  const forcas = Object.keys(dadosPorForca);
  const cores = forcas.map(forca => getCorPorForca(forca));

  const data = {
    labels: forcas,
    datasets: [
      {
        data: Object.values(dadosPorForca),
        backgroundColor: cores.map(cor => cor.bg),
        borderColor: cores.map(cor => cor.border),
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} obras (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <div>
      <h3 className="text-lg gotham-bold mb-4" style={{color: '#2D4A7D'}}>Obras em Andamento por Força</h3>
      <div className="h-64">
        <Pie data={data} options={options} />
      </div>
    </div>
  );
};