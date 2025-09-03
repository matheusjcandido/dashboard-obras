import { useStore } from '../store/useStore';
import { Filter, RefreshCw } from 'lucide-react';

const Header = () => {
  const { filters, setFilters, clearFilters, lastUpdate, loading } = useStore();

  const forcas = ['Bombeiros', 'Polícia Militar', 'Polícia Civil', 'Polícia Científica', 'DEPEN'];
  const statusOptions = ['Em andamento', 'Planejamento', 'Concluída', 'Suspensa'];
  const anos = [2023, 2024, 2025, 2026];

  return (
    <header className="bg-sesp-blue text-white px-6 py-4 flex flex-col xl:flex-row items-start xl:items-center justify-between space-y-4 xl:space-y-0">
      <div className="flex flex-col xl:flex-row items-start xl:items-center space-y-4 xl:space-y-0 xl:space-x-6 w-full xl:w-auto">
        <h1 className="text-xl xl:text-2xl font-bold">Dashboard de Obras - SESP</h1>
        
        <div className="flex flex-wrap items-center gap-2 xl:gap-4">
          <Filter className="h-5 w-5" />
          
          <select
            value={filters.forca || ''}
            onChange={(e) => setFilters({ forca: e.target.value || undefined })}
            className="bg-sesp-lightBlue text-white px-3 py-1 rounded text-sm border border-white/20"
          >
            <option value="">Todas as Forças</option>
            {forcas.map(forca => (
              <option key={forca} value={forca}>{forca}</option>
            ))}
          </select>

          <select
            value={filters.status || ''}
            onChange={(e) => setFilters({ status: e.target.value || undefined })}
            className="bg-sesp-lightBlue text-white px-3 py-1 rounded text-sm border border-white/20"
          >
            <option value="">Todos os Status</option>
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select
            value={filters.ano || ''}
            onChange={(e) => setFilters({ ano: e.target.value ? parseInt(e.target.value) : undefined })}
            className="bg-sesp-lightBlue text-white px-3 py-1 rounded text-sm border border-white/20"
          >
            <option value="">Todos os Anos</option>
            {anos.map(ano => (
              <option key={ano} value={ano}>{ano}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Buscar município..."
            value={filters.municipio || ''}
            onChange={(e) => setFilters({ municipio: e.target.value || undefined })}
            className="bg-sesp-lightBlue text-white px-3 py-1 rounded text-sm border border-white/20 placeholder-white/70"
          />

          <button
            onClick={clearFilters}
            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm transition-colors"
          >
            Limpar
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-sm">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>
            {loading ? 'Atualizando...' : lastUpdate ? 
              `Última atualização: ${lastUpdate.toLocaleTimeString()}` : 
              'Sem dados'
            }
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;