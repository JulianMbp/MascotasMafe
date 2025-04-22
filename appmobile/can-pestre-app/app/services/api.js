import axios from 'axios';
import { clearCacheItem, getCacheData, setCacheData } from './cacheService';

// URL base de la API - Asegúrate de cambiar esto según tu configuración local
const API_URL = 'https://2a1d-161-18-52-113.ngrok-free.app';  // cambiar por url de ngrok

// Creando una instancia de axios con la URL base
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tiempos de expiración para diferentes tipos de datos (en milisegundos)
const CACHE_EXPIRY = {
  MASCOTAS_LIST: 5 * 60 * 1000,        // 5 minutos para listas de mascotas (aumentado)
  MASCOTA_DETAIL: 2 * 60 * 1000,       // 2 minutos para detalles de mascota
  DUEÑOS_LIST: 5 * 60 * 1000,          // 5 minutos para listas de dueños (aumentado)
  DUEÑO_DETAIL: 2 * 60 * 1000,         // 2 minutos para detalles de dueño
  IMAGE_DATA: 30 * 60 * 1000,          // 30 minutos para imágenes (más largo)
};

// Claves de caché para diferentes tipos de datos
const CACHE_KEYS = {
  MASCOTAS_LIST: 'mascotas_list',
  MASCOTA_DETAIL: (id) => `mascota_${id}`,
  DUEÑOS_LIST: 'dueños_list',
  DUEÑO_DETAIL: (id) => `dueño_${id}`,
  IMAGE_DATA: (id) => `img_${id}`,     // Clave para imágenes individuales
};

// Variable para controlar si ya estamos en proceso de obtener datos
let isFetchingMascotas = false;
let isFetchingDueños = false;

/**
 * Función genérica para obtener datos con caché
 * @param {string} cacheKey - Clave para el caché
 * @param {number} expiryTime - Tiempo de expiración para el caché
 * @param {Function} fetchFunction - Función para obtener datos del servidor
 * @param {boolean} forceRefresh - Si es true, ignora la caché y obtiene datos nuevos
 */
const fetchWithCache = async (cacheKey, expiryTime, fetchFunction, forceRefresh = false) => {
  // Si se fuerza el refresco, no usamos la caché
  if (!forceRefresh) {
    try {
      // Intentar obtener datos del caché
      const cachedData = await getCacheData(cacheKey, expiryTime);
      if (cachedData) {
        console.log(`Usando datos en caché para: ${cacheKey}`);

        // Si es la lista de mascotas, cargar las imágenes desde el caché individual
        if (cacheKey === CACHE_KEYS.MASCOTAS_LIST && Array.isArray(cachedData)) {
          const mascotasWithImages = await Promise.all(
            cachedData.map(async (mascota) => {
              if (!mascota.imagen && mascota.id) {
                // Si no tiene imagen en el caché principal, intentar cargarla del caché individual
                const imageCacheKey = CACHE_KEYS.IMAGE_DATA(mascota.id);
                const cachedImage = await getCacheData(imageCacheKey, CACHE_EXPIRY.IMAGE_DATA);
                if (cachedImage) {
                  return { ...mascota, imagen: cachedImage };
                }
              }
              return mascota;
            })
          );
          return mascotasWithImages;
        }
        
        return cachedData;
      }
    } catch (error) {
      console.error(`Error al recuperar datos del caché ${cacheKey}:`, error);
      // Continuamos con la petición al servidor
    }
  }
  
  // Si no hay caché o se fuerza el refresco, obtener datos del servidor
  console.log(`Obteniendo datos frescos para: ${cacheKey}`);
  const freshData = await fetchFunction();
  
  try {
    // Para mascotas_list, guardar metadatos y las imágenes por separado
    if (cacheKey === CACHE_KEYS.MASCOTAS_LIST && Array.isArray(freshData)) {
      // Guardar metadatos sin imágenes en el caché principal
      const metadataOnly = freshData.map(mascota => {
        // Primero guardar cada imagen en su propio caché
        if (mascota.imagen && mascota.id) {
          const imageCacheKey = CACHE_KEYS.IMAGE_DATA(mascota.id);
          setCacheData(imageCacheKey, mascota.imagen, CACHE_EXPIRY.IMAGE_DATA)
            .catch(err => console.error(`Error al guardar imagen en caché para mascota ${mascota.id}:`, err));
          
          // Retornar objeto sin imagen para el caché principal
          return { ...mascota, imagen: null };
        }
        return mascota;
      });
      
      // Guardar versión sin imágenes en caché principal
      await setCacheData(cacheKey, metadataOnly, expiryTime);
      
      // Devolver los datos completos (con imágenes)
      return freshData;
    } else {
      // Para otros tipos de datos, guardar normalmente
      await setCacheData(cacheKey, freshData, expiryTime);
      return freshData;
    }
  } catch (error) {
    console.error(`Error al guardar en caché ${cacheKey}:`, error);
    // Continuamos retornando los datos aunque el caché falle
    return freshData;
  }
};

