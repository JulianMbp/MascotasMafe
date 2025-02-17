import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Header from '../../../../app/components/header';

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

export default function EditarMascota() {
  const router = useRouter();
  const { id } = router.query;
  const [dueños, setDueños] = useState<Dueño[]>([]);
  const [imagenPrevia, setImagenPrevia] = useState<string | null>(null);
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

  // Cargar datos de la mascota
  useEffect(() => {
    const fetchMascota = async () => {
      if (!id) return;
      
      try {
        console.log('Cargando datos de la mascota...');
        const response = await axios.get(`http://127.0.0.1:8000/mascotas/mascotas_update/${id}`);
        const mascota = response.data;
        
        setFormData({
          nombre: mascota.nombre,
          peso: mascota.peso.toString(),
          edad: mascota.edad.toString(),
          especie: mascota.especie,
          raza: mascota.raza,
          fecha_nacimiento: mascota.fecha_nacimiento,
          dueño: mascota.dueño_info.id.toString(),
          imagen: null,
        });

        // Guardar la imagen existente
        if (mascota.imagen) {
          setImagenPrevia(mascota.imagen);
        }
      } catch (error) {
        console.error('Error al cargar la mascota:', error);
        alert('Error al cargar los datos de la mascota');
      }
    };

    fetchMascota();
  }, [id]);

  // Cargar lista de dueños
  useEffect(() => {
    const fetchDueños = async () => {
      try {
        console.log('Iniciando petición a dueños...');
        const url = 'http://127.0.0.1:8000/dueño/dueños_list';
        console.log('URL de la petición:', url);

        const response = await axios.get(url, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });

        if (response.data && Array.isArray(response.data)) {
          const dueñosFormateados = response.data.map(dueño => ({
            id: dueño.id,
            nombre: dueño.nombre,
            apellido: dueño.apellido,
            telefono: dueño.telefono
          }));
          setDueños(dueñosFormateados);
        }
      } catch (error) {
        console.error('Error al cargar dueños:', error);
        alert('Error al cargar la lista de dueños');
      }
    };

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

      // Agregar la imagen solo si se seleccionó una nueva
      if (formData.imagen) {
        data.append('imagen', formData.imagen, formData.imagen.name);
        console.log('Nueva imagen adjuntada:', formData.imagen.name);
      } else if (imagenPrevia) {
        // Si no hay nueva imagen pero existe una previa, enviar la imagen previa
        data.append('imagen_existente', imagenPrevia);
      }

      const response = await axios.put(`http://127.0.0.1:8000/mascotas/mascotas_update/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Respuesta del servidor:', response.data);
      alert('Mascota actualizada con éxito');
      router.push('/pets');
    } catch (error) {
      console.error('Error al actualizar la mascota:', error);
      if (axios.isAxiosError(error)) {
        console.error('Detalles del error:', {
          status: error.response?.status,
          data: error.response?.data
        });
      }
      alert('Error al actualizar la mascota');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Editar Mascota</h1>
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
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Imagen actual</label>
            {imagenPrevia && (
              <div className="mt-2 flex justify-center">
                <img
                  src={`data:image/jpeg;base64,${imagenPrevia}`}
                  alt="Imagen actual"
                  className="w-32 h-32 rounded-full object-cover"
                />
              </div>
            )}
            <label className="block text-sm font-medium text-gray-700 mt-4">
              Nueva Imagen (opcional)
            </label>
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setFormData({...formData, imagen: file});
                  // Crear preview de la nueva imagen
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const base64String = reader.result as string;
                    setImagenPrevia(base64String.split(',')[1]);
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="mt-1 block w-full p-2"
              accept="image/*"
            />
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              Actualizar Mascota
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