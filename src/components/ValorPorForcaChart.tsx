import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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
  valorTotalAtual: number;
  andamento: number;
  forca?: string;
}

interface ValorPorForcaChartProps {
  obras: Obra[];
}

export const ValorPorForcaChart: React.FC<ValorPorForcaChartProps> = ({ obras }) => {
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

  const valorPorForca = obrasEmAndamento.reduce((acc, obra) => {
    const forca = obra.forca || 'Não identificado';
    const valor = obra.valorTotalAtual;
    acc[forca] = (acc[forca] || 0) + valor;
    return acc;
  }, {} as Record<string, number>);

  const getCorPorForca = (forca: string) => {
    switch (forca) {
      case 'CBMPR': return { bg: 'rgba(220, 38, 38, 0.7)', border: 'rgb(220, 38, 38)' }; // Vermelho - Bombeiros
      case 'PMPR': return { bg: 'rgba(234, 179, 8, 0.7)', border: 'rgb(234, 179, 8)' }; // Amarelo - Polícia Militar
      case 'PCPR': return { bg: 'rgba(107, 114, 128, 0.7)', border: 'rgb(107, 114, 128)' }; // Cinza - Polícia Civil
      case 'PCP': return { bg: 'rgba(37, 99, 235, 0.7)', border: 'rgb(37, 99, 235)' }; // Azul - Polícia Científica
      case 'DEPPEN': return { bg: 'rgba(22, 163, 74, 0.7)', border: 'rgb(22, 163, 74)' }; // Verde - Polícia Penal
      default: return { bg: 'rgba(156, 163, 175, 0.7)', border: 'rgb(156, 163, 175)' }; // Cinza padrão
    }
  };

  const forcas = Object.keys(valorPorForca);
  const cores = forcas.map(forca => getCorPorForca(forca));

  const data = {
    labels: forcas,
    datasets: [
      {
        label: 'Valor (R$ Milhões)',
        data: Object.values(valorPorForca).map(valor => valor / 1000000),
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
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `R$ ${context.parsed.y.toFixed(1)} milhões`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return `R$ ${value}M`;
          }
        }
      }
    },
  };

  return (
    <div>
      <h3 className="text-lg gotham-bold mb-4" style={{color: '#2D4A7D'}}>Valor das Obras em Andamento por Força</h3>
      <div className="h-64">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};