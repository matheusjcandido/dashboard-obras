import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2, Minimize2 } from 'lucide-react';

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

interface MapaParanaProps {
  obras: Obra[];
  obrasEmAndamento?: Obra[];
}

// Coordenadas de cidades do Paraná (expandida para cobrir mais localidades)
const coordenadasCidades: Record<string, [number, number]> = {
  'Curitiba': [-25.4284, -49.2733],
  'Londrina': [-23.3045, -51.1696],
  'Maringá': [-23.4205, -51.9331],
  'Cascavel': [-24.9558, -53.4552],
  'Ponta Grossa': [-25.0916, -50.1668],
  'Foz do Iguaçu': [-25.5478, -54.5882],
  'Guarapuava': [-25.3842, -51.4617],
  'Piraquara': [-25.4419, -49.0619],
  'Paranaguá': [-25.5204, -48.5077],
  'Campo Largo': [-25.4595, -49.5275],
  'São José dos Pinhais': [-25.5324, -49.2063],
  'Colombo': [-25.2917, -49.2242],
  'Araucária': [-25.5934, -49.4067],
  'Toledo': [-24.7136, -53.7403],
  'Apucarana': [-23.5501, -51.4607],
  'Arapongas': [-23.4180, -51.4248],
  'Almirante Tamandaré': [-25.3247, -49.3108],
  'Campo Mourão': [-24.0456, -52.3783],
  'Paranavaí': [-23.0730, -52.4648],
  'Cambé': [-23.2751, -51.2797],
  'Umuarama': [-23.7663, -53.3250],
  'Fazenda Rio Grande': [-25.6416, -49.3097],
  'Pinhais': [-25.4448, -49.1920],
  'Sarandi': [-23.4473, -51.8789],
  'Francisco Beltrão': [-26.0811, -53.0547],
  'Cianorte': [-23.6638, -52.6054],
  'Castro': [-24.7886, -50.0119],
  'Irati': [-25.4683, -50.6511],
  'União da Vitória': [-26.2282, -51.0858],
  'Telêmaco Borba': [-24.3230, -50.6156],
  'Rolândia': [-23.3096, -51.3706],
  'Cornélio Procópio': [-23.1817, -50.6476],
  'São Mateus do Sul': [-25.8746, -50.3837],
  'Lapa': [-25.7650, -49.7150],
  'Ibiporã': [-23.2706, -51.0403],
  'Prudentópolis': [-25.2130, -50.9778],
  'Ivaiporã': [-24.2297, -51.6794],
  'Dois Vizinhos': [-25.7319, -53.0569]
};

// Cores por força
const getCorPorForca = (forca?: string) => {
  switch (forca) {
    case 'CBMPR': return '#DC2626'; // Vermelho - Bombeiros
    case 'PMPR': return '#EAB308'; // Amarelo - Polícia Militar
    case 'PCPR': return '#6B7280'; // Cinza - Polícia Civil
    case 'PCP': return '#2563EB'; // Azul - Polícia Científica
    case 'DEPPEN': return '#16A34A'; // Verde - Polícia Penal
    default: return '#9CA3AF'; // Cinza padrão
  }
};

// Cache para coordenadas geocodificadas
const geocodeCache = new Map<string, [number, number] | null>();

// Função para geocodificar município usando Nominatim (OpenStreetMap)
const geocodeMunicipio = async (municipio: string): Promise<[number, number] | null> => {
  const cleanMunicipio = municipio.replace(/, ?PT-BR$|, ?Brasil$|, ?Brazil$/i, '').trim();
  
  if (geocodeCache.has(cleanMunicipio)) {
    return geocodeCache.get(cleanMunicipio) || null;
  }
  
  try {
    const query = `${cleanMunicipio}, Paraná, Brazil`;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
      {
        headers: {
          'User-Agent': 'Dashboard-SESP/1.0'
        }
      }
    );
    
    if (!response.ok) {
      geocodeCache.set(cleanMunicipio, null);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      geocodeCache.set(cleanMunicipio, coords);
      console.log(`🗺️ Geocoded ${cleanMunicipio}:`, coords);
      return coords;
    }
    
    geocodeCache.set(cleanMunicipio, null);
    return null;
  } catch (error) {
    console.warn(`❌ Erro ao geocodificar ${cleanMunicipio}:`, error);
    geocodeCache.set(cleanMunicipio, null);
    return null;
  }
};

