import { useStore } from '../store/useStore';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const StatusChart = () => {
  const { filteredObras } = useStore();

  const statusCounts = filteredObras.reduce((acc, obra) => {
    const status = obra.status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = {
    labels: Object.keys(statusCounts),
    datasets: [
      {
        data: Object.values(statusCounts),
        backgroundColor: [
          '#10B981', // Em andamento - verde
          '#F59E0B', // Planejamento - amarelo
          '#3B82F6', // Concluída - azul
          '#EF4444', // Suspensa - vermelho
          '#8B5CF6', // Outros - roxo
        ],
        borderWidth: 2,
        borderColor: '#fff',
        hoverBorderWidth: 3,
        hoverBorderColor: '#fff',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    cutout: '60%',
  };

  return (
    <div className="h-full">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Status das Obras</h3>
      <div className="h-[calc(100%-3rem)]">
        {Object.keys(statusCounts).length > 0 ? (
          <Doughnut data={data} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Nenhum dado disponível
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusChart;