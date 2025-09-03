import { create } from 'zustand';
import type { Obra, Filters, Metrics } from '../types';

interface StoreState {
  obras: Obra[];
  filteredObras: Obra[];
  filters: Filters;
  metrics: Metrics;
  loading: boolean;
  lastUpdate: Date | null;
  
  setObras: (obras: Obra[]) => void;
  setFilters: (filters: Partial<Filters>) => void;
  clearFilters: () => void;
  setLoading: (loading: boolean) => void;
  updateMetrics: () => void;
  applyFilters: () => void;
}

const calculateMetrics = (obras: Obra[]): Metrics => {
  if (!obras || obras.length === 0) {
    return { totalObras: 0, orcamentoTotal: 0, obrasConcluidas: 0, obrasAndamento: 0, obrasPlanejamento: 0 };
  }
  
  return {
    totalObras: obras.length,
    orcamentoTotal: obras.reduce((sum, obra) => {
      const valor = obra?.valorContratado || obra?.valorPrevisto || 0;
      return sum + (typeof valor === 'number' ? valor : 0);
    }, 0),
    obrasConcluidas: obras.filter(obra => 
      obra?.status && typeof obra.status === 'string' && 
      obra.status.toLowerCase().includes('concluída')
    ).length,
    obrasAndamento: obras.filter(obra => 
      obra?.status && typeof obra.status === 'string' && 
      obra.status.toLowerCase().includes('andamento')
    ).length,
    obrasPlanejamento: obras.filter(obra => 
      obra?.status && typeof obra.status === 'string' && 
      obra.status.toLowerCase().includes('planejamento') && obra.previsaoAno === 2026
    ).length,
  };
};

export const useStore = create<StoreState>((set, get) => ({
  obras: [],
  filteredObras: [],
  filters: {},
  metrics: { totalObras: 0, orcamentoTotal: 0, obrasConcluidas: 0, obrasAndamento: 0, obrasPlanejamento: 0 },
  loading: false,
  lastUpdate: null,

  setObras: (obras) => {
    set({ obras, lastUpdate: new Date() });
    get().updateMetrics();
    get().applyFilters();
  },

  setFilters: (newFilters) => {
    set(state => ({ filters: { ...state.filters, ...newFilters } }));
    get().applyFilters();
  },

  clearFilters: () => {
    set({ filters: {} });
    get().applyFilters();
  },

  setLoading: (loading) => set({ loading }),

  updateMetrics: () => {
    const { filteredObras } = get();
    set({ metrics: calculateMetrics(filteredObras) });
  },

  applyFilters: () => {
    const { obras, filters } = get();
    let filtered = [...obras];

    if (filters.forca) {
      filtered = filtered.filter(obra => obra.forca === filters.forca);
    }
    if (filters.status) {
      filtered = filtered.filter(obra => obra.status.toLowerCase().includes(filters.status!.toLowerCase()));
    }
    if (filters.ano) {
      filtered = filtered.filter(obra => obra.previsaoAno === filters.ano);
    }
    if (filters.municipio) {
      filtered = filtered.filter(obra => obra.local.toLowerCase().includes(filters.municipio!.toLowerCase()));
    }

    set({ filteredObras: filtered });
    get().updateMetrics();
  },
}));