import { useStore } from '../store/useStore';
import { Bar } from 'react-chartjs-2';

const Timeline = () => {
  const { filteredObras } = useStore();

  const obrasPorAno = filteredObras.reduce((acc, obra) => {
    const ano = obra.previsaoAno;
    if (!acc[ano]) {
      acc[ano] = { total: 0, concluidas: 0, andamento: 0, planejamento: 0 };
    }
    acc[ano].total += 1;
    
    if (obra.status.toLowerCase().includes('concluída')) {
      acc[ano].concluidas += 1;
    } else if (obra.andamento > 0 && obra.andamento < 100) {
      acc[ano].andamento += 1;
    } else {
      acc[ano].planejamento += 1;
    }
    
    return acc;
  }, {} as Record<number, { total: number; concluidas: number; andamento: number; planejamento: number }>);

  const anos = Object.keys(obrasPorAno).sort();
  
  const data = {
    labels: anos,
    datasets: [
      {
        label: 'Concluídas',
        data: anos.map(ano => obrasPorAno[parseInt(ano)].concluidas),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
      },
      {
        label: 'Em Andamento',
        data: anos.map(ano => obrasPorAno[parseInt(ano)].andamento),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 1,
      },
      {
        label: 'Planejamento',
        data: anos.map(ano => obrasPorAno[parseInt(ano)].planejamento),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
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
          padding: 10,
          font: {
            size: 10,
          },
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          font: {
            size: 10,
          },
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="h-full">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Timeline por Ano</h3>
      <div className="h-[calc(100%-3rem)]">
        {anos.length > 0 ? (
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

export default Timeline;