// Funciones para mascotas
export const fetchMascotas = async (forceRefresh = false) => {
  // Evitamos múltiples peticiones simultáneas
  if (isFetchingMascotas && !forceRefresh) {
    console.log('Ya hay una petición en curso para mascotas, esperando...');
    // Esperar 500ms y reintentar
    return new Promise(resolve => {
      setTimeout(async () => {
        // Intentar obtener de caché
        try {
          const cachedData = await getCacheData(CACHE_KEYS.MASCOTAS_LIST, CACHE_EXPIRY.MASCOTAS_LIST);
          if (cachedData) {
            console.log('Datos recuperados del caché: mascotas_list');
            
            // Cargar imágenes desde caché individual
            const mascotasWithImages = await Promise.all(
              cachedData.map(async (mascota) => {
                if (!mascota.imagen && mascota.id) {
                  const imageCacheKey = CACHE_KEYS.IMAGE_DATA(mascota.id);
                  const cachedImage = await getCacheData(imageCacheKey, CACHE_EXPIRY.IMAGE_DATA);
                  if (cachedImage) {
                    return { ...mascota, imagen: cachedImage };
                  }
                }
                return mascota;
              })
            );
            
            resolve(mascotasWithImages);
            return;
          }
        } catch (error) {
          // Ignorar errores de caché y continuar
        }
        // Si no hay caché, reintentar la petición
        resolve(fetchMascotas(forceRefresh));
      }, 500);
    });
  }
  
  try {
    isFetchingMascotas = true;
    return await fetchWithCache(
      CACHE_KEYS.MASCOTAS_LIST,
      CACHE_EXPIRY.MASCOTAS_LIST,
      async () => {
        const response = await apiClient.get('mascotas/mascotas_list');
        return response.data;
      },
      forceRefresh
    );
  } catch (error) {
    console.error('Error al obtener mascotas:', error);
    throw error;
  } finally {
    isFetchingMascotas = false;
  }
};

export const fetchMascotaById = async (id, forceRefresh = false) => {
  try {
    return await fetchWithCache(
      CACHE_KEYS.MASCOTA_DETAIL(id),
      CACHE_EXPIRY.MASCOTA_DETAIL,
      async () => {
        const response = await apiClient.get(`mascotas/mascotas_id/${id}`);
        return response.data;
      },
      forceRefresh
    );
  } catch (error) {
    console.error(`Error al obtener mascota con ID ${id}:`, error);
    throw error;
  }
};

export const createMascota = async (mascotaData) => {
  try {
    const response = await apiClient.post('mascotas/mascotas_create', mascotaData);
    // Limpiar caché después de crear
    await clearCacheItem(CACHE_KEYS.MASCOTAS_LIST);
    return response.data;
  } catch (error) {
    console.error('Error al crear mascota:', error);
    throw error;
  }
};

