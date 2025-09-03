import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

const ObrasTable = () => {
  const { filteredObras } = useStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 8;

  const filteredData = useMemo(() => {
    return filteredObras.filter(obra => 
      obra.objeto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obra.local.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obra.protocolo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [filteredObras, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    if (status.toLowerCase().includes('concluída')) return 'text-green-600 bg-green-100';
    if (status.toLowerCase().includes('andamento')) return 'text-orange-600 bg-orange-100';
    if (status.toLowerCase().includes('planejamento')) return 'text-blue-600 bg-blue-100';
    return 'text-gray-600 bg-gray-100';
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Lista de Obras</h3>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar obras..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sesp-blue focus:border-transparent"
            />
          </div>
          <span className="text-sm text-gray-600">
            {filteredData.length} obra{filteredData.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Protocolo</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Objeto</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Local</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Força</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Ano</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Valor</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Progresso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentData.map((obra) => (
                <tr key={obra.protocolo} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{obra.protocolo}</td>
                  <td className="px-6 py-3 text-gray-700">
                    <div className="max-w-xs truncate" title={obra.objeto}>
                      {obra.objeto}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{obra.local}</td>
                  <td className="px-4 py-3 text-gray-700">{obra.forca}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(obra.status)}`}>
                      {obra.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{obra.previsaoAno}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {formatCurrency(obra.valorContratado || obra.valorPrevisto)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-sesp-lightBlue h-2 rounded-full transition-all duration-300"
                          style={{ width: `${obra.andamento}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 w-10 text-right">
                        {obra.andamento}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Mostrando {startIndex + 1} a {Math.min(endIndex, filteredData.length)} de {filteredData.length} obras
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 text-sm rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-sesp-blue text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObrasTable;