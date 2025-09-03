import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Coordenadas aproximadas dos municípios do Paraná
const municipiosCoords: Record<string, [number, number]> = {
  'Curitiba': [-25.4284, -49.2733],
  'Londrina': [-23.3045, -51.1696],
  'Maringá': [-23.4205, -51.9331],
  'Cascavel': [-24.9555, -53.4552],
  'Foz do Iguaçu': [-25.5478, -54.5882],
  'Ponta Grossa': [-25.0916, -50.1668],
  'Guarapuava': [-25.3842, -51.4279],
  'São José dos Pinhais': [-25.5692, -49.2061],
  'Colombo': [-25.2917, -49.2239],
  'Toledo': [-24.7136, -53.7431],
};

const MapView = () => {
  const { filteredObras } = useStore();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Inicializar mapa se não existir
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([-24.5, -51.5], 7);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // Limpar marcadores existentes
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Agrupar obras por município
    const obrasPorMunicipio = filteredObras.reduce((acc, obra) => {
      const municipio = obra.local;
      if (!acc[municipio]) {
        acc[municipio] = [];
      }
      acc[municipio].push(obra);
      return acc;
    }, {} as Record<string, typeof filteredObras>);

    // Adicionar marcadores
    Object.entries(obrasPorMunicipio).forEach(([municipio, obras]) => {
      const coords = municipiosCoords[municipio];
      if (coords) {
        const totalObras = obras.length;
        const concluidas = obras.filter(obra => obra.status.toLowerCase().includes('concluída')).length;
        const andamento = obras.filter(obra => obra.andamento > 0 && obra.andamento < 100).length;
        
        // Cor do marcador baseada no status predominante
        let color = '#6B7280'; // Cinza padrão
        if (concluidas === totalObras) color = '#10B981'; // Verde - todas concluídas
        else if (andamento > 0) color = '#F59E0B'; // Amarelo - algumas em andamento
        else color = '#3B82F6'; // Azul - planejamento

        const marker = L.circleMarker(coords, {
          radius: Math.min(8 + totalObras * 2, 20),
          fillColor: color,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        });

        const popupContent = `
          <div class="p-2">
            <h4 class="font-bold text-sm mb-2">${municipio}</h4>
            <p class="text-xs mb-1">Total de obras: ${totalObras}</p>
            <p class="text-xs mb-1">Concluídas: ${concluidas}</p>
            <p class="text-xs mb-1">Em andamento: ${andamento}</p>
            <div class="mt-2 space-y-1">
              ${obras.slice(0, 3).map(obra => 
                `<p class="text-xs text-gray-600">${obra.objeto.substring(0, 40)}...</p>`
              ).join('')}
              ${obras.length > 3 ? `<p class="text-xs text-gray-500">+${obras.length - 3} mais...</p>` : ''}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.addTo(map);
      }
    });

    return () => {
      // Cleanup quando componente for desmontado
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [filteredObras]);

  return (
    <div className="h-full">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Localização das Obras</h3>
      <div className="h-[calc(100%-3rem)] rounded-lg overflow-hidden">
        <div ref={mapRef} className="w-full h-full" />
      </div>
    </div>
  );
};

export default MapView;