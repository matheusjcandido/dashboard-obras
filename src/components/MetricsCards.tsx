import { memo } from 'react';
import { useStore } from '../store/useStore';
import { Building2, DollarSign, CheckCircle, Clock, Calendar } from 'lucide-react';

const MetricsCards = memo(() => {
  const { metrics } = useStore();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const cards = [
    {
      title: 'Total de Obras',
      value: metrics.totalObras,
      icon: Building2,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Orçamento Total',
      value: formatCurrency(metrics.orcamentoTotal),
      icon: DollarSign,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Obras Concluídas',
      value: metrics.obrasConcluidas,
      icon: CheckCircle,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600'
    },
    {
      title: 'Em Andamento',
      value: metrics.obrasAndamento,
      icon: Clock,
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    },
    {
      title: 'EM PLANEJAMENTO',
      subtitle: 'LOA 2026',
      value: metrics.obrasPlanejamento,
      icon: Calendar,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    }
  ];

  return (
    <div className="h-full">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Métricas Gerais</h3>
      <div className="grid grid-cols-3 grid-rows-2 gap-3 h-[calc(100%-3rem)]">
        {cards.slice(0, 4).map((card, index) => (
          <div key={index} className={`bg-gray-50 rounded-lg p-3 flex flex-col justify-between ${index === 3 ? 'col-span-2' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <card.icon className={`h-6 w-6 ${card.textColor}`} />
              <div className={`w-2 h-2 rounded-full ${card.color}`}></div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{card.value}</p>
              <p className="text-sm text-gray-600">{card.title}</p>
              {card.subtitle && <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>}
            </div>
          </div>
        ))}
        {cards[4] && (() => {
          const IconComponent = cards[4].icon;
          return (
            <div className="bg-gray-50 rounded-lg p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <IconComponent className={`h-6 w-6 ${cards[4].textColor}`} />
                <div className={`w-2 h-2 rounded-full ${cards[4].color}`}></div>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{cards[4].value}</p>
                <p className="text-sm text-gray-600">{cards[4].title}</p>
                {cards[4].subtitle && <p className="text-xs text-gray-500 mt-1">{cards[4].subtitle}</p>}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
});

MetricsCards.displayName = 'MetricsCards';

export default MetricsCards;