// Criar ícones personalizados para cada força
const createCustomIcon = (forca?: string, count?: number) => {
  const color = getCorPorForca(forca);
  const size = count && count > 1 ? 35 : 25;
  
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 3}" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 7}" fill="white"/>
        ${count && count > 1 ? `
          <text x="${size/2}" y="${size/2 + 3}" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="${color}">
            ${count}
          </text>
        ` : ''}
      </svg>
    `)}`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2],
  });
};

// Componente para lidar com o redimensionamento do mapa
const MapResizeHandler: React.FC<{ isExpanded: boolean; centerParana: [number, number] }> = ({ isExpanded, centerParana }) => {
  const map = useMap();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (!isExpanded) {
        // Volta à posição e zoom originais quando fecha
        map.setView(centerParana, 6);
      }
    }, 300); // Aguarda a transição CSS completar
    
    return () => clearTimeout(timer);
  }, [isExpanded, map, centerParana]);
  
  return null;
};

export const MapaParana: React.FC<MapaParanaProps> = ({ obras, obrasEmAndamento }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [geocodedCoords, setGeocodedCoords] = useState<Map<string, [number, number]>>(new Map());
  
  // Handle ESC key to close expanded map
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };
    
    if (isExpanded) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isExpanded]);
  
  // Centralizar no Paraná
  const centerParana: [number, number] = [-25.2521, -52.0215];

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Usar obras em andamento se fornecidas, senão usar todas as obras
  const obrasParaMapa = obrasEmAndamento && obrasEmAndamento.length > 0 ? obrasEmAndamento : obras;
  
  // Função para normalizar nomes de cidades (remover acentos, espaços, etc.)
  const normalizarNome = (nome: string) => {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  };
  
  // Função para obter coordenadas (estática ou geocodificada)
  const getCoordinates = (local: string): [number, number] | null => {
    const cleanLocal = local.replace(/, ?PT-BR$|, ?Brasil$|, ?Brazil$/i, '').trim();
    
    // Tentar correspondência exata primeiro
    if (coordenadasCidades[cleanLocal]) {
      return coordenadasCidades[cleanLocal];
    }
    
    // Tentar correspondência normalizada
    const localNormalizado = normalizarNome(cleanLocal);
    const cidadeEncontrada = Object.keys(coordenadasCidades).find(cidade => 
      normalizarNome(cidade) === localNormalizado
    );
    
    if (cidadeEncontrada) {
      return coordenadasCidades[cidadeEncontrada];
    }
    
    // Tentar correspondência parcial (contém o nome da cidade)
    const cidadeParcial = Object.keys(coordenadasCidades).find(cidade => {
      const cidadeNorm = normalizarNome(cidade);
      const localNorm = normalizarNome(cleanLocal);
      return localNorm.includes(cidadeNorm) || cidadeNorm.includes(localNorm);
    });
    
    if (cidadeParcial) {
      return coordenadasCidades[cidadeParcial];
    }
    
    // Verificar se já foi geocodificado
    return geocodedCoords.get(cleanLocal) || null;
  };

  // Filtrar obras que têm coordenadas conhecidas ou podem ser geocodificadas
  // const obrasComCoordenadas = obrasParaMapa.filter(obra => {
  //   return getCoordinates(obra.local) !== null;
  // });
  
  // Geocodificar obras sem coordenadas
  React.useEffect(() => {
    const geocodeObras = async () => {
      const obrasParaGeocodificar = obrasParaMapa.filter(obra => !getCoordinates(obra.local));
      
      for (const obra of obrasParaGeocodificar.slice(0, 50)) { // Increased limit but with rate limiting
        const cleanLocal = obra.local.replace(/, ?PT-BR$|, ?Brasil$|, ?Brazil$/i, '').trim();
        
        if (!geocodedCoords.has(cleanLocal)) {
          try {
            const coords = await geocodeMunicipio(cleanLocal);
            if (coords) {
              setGeocodedCoords(prev => new Map(prev).set(cleanLocal, coords));
              // Small delay to respect rate limits
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (error) {
            console.warn(`Erro ao geocodificar ${cleanLocal}:`, error);
          }
        }
      }
    };
    
    if (obrasParaMapa.length > 0) {
      geocodeObras();
    }
  }, [obrasParaMapa.map(o => o.local).join(',')]);
  
  // Recalcular obras com coordenadas após geocodificação
  const obrasComCoordenadasFinal = obrasParaMapa.filter(obra => {
    return getCoordinates(obra.local) !== null;
  });

  // Agrupar obras por localização
  const obrasPorLocalizacao = obrasComCoordenadasFinal.reduce((acc, obra) => {
    const coords = getCoordinates(obra.local);
    if (!coords) return acc;
    
    const key = `${coords[0]},${coords[1]}`;
    if (!acc[key]) {
      acc[key] = {
        coords,
        obras: [],
        local: obra.local.replace(/, ?PT-BR$|, ?Brasil$|, ?Brazil$/i, '').trim()
      };
    }
    acc[key].obras.push(obra);
    return acc;
  }, {} as Record<string, { coords: [number, number], obras: Obra[], local: string }>);
  
  console.log('🗺️ Obras para mapa:', obrasParaMapa.length);
  console.log('🗺️ Obras com coordenadas:', obrasComCoordenadasFinal.length);
  console.log('🗺️ Localizações agrupadas:', Object.keys(obrasPorLocalizacao).length);
  
  // Debug específico para obras em andamento
  if (obrasEmAndamento && obrasEmAndamento.length > 0) {
    const obrasSemCoordenadas = obrasParaMapa.filter(obra => !getCoordinates(obra.local));
    console.log('🗺️ Obras em andamento sem coordenadas:', obrasSemCoordenadas.length);
    console.log('🗺️ Locais sem coordenadas:', obrasSemCoordenadas.map(obra => obra.local));
  }

  return (
    <div className={`
      h-full w-full rounded transition-all duration-300 ease-in-out
      ${isExpanded 
        ? 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vh] z-[9999] bg-white shadow-2xl' 
        : 'relative'
      }
    `}>
      <div className={`flex justify-between items-center p-3 bg-gray-50 rounded-t ${isExpanded ? 'relative z-50' : ''}`}>
        <h3 className="text-sm font-medium text-gray-900">
          {obrasEmAndamento && obrasEmAndamento.length > 0 ? `Obras em Andamento (${obrasEmAndamento.length})` : `Todas as Obras (${obras.length})`}
        </h3>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🗺️ Toggle button clicked, current expanded:', isExpanded);
            toggleExpanded();
          }}
          className={`p-2 hover:bg-gray-200 rounded transition-colors z-50 relative ${
            isExpanded ? 'bg-gray-200' : ''
          }`}
          title={isExpanded ? "Minimizar" : "Expandir"}
        >
          {isExpanded ? (
            <Minimize2 className="w-5 h-5 text-gray-700" />
          ) : (
            <Maximize2 className="w-5 h-5 text-gray-700" />
          )}
        </button>
      </div>
      
      <div className={`
        ${isExpanded ? 'h-[calc(90vh-4rem)]' : 'h-[calc(100%-3rem)]'}
        rounded-b overflow-hidden
      `}>
        <MapContainer
          center={centerParana}
          zoom={isExpanded ? 7 : 6}
          style={{ height: '100%', width: '100%' }}
          zoomControl={isExpanded}
        >
          <MapResizeHandler isExpanded={isExpanded} centerParana={centerParana} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          
          {Object.keys(obrasPorLocalizacao).length === 0 && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <p className="text-sm text-gray-600">
                {obrasParaMapa.length === 0 ? 'Nenhuma obra encontrada' : 'Carregando localização das obras...'}
              </p>
              {obrasParaMapa.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {obrasParaMapa.length} obras sem coordenadas mapeadas
                </p>
              )}
            </div>
          )}
          
          {Object.entries(obrasPorLocalizacao).map(([key, grupo]) => {
            const { coords, obras, local } = grupo;
            const count = obras.length;
            
            // Usar a força mais comum no grupo para o ícone
            const forcaCounts = obras.reduce((acc, obra) => {
              const forca = obra.forca || 'Não identificado';
              acc[forca] = (acc[forca] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            
            const forcaPrincipal = Object.entries(forcaCounts)
              .sort(([, a], [, b]) => b - a)[0]?.[0];
            
            return (
              <Marker
                key={key}
                position={coords}
                icon={createCustomIcon(forcaPrincipal, count)}
              >
                <Popup className="custom-popup">
                  <div className="p-2 min-w-64 max-h-96 overflow-y-auto">
                    <h4 className="font-semibold text-sm mb-2">
                      {local} {count > 1 && <span className="text-blue-600">({count} obras)</span>}
                    </h4>
                    
                    {count > 1 ? (
                      <div className="space-y-2">
                        {obras.map((obra, index) => (
                          <div key={index} className="border-b border-gray-200 pb-2 last:border-b-0">
                            <p className="font-medium text-xs mb-1">{obra.objeto}</p>
                            <p className="text-xs text-gray-600 mb-1">
                              <strong>Força:</strong> {obra.forca}
                            </p>
                            <p className="text-xs text-gray-600 mb-1">
                              <strong>Status:</strong> 
                              <span className={`ml-1 inline-flex px-1 py-0.5 text-xs font-semibold rounded ${
                                obra.status.toLowerCase().includes('concluída') 
                                  ? 'bg-green-100 text-green-800'
                                  : obra.status.toLowerCase().includes('andamento')
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : obra.status.toLowerCase().includes('planejamento')
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {obra.status}
                              </span>
                            </p>
                            <p className="text-xs text-gray-600">
                              <strong>Valor:</strong> {(obra.valorContratado || obra.valorPrevisto) >= 1000000 
                                ? `R$ ${((obra.valorContratado || obra.valorPrevisto) / 1000000).toFixed(1)}M`
                                : `R$ ${((obra.valorContratado || obra.valorPrevisto) / 1000).toFixed(0)} mil`
                              }
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">
                          <strong>Força:</strong> {obras[0].forca}
                        </p>
                        <p className="text-xs text-gray-600 mb-1">
                          <strong>Status:</strong> 
                          <span className={`ml-1 inline-flex px-1 py-0.5 text-xs font-semibold rounded ${
                            obras[0].status.toLowerCase().includes('concluída') 
                              ? 'bg-green-100 text-green-800'
                              : obras[0].status.toLowerCase().includes('andamento')
                              ? 'bg-yellow-100 text-yellow-800'
                              : obras[0].status.toLowerCase().includes('planejamento')
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {obras[0].status}
                          </span>
                        </p>
                        <p className="text-xs text-gray-600">
                          <strong>Valor:</strong> {(obras[0].valorContratado || obras[0].valorPrevisto) >= 1000000 
                            ? `R$ ${((obras[0].valorContratado || obras[0].valorPrevisto) / 1000000).toFixed(1)}M`
                            : `R$ ${((obras[0].valorContratado || obras[0].valorPrevisto) / 1000).toFixed(0)} mil`
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
      
      {/* Legenda das cores */}
      {isExpanded && (
        <div className="absolute bottom-4 right-4 bg-white p-3 rounded shadow border">
          <h4 className="text-xs font-semibold mb-2">Legenda</h4>
          <div className="space-y-1">
            <div className="flex items-center text-xs">
              <div className="w-3 h-3 rounded-full bg-red-600 mr-2"></div>
              CBMPR
            </div>
            <div className="flex items-center text-xs">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
              PMPR
            </div>
            <div className="flex items-center text-xs">
              <div className="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
              PCPR
            </div>
            <div className="flex items-center text-xs">
              <div className="w-3 h-3 rounded-full bg-blue-600 mr-2"></div>
              PCP
            </div>
            <div className="flex items-center text-xs">
              <div className="w-3 h-3 rounded-full bg-green-600 mr-2"></div>
              DEPPEN
            </div>
          </div>
        </div>
      )}
    </div>
  );
};