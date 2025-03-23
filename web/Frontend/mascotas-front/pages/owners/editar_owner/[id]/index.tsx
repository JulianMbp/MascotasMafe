import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Header from '../../../../app/components/header';

interface FormData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
}

export default function EditarDueño() {
  const router = useRouter();
  const { id } = router.query;
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
  });

  // Cargar datos del dueño
  useEffect(() => {
    const fetchDueño = async () => {
      if (!id) return;
      
      try {
        console.log('Cargando datos del dueño...');
        const response = await axios.get(`http://127.0.0.1:8000/dueño/dueños_id/${id}`);
        const dueño = response.data;
        
        setFormData({
          nombre: dueño.nombre,
          apellido: dueño.apellido,
          email: dueño.email,
          telefono: dueño.telefono,
          direccion: dueño.direccion,
          ciudad: dueño.ciudad,
        });
      } catch (error) {
        console.error('Error al cargar el dueño:', error);
        alert('Error al cargar los datos del dueño');
      }
    };

    fetchDueño();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.put(`http://127.0.0.1:8000/dueño/dueños_update/${id}`, formData);
      console.log('Respuesta del servidor:', response.data);
      alert('Dueño actualizado con éxito');
      router.push('/owners');
    } catch (error) {
      console.error('Error al actualizar el dueño:', error);
      if (axios.isAxiosError(error)) {
        console.error('Detalles del error:', {
          status: error.response?.status,
          data: error.response?.data
        });
      }
      alert('Error al actualizar el dueño');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Editar Dueño</h1>
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-4 bg-white p-6 rounded-lg shadow-md">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Apellido</label>
            <input
              type="text"
              value={formData.apellido}
              onChange={(e) => setFormData({...formData, apellido: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
            <input
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData({...formData, telefono: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Dirección</label>
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => setFormData({...formData, direccion: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Ciudad</label>
            <input
              type="text"
              value={formData.ciudad}
              onChange={(e) => setFormData({...formData, ciudad: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
              required
            />
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              Actualizar Dueño
            </button>
            <button
              type="button"
              onClick={() => router.push('/owners')}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              Cancelar
            </button>
          </div>
        </form>
      </main>
    </div>
  );
} 