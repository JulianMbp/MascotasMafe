import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Header from '../../../app/components/header';

interface Dueño {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
}

interface FormData {
  nombre: string;
  peso: string;
  edad: string;
  especie: string;
  raza: string;
  fecha_nacimiento: string;
  dueño: string;
  imagen: File | null;
}

export default function CrearMascota() {
  const router = useRouter();
  const [dueños, setDueños] = useState<Dueño[]>([]);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    peso: '',
    edad: '',
    especie: '',
    raza: '',
    fecha_nacimiento: '',
    dueño: '',
    imagen: null,
  });

  useEffect(() => {
    const fetchDueños = async () => {
      try {
        console.log('Iniciando petición a dueños...');
        // Verificar que la URL es correcta
        const url = 'http://127.0.0.1:8000/dueño/dueños_list';
        console.log('URL de la petición:', url);

        const response = await axios.get(url, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });

        console.log('Status de la respuesta:', response.status);
        console.log('Datos recibidos:', response.data);
        
        if (response.data && Array.isArray(response.data)) {
          const dueñosFormateados = response.data.map(dueño => ({
            id: dueño.id,
            nombre: dueño.nombre,
            apellido: dueño.apellido,
            telefono: dueño.telefono
          }));
          console.log('Dueños formateados:', dueñosFormateados);
          setDueños(dueñosFormateados);
        } else {
          console.error('La respuesta no tiene el formato esperado:', response.data);
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Error de Axios:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            url: error.config?.url
          });
        }
        console.error('Error al cargar dueños:', error);
        alert('Error al cargar la lista de dueños');
      }
    };

    console.log('Componente montado, iniciando fetchDueños');
    fetchDueños();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = new FormData();
      
      // Agregar todos los campos excepto la imagen
      data.append('nombre', formData.nombre);
      data.append('peso', formData.peso);
      data.append('edad', formData.edad);
      data.append('especie', formData.especie);
      data.append('raza', formData.raza);
      data.append('fecha_nacimiento', formData.fecha_nacimiento);
      data.append('dueño', formData.dueño);

      // Agregar la imagen si existe
      if (formData.imagen) {
        data.append('imagen', formData.imagen, formData.imagen.name);
        console.log('Imagen adjuntada:', formData.imagen.name);
      }

      console.log('Enviando datos al servidor:', {
        ...formData,
        imagen: formData.imagen ? formData.imagen.name : null
      });

      const response = await axios.post('http://127.0.0.1:8000/mascotas/mascotas_create', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Respuesta del servidor:', response.data);
      alert('Mascota creada con éxito');
      router.push('/pets');
    } catch (error) {
      console.error('Error al crear la mascota:', error);
      if (axios.isAxiosError(error)) {
        console.error('Detalles del error:', {
          status: error.response?.status,
          data: error.response?.data
        });
      }
      alert('Error al crear la mascota');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Crear Nueva Mascota</h1>
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
            <label className="block text-sm font-medium text-gray-700">Peso (kg)</label>
            <input
              type="number"
              step="0.01"
              value={formData.peso}
              onChange={(e) => setFormData({...formData, peso: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Edad</label>
            <input
              type="number"
              value={formData.edad}
              onChange={(e) => setFormData({...formData, edad: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Especie</label>
            <input
              type="text"
              value={formData.especie}
              onChange={(e) => setFormData({...formData, especie: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Raza</label>
            <input
              type="text"
              value={formData.raza}
              onChange={(e) => setFormData({...formData, raza: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
            <input
              type="date"
              value={formData.fecha_nacimiento}
              onChange={(e) => setFormData({...formData, fecha_nacimiento: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Seleccionar Dueño</label>
            <select
              value={formData.dueño}
              onChange={(e) => setFormData({...formData, dueño: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
              required
            >
              <option value="">Seleccione un dueño</option>
              {dueños.map((dueño) => (
                <option key={dueño.id} value={dueño.id}>
                  {`${dueño.nombre} ${dueño.apellido} - ID: ${dueño.id}`}
                </option>
              ))}
            </select>
            {dueños.length === 0 && (
              <p className="text-sm text-red-500 mt-1">
                Cargando lista de dueños...
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Imagen</label>
            <input
              type="file"
              onChange={(e) => setFormData({...formData, imagen: e.target.files?.[0] || null})}
              className="mt-1 block w-full p-2"
              accept="image/*"
            />
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              Crear Mascota
            </button>
            <button
              type="button"
              onClick={() => router.push('/pets')}
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