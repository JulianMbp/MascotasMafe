'use client'
import dynamic from 'next/dynamic';
import { useEffect, useState } from "react";

// Interfaces
interface Mascota {
  id: number;
  nombre: string;
  imagen: string;
  raza: string;
  edad: number;
  dueño: {
    nombre: string;
    telefono: string;
  };
}

interface Location {
  id: number;
  mascota: number;
  latitude: number;
  longitude: number;
  created_at: string;
}

interface LocationWithMascota extends Location {
  mascota: Mascota;
}

// Cargar el mapa dinámicamente solo en el cliente
const Map = dynamic(
  () => import('../../components/Map').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] w-full flex items-center justify-center bg-gray-100">
        <p>Cargando mapa...</p>
      </div>
    ),
  }
);

export default function Location() {
  const [locationsWithPets, setLocationsWithPets] = useState<LocationWithMascota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLocationsWithPets();
  }, []);

  const fetchMascotaDetails = async (mascotaId: number): Promise<Mascota> => {
    console.log('Obteniendo detalles de mascota:', mascotaId); // Para debug
    const response = await fetch(`http://127.0.0.1:8000/mascotas/mascotas_id/${mascotaId}`);
    if (!response.ok) {
      throw new Error(`Error al obtener detalles de la mascota ${mascotaId}`);
    }
    const data = await response.json();
    console.log('Detalles de mascota recibidos:', data); // Para debug
    return data;
  };

  const fetchLocationsWithPets = async () => {
    try {
      // Obtener las ubicaciones
      const locationResponse = await fetch("http://127.0.0.1:8000/location/location_list");
      if (!locationResponse.ok) {
        throw new Error("Error al cargar las ubicaciones");
      }
      const locations: Location[] = await locationResponse.json();

      console.log('Ubicaciones recibidas:', locations); // Para debug

      // Obtener los detalles de cada mascota
      const locationsWithPetDetails = await Promise.all(
        locations.map(async (location) => {
          if (!location.mascota) {
            console.error('ID de mascota no encontrado para la ubicación:', location);
            return null;
          }
          try {
            const mascota = await fetchMascotaDetails(location.mascota); // Usar location.mascota en lugar de location.mascota_id
            return {
              ...location,
              mascota,
            };
          } catch (error) {
            console.error(`Error al obtener detalles de la mascota ${location.mascota}:`, error);
            return null;
          }
        })
      );

      // Filtrar las ubicaciones nulas (las que fallaron)
      const validLocations = locationsWithPetDetails.filter((loc): loc is LocationWithMascota => loc !== null);
      
      setLocationsWithPets(validLocations);
    } catch (err) {
      console.error('Error al cargar las ubicaciones:', err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl font-semibold text-gray-700">Cargando ubicaciones...</div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl font-semibold text-red-600">Error: {error}</div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Ubicación de Mascotas</h1>
        
        <div className="rounded-lg shadow-lg overflow-hidden">
          <Map locations={locationsWithPets || []} />
        </div>
      </div>
    </div>
  );
}
