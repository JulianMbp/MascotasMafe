'use client'
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';

// Interfaces
interface Dueño {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
}

interface Mascota {
  id: number;
  nombre: string;
  imagen: string;
  raza: string;
  edad: number;
  dueño_info: Dueño;
}

interface Location {
  id: number;
  mascota: number;
  latitude: string | number;
  longitude: string | number;
  created_at: string;
  timestamp?: number;
}

interface LocationWithMascota extends Omit<Location, 'mascota'> {
  mascota: Mascota;
}

interface MapProps {
  locations: LocationWithMascota[];
}

// Modificar las interfaces para asegurar consistencia
interface LocationMapItem {
  id: number;
  location: LocationWithMascota;
  timestamp: number;
  position: [number, number];
}

// Crear una clase personalizada para el mapa de ubicaciones con tipos genéricos
class LocationsMap<K, V> {
  private map: Map<K, V>;

  constructor(entries?: readonly (readonly [K, V])[] | null) {
    this.map = new Map<K, V>(entries || []);
  }

  set(id: K, location: V): void {
    this.map.set(id, location);
  }

  get(id: K): V | undefined {
    return this.map.get(id);
  }

  values(): V[] {
    return Array.from(this.map.values());
  }
}

// Función para crear un icono personalizado con la imagen de la mascota
const createPetIcon = (imageBase64: string) => {
  const imageUrl = imageBase64.startsWith('data:image') 
    ? imageBase64 
    : `data:image/jpeg;base64,${imageBase64}`;

  return L.divIcon({
    className: 'custom-pet-marker',
    html: `<div class="pet-marker-container">
             <img src="${imageUrl}" alt="Pet location" class="pet-marker-image" />
           </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
};

// Icono por defecto
const defaultIcon = L.icon({
  iconUrl: "/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function Map({ locations: initialLocations }: MapProps) {
  const [locations, setLocations] = useState<LocationWithMascota[]>(initialLocations || []);
  const [lastUpdateId, setLastUpdateId] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  // Aumentamos el intervalo a 10 segundos
  const REFRESH_INTERVAL = 10000;

  const fetchLatestLocations = useCallback(async () => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      const timestamp = new Date().getTime();
      const url = `http://127.0.0.1:8000/location/latest?last_id=${lastUpdateId}&_=${timestamp}`;
      
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) throw new Error('Error al obtener ubicaciones');
      
      const newLocations: Location[] = await response.json();
      
      if (Array.isArray(newLocations) && newLocations.length > 0) {
        const mascotasCache = new LocationsMap<number, Mascota>();

        const locationsWithDetails = await Promise.all(
          newLocations.map(async (location) => {
            if (!location?.mascota) return null;
            
            try {
              let mascotaData = mascotasCache.get(location.mascota);
              
              if (!mascotaData) {
                const mascotaResponse = await fetch(
                  `http://127.0.0.1:8000/mascotas/mascotas_id/${location.mascota}`,
                  { headers: { 'Cache-Control': 'no-cache' } }
                );
                
                if (!mascotaResponse.ok) return null;
                mascotaData = await mascotaResponse.json();
                if (!mascotaData) return null;
                
                mascotasCache.set(location.mascota, mascotaData);
              }

              return {
                ...location,
                mascota: mascotaData
              } as LocationWithMascota;
            } catch (error) {
              console.error(`Error fetching mascota ${location.mascota}:`, error);
              return null;
            }
          })
        );

        const validLocations = locationsWithDetails.filter((loc): loc is LocationWithMascota => 
          loc !== null && loc.id !== undefined
        );
        
        if (validLocations.length > 0) {
          const maxId = Math.max(...validLocations.map(loc => loc.id));
          setLastUpdateId(maxId);
          setLocations(prev => [...prev, ...validLocations]);
        }
      }
      
      setLastUpdateTime(new Date());
      
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [lastUpdateId, isUpdating]);

  // Configurar el intervalo de actualización
  useEffect(() => {
    if (!isInitialized) return;

    // Primera carga
    fetchLatestLocations();

    // Configurar intervalo
    const intervalId = setInterval(fetchLatestLocations, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [isInitialized, fetchLatestLocations]);

  useEffect(() => {
    // Fix para los íconos de Leaflet en Next.js
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/marker-icon-2x.png',
      iconUrl: '/marker-icon.png',
      shadowUrl: '/marker-shadow.png',
    });
  }, []);

  // Coordenadas del centro de Pasto, Nariño
  const PASTO_CENTER: [number, number] = [1.2136, -77.2811];

  // Actualizar locationsByPet para usar el estado local
  const locationsByPet = useMemo(() => {
    const groupedLocations = locations.reduce((acc, location) => {
      const petId = location.mascota.id;
      if (!acc[petId]) {
        acc[petId] = [];
      }
      acc[petId].push({
        position: [
          parseFloat(location.latitude.toString()),
          parseFloat(location.longitude.toString())
        ] as [number, number],
        timestamp: new Date(location.created_at).getTime(),
        location: location,
      });
      return acc;
    }, {} as Record<number, Array<{
      position: [number, number];
      timestamp: number;
      location: LocationWithMascota;
    }>>);

    // Ordenar por timestamp y limitar a las últimas 100 ubicaciones
    Object.keys(groupedLocations).forEach(petId => {
      groupedLocations[petId].sort((a, b) => a.timestamp - b.timestamp);
      groupedLocations[petId] = groupedLocations[petId].slice(-100);
    });

    return groupedLocations;
  }, [locations]);

  // Generar colores aleatorios pero consistentes para cada mascota
  const getPetColor = (petId: number) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
      '#D4A5A5', '#9B59B6', '#3498DB', '#F1C40F', '#2ECC71'
    ];
    return colors[petId % colors.length];
  };

  return (
    <div className="relative">
      <MapContainer
        center={PASTO_CENTER}
        zoom={13}
        className="h-[600px] w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Dibujar las líneas de ruta para cada mascota */}
        {Object.entries(locationsByPet).map(([petId, petLocations]) => (
          <Polyline
            key={`path-${petId}`}
            positions={petLocations.map(loc => loc.position)}
            pathOptions={{
              color: getPetColor(Number(petId)),
              weight: 3,
              opacity: 0.7,
              dashArray: '10, 10', // Línea punteada
            }}
          />
        ))}

        {locations.map((location) => (
          <Marker
            key={`${location.id}-${location.mascota.id}`}
            position={[
              parseFloat(location.latitude.toString()),
              parseFloat(location.longitude.toString())
            ]}
            icon={location.mascota.imagen 
              ? createPetIcon(location.mascota.imagen)
              : defaultIcon
            }
          >
            <Popup>
              <div className="text-center p-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {location.mascota.nombre}
                </h3>
                {location.mascota.imagen && (
                  <div className="my-3">
                    <img
                      src={`data:image/jpeg;base64,${location.mascota.imagen}`}
                      alt={location.mascota.nombre}
                      className="w-24 h-24 rounded-full object-cover mx-auto"
                    />
                  </div>
                )}
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Raza: {location.mascota.raza}</p>
                  <p>Edad: {location.mascota.edad} años</p>
                  <p>Dueño: {location.mascota.dueño_info.nombre} {location.mascota.dueño_info.apellido}</p>
                  <p>Contacto: {location.mascota.dueño_info.telefono}</p>
                  <p>Ubicación: {parseFloat(location.latitude.toString()).toFixed(6)}, 
                     {parseFloat(location.longitude.toString()).toFixed(6)}</p>
                  <p className="mt-2 text-xs">
                    Última actualización:{" "}
                    {new Date(location.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Indicador mejorado de última actualización */}
      <div className="absolute bottom-4 right-4 bg-white p-2 rounded-lg shadow-md z-[1000]">
        <p className="text-sm text-gray-600">
          Última actualización: {
            lastUpdateTime 
              ? lastUpdateTime.toLocaleString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })
              : 'Nunca'
          }
        </p>
        <p className="text-xs text-gray-400">
          Actualizando cada 10 segundos
        </p>
        {isUpdating && (
          <p className="text-xs text-blue-500">
            Actualizando...
          </p>
        )}
      </div>
    </div>
  );
} 