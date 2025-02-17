import axios from 'axios';
import { useEffect, useState } from "react";
import Header from "../../app/components/header";

interface Mascota {
  id: number;
  nombre: string;
  peso: number;
  edad: number;
  especie: string;
  raza: string;
  imagen: string | null;
  fecha_nacimiento: string;
  fecha_creacion: string;
  dueño_info: {
    id: number;
    nombre: string;
    apellido: string;
    telefono: string;
  };
}

export default function Mascotas() {
  const [mascotas, setMascotas] = useState<Mascota[]>([]);

  useEffect(() => {
    fetchMascotas();
  }, []);

  const fetchMascotas = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/mascotas/mascotas_list');
      console.log('Respuesta del servidor:', response.data);
      
      response.data.forEach((mascota: Mascota) => {
        console.log(`Mascota ${mascota.id}:`, {
          nombre: mascota.nombre,
          tieneImagen: !!mascota.imagen,
          imagenLength: mascota.imagen ? mascota.imagen.length : 0
        });
      });

      setMascotas(response.data);
    } catch (error) {
      console.error("Error al obtener las mascotas:", error);
    }
  };

  const eliminarMascota = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta mascota?')) {
      try {
        await axios.delete(`http://127.0.0.1:8000/mascotas/mascotas_delete/${id}`);
        fetchMascotas();
        alert('Mascota eliminada con éxito');
      } catch (error) {
        console.error("Error al eliminar la mascota:", error);
        alert('Error al eliminar la mascota');
      }
    }
  };

  const renderImagen = (imagen: string | null) => {
    if (!imagen) {
      console.log('No hay imagen para mostrar');
      return null;
    }
    
    console.log('Intentando renderizar imagen:', {
      longitud: imagen.length,
      primeros100Caracteres: imagen.substring(0, 100)
    });

    try {
      return (
        <div className="mb-4 flex justify-center">
          <img
            src={`data:image/jpeg;base64,${imagen}`}
            alt="Imagen de mascota"
            className="w-28 h-28 rounded-full object-cover"
            onError={(e) => {
              console.error('Error al cargar la imagen');
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      );
    } catch (error) {
      console.error('Error al renderizar la imagen:', error);
      return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Mascotas</h1>
          <button 
            onClick={() => window.location.href = '/pets/crear_pets'}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
          >
            Crear Nueva Mascota
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mascotas.map((mascota) => (
            <div key={mascota.id} className="bg-white rounded-lg shadow-md p-6">
              {mascota.imagen ? (
                renderImagen(mascota.imagen)
              ) : (
                <div className="mb-4 flex justify-center">
                  <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">Sin imagen</span>
                  </div>
                </div>
              )}
              <h2 className="text-3xl font-bold mb-2">{mascota.nombre}</h2>
              <div className="space-y-2">
                <p><span className="font-semibold text-blue-500">Peso:</span> {mascota.peso} kg</p>
                <p><span className="font-semibold text-blue-500">Edad:</span> {mascota.edad} años</p>
                <p><span className="font-semibold text-blue-500">Especie:</span> {mascota.especie}</p>
                <p><span className="font-semibold text-blue-500">Raza:</span> {mascota.raza}</p>
                <p><span className="font-semibold text-blue-500">Fecha de nacimiento:</span> {new Date(mascota.fecha_nacimiento).toLocaleDateString()}</p>
                <p><span className="font-semibold text-blue-500">Dueño:</span> {mascota.dueño_info.nombre} {mascota.dueño_info.apellido}</p>
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <button 
                    onClick={() => window.location.href = `/pets/editar_pets/${mascota.id}`}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 flex-1"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => eliminarMascota(mascota.id)}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 flex-1"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
