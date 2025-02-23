'use client'
import Header from '@/app/components/header';
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
  mascota: number;  // ID de la mascota
  latitude: number;
  longitude: number;
  created_at: string;
}

interface LocationWithMascota extends Omit<Location, 'mascota'> {
  mascota: Mascota;
}

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
  const [locations, setLocations] = useState<LocationWithMascota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);

  const fetchMascotaDetails = async (mascotaId: number): Promise<Mascota> => {
    const response = await fetch(`http://127.0.0.1:8000/mascotas/mascotas_id/${mascotaId}`);
    if (!response.ok) throw new Error(`Error al obtener detalles de la mascota ${mascotaId}`);
    return response.json();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Obtener lista de mascotas
        const mascotasResponse = await fetch('http://127.0.0.1:8000/mascotas/mascotas_list');
        if (!mascotasResponse.ok) throw new Error('Error al cargar la lista de mascotas');
        const mascotasData = await mascotasResponse.json();
        setMascotas(mascotasData);

        // Obtener ubicaciones
        const locationResponse = await fetch("http://127.0.0.1:8000/location/location_list");
        if (!locationResponse.ok) throw new Error("Error al cargar las ubicaciones");
        const locationsData: Location[] = await locationResponse.json();

        // Filtrar por mascota seleccionada primero
        const filteredByPet = selectedPetId 
          ? locationsData.filter(loc => loc.mascota === selectedPetId)
          : locationsData;

        // Obtener detalles de mascotas para las ubicaciones filtradas
        const locationsWithDetails = await Promise.all(
          filteredByPet.map(async (location) => {
            const mascotaDetails = await fetchMascotaDetails(location.mascota);
            return {
              ...location,
              mascota: mascotaDetails
            };
          })
        );

        setLocations(locationsWithDetails);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPetId]);

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
    <div>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Ubicación de Mascotas</h1>
        
        <div className="mb-4">
          <select 
            className="p-2 border rounded-md w-64"
            value={selectedPetId || ''}
            onChange={(e) => setSelectedPetId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Seleccionar mascota</option>
            {mascotas.map(mascota => (
              <option key={mascota.id} value={mascota.id}>
                {mascota.nombre}
              </option>
            ))}
          </select>
        </div>

        {locations.length === 0 ? (
          <div className="text-center py-4 text-gray-600">
            {selectedPetId 
              ? "No se encontraron ubicaciones para esta mascota hoy"
              : "Selecciona una mascota para ver sus ubicaciones"}
          </div>
        ) : (
          <div className="rounded-lg shadow-lg overflow-hidden">
            <Map locations={locations} />
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
