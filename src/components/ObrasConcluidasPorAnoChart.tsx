import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
  andamento: number;
  forca?: string;
}

interface ObrasConcluidasPorAnoChartProps {
  obras: Obra[];
}

export const ObrasConcluidasPorAnoChart: React.FC<ObrasConcluidasPorAnoChartProps> = ({ obras }) => {
  // Filtrar obras concluídas baseado no status da coluna H
  const obrasConcluidas = obras.filter(obra => {
    const status = obra.status?.toLowerCase() || '';
    return status.includes('concluída') || 
           status.includes('concluida') ||
           status.includes('finalizada') ||
           status.includes('entregue') ||
           status.includes('terminada');
  });
  
  const obrasPorAno = obrasConcluidas.reduce((acc, obra) => {
    const ano = obra.previsaoAno;
    // Filtrar anos a partir de 2017 até 2025
    if (ano >= 2017 && ano <= 2025) {
      acc[ano] = (acc[ano] || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>);

  // Garantir que todos os anos de 2020-2025 apareçam no gráfico (apenas para visualização)
  const anosCompletos = {} as Record<number, number>;
  for (let ano = 2020; ano <= 2025; ano++) {
    anosCompletos[ano] = obrasPorAno[ano] || 0;
  }

  const anosOrdenados = Object.keys(anosCompletos)
    .map(Number)
    .sort((a, b) => a - b);

  const data = {
    labels: anosOrdenados.map(String),
    datasets: [
      {
        label: 'Obras Concluídas',
        data: anosOrdenados.map(ano => anosCompletos[ano]),
        borderColor: '#228B22',
        backgroundColor: 'rgba(34, 139, 34, 0.2)',
        tension: 0.1,
        fill: true,
        pointBackgroundColor: '#228B22',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
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
            return `${context.parsed.y} obras concluídas`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        }
      }
    },
    animation: {
      onComplete: function(animation: any) {
        try {
          const chart = animation.chart;
          const ctx = chart.ctx;
          
          if (!ctx || !chart) return;
          
          ctx.save();
          ctx.font = 'bold 12px Arial';
          ctx.fillStyle = '#228B22';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          
          chart.data.datasets.forEach((dataset: any, i: number) => {
            const meta = chart.getDatasetMeta(i);
            if (!meta || !meta.data) return;
            
            meta.data.forEach((element: any, index: number) => {
              const value = dataset.data[index];
              if (value && value > 0 && element) {
                const x = element.x;
                const y = element.y;
                if (x !== undefined && y !== undefined) {
                  ctx.fillText(value.toString(), x, y - 10);
                }
              }
            });
          });
          
          ctx.restore();
        } catch (error) {
          console.error('Error drawing labels:', error);
        }
      }
    }
  };

  return (
    <div>
      <h3 className="text-lg gotham-bold mb-4" style={{color: '#2D4A7D'}}>Obras Concluídas por Ano</h3>
      <div className="h-64">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};