export const updateMascota = async (id, mascotaData) => {
  try {
    const response = await apiClient.put(`mascotas/mascotas_update/${id}`, mascotaData);
    // Limpiar caché después de actualizar
    await clearCacheItem(CACHE_KEYS.MASCOTAS_LIST);
    await clearCacheItem(CACHE_KEYS.MASCOTA_DETAIL(id));
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar mascota con ID ${id}:`, error);
    throw error;
  }
};

export const deleteMascota = async (id) => {
  try {
    const response = await apiClient.delete(`mascotas/mascotas_delete/${id}`);
    // Limpiar caché después de eliminar
    await clearCacheItem(CACHE_KEYS.MASCOTAS_LIST);
    await clearCacheItem(CACHE_KEYS.MASCOTA_DETAIL(id));
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar mascota con ID ${id}:`, error);
    throw error;
  }
};

// Funciones para dueños
export const fetchDueños = async (forceRefresh = false) => {
  try {
    return await fetchWithCache(
      CACHE_KEYS.DUEÑOS_LIST,
      CACHE_EXPIRY.DUEÑOS_LIST,
      async () => {
        const response = await apiClient.get('dueño/dueños_list');
        return response.data;
      },
      forceRefresh
    );
  } catch (error) {
    console.error('Error al obtener dueños:', error);
    throw error;
  }
};

export const fetchDueñoById = async (id, forceRefresh = false) => {
  try {
    return await fetchWithCache(
      CACHE_KEYS.DUEÑO_DETAIL(id),
      CACHE_EXPIRY.DUEÑO_DETAIL,
      async () => {
        const response = await apiClient.get(`dueño/dueños_id/${id}`);
        return response.data;
      },
      forceRefresh
    );
  } catch (error) {
    console.error(`Error al obtener dueño con ID ${id}:`, error);
    throw error;
  }
};

export const createDueño = async (dueñoData) => {
  try {
    const response = await apiClient.post('dueño/dueños_create', dueñoData);
    // Limpiar caché después de crear
    await clearCacheItem(CACHE_KEYS.DUEÑOS_LIST);
    return response.data;
  } catch (error) {
    console.error('Error al crear dueño:', error);
    throw error;
  }
};

export const updateDueño = async (id, dueñoData) => {
  try {
    const response = await apiClient.put(`dueño/dueños_update/${id}`, dueñoData);
    // Limpiar caché después de actualizar
    await clearCacheItem(CACHE_KEYS.DUEÑOS_LIST);
    await clearCacheItem(CACHE_KEYS.DUEÑO_DETAIL(id));
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar dueño con ID ${id}:`, error);
    throw error;
  }
};

export const deleteDueño = async (id) => {
  try {
    const response = await apiClient.delete(`dueño/dueños_delete/${id}`);
    // Limpiar caché después de eliminar
    await clearCacheItem(CACHE_KEYS.DUEÑOS_LIST);
    await clearCacheItem(CACHE_KEYS.DUEÑO_DETAIL(id));
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar dueño con ID ${id}:`, error);
    throw error;
  }
};

// Función para enviar la ubicación GPS de la mascota
export const sendPetLocation = async (mascotaId, latitud, longitud) => {
  try {
    console.log(`Enviando ubicación: mascota=${mascotaId}, lat=${latitud}, lon=${longitud}`);
    console.log(`URL de destino: ${API_URL}/location/mobile/`);
    
    // Creamos un FormData para enviar los datos en formato de formulario
    const formData = new FormData();
    formData.append('mascota', mascotaId.toString());
    formData.append('latitud', latitud.toString());  // Nombre correcto según el backend
    formData.append('longitud', longitud.toString()); // Nombre correcto según el backend
    
    console.log('Datos enviados (FormData):', {mascota: mascotaId, latitud: latitud, longitud: longitud});
    
    // Crear una instancia separada para esta petición con headers específicos
    const response = await axios({
      method: 'post',
      url: `${API_URL}/location/mobile/`,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    
    console.log('Respuesta del servidor:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error al enviar ubicación de mascota con ID ${mascotaId}:`, error);
    console.error('Detalles del error:', error.response ? error.response.data : 'Sin detalles');
    throw error;
  }
}; 