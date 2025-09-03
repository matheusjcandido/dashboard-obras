export interface Obra {
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

export interface Filters {
  forca?: string;
  status?: string;
  ano?: number;
  municipio?: string;
}

export interface Metrics {
  totalObras: number;
  orcamentoTotal: number;
  obrasConcluidas: number;
  obrasAndamento: number;
  obrasPlanejamento: number;
}