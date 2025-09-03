import { useStore } from '../store/useStore';
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

const BudgetChart = () => {
  const { filteredObras } = useStore();

  const budgetByForça = filteredObras.reduce((acc, obra) => {
    const força = obra.forca || 'Não identificado';
    if (!acc[força]) {
      acc[força] = { previsto: 0, contratado: 0 };
    }
    acc[força].previsto += obra.valorPrevisto;
    acc[força].contratado += obra.valorContratado;
    return acc;
  }, {} as Record<string, { previsto: number; contratado: number }>);

  const labels = Object.keys(budgetByForça);
  const previstoData = labels.map(label => budgetByForça[label].previsto / 1000000); // Em milhões
  const contratadoData = labels.map(label => budgetByForça[label].contratado / 1000000); // Em milhões

  const data = {
    labels,
    datasets: [
      {
        label: 'Previsto (R$ Milhões)',
        data: previstoData,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Contratado (R$ Milhões)',
        data: contratadoData,
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y;
            return `${context.dataset.label}: R$ ${value.toFixed(1)}M`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 10,
          },
          maxRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 10,
          },
          callback: function(value: any) {
            return `R$ ${value}M`;
          },
        },
      },
    },
  };

  return (
    <div className="h-full">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Orçamento por Força</h3>
      <div className="h-[calc(100%-3rem)]">
        {labels.length > 0 ? (
          <Bar data={data} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Nenhum dado disponível
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetChart;