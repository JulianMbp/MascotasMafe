import axios from 'axios';
import { useEffect, useState } from "react";
import Header from "../../app/components/header";

interface Dueño {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  fecha_creacion: string;
}

export default function Dueños() {
  const [dueños, setDueños] = useState<Dueño[]>([]);

  useEffect(() => {
    fetchDueños();
  }, []);

  const fetchDueños = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/dueño/dueños_list');
      setDueños(response.data);
    } catch (error) {
      console.error("Error al obtener los dueños:", error);
    }
  };

  const eliminarDueño = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este dueño?')) {
      try {
        await axios.delete(`http://127.0.0.1:8000/dueño/dueños_delete/${id}`);
        fetchDueños();
        alert('Dueño eliminado con éxito');
      } catch (error) {
        console.error("Error al eliminar el dueño:", error);
        alert('Error al eliminar el dueño');
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dueños</h1>
          <button 
            onClick={() => window.location.href = '/owners/crear_owner'}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
          >
            Crear Nuevo Dueño
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dueños.map((dueño) => (
            <div key={dueño.id} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">{dueño.nombre} {dueño.apellido}</h2>
              <div className="space-y-2">
                <p><span className="font-semibold text-blue-500">Email:</span> {dueño.email}</p>
                <p><span className="font-semibold text-blue-500">Teléfono:</span> {dueño.telefono}</p>
                <p><span className="font-semibold text-blue-500">Dirección:</span> {dueño.direccion}</p>
                <p><span className="font-semibold text-blue-500">Ciudad:</span> {dueño.ciudad}</p>
                <p><span className="font-semibold text-blue-500">Fecha de registro:</span> {new Date(dueño.fecha_creacion).toLocaleDateString()}</p>
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <button 
                    onClick={() => window.location.href = `/owners/editar_owner/${dueño.id}`}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 flex-1"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => eliminarDueño(dueño.id)}
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
