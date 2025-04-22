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
  MASCOTAS_LIST: 2 * 60 * 1000,        // 2 minutos para listas de mascotas
  MASCOTA_DETAIL: 2 * 60 * 1000,       // 2 minutos para detalles de mascota
  DUEÑOS_LIST: 2 * 60 * 1000,          // 2 minutos para listas de dueños
  DUEÑO_DETAIL: 2 * 60 * 1000,         // 2 minutos para detalles de dueño
};

// Claves de caché para diferentes tipos de datos
const CACHE_KEYS = {
  MASCOTAS_LIST: 'mascotas_list',
  MASCOTA_DETAIL: (id) => `mascota_${id}`,
  DUEÑOS_LIST: 'dueños_list',
  DUEÑO_DETAIL: (id) => `dueño_${id}`,
};

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
    // Intentar obtener datos del caché
    const cachedData = await getCacheData(cacheKey, expiryTime);
    if (cachedData) {
      console.log(`Usando datos en caché para: ${cacheKey}`);
      return cachedData;
    }
  }
  
  // Si no hay caché o se fuerza el refresco, obtener datos del servidor
  console.log(`Obteniendo datos frescos para: ${cacheKey}`);
  const freshData = await fetchFunction();
  
  // Guardar los nuevos datos en caché
  await setCacheData(cacheKey, freshData, expiryTime);
  return freshData;
};

// Funciones para mascotas
export const fetchMascotas = async (forceRefresh = false) => {
  try {
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
    
    const response = await apiClient.post('/location/mobile/', {
      latitude: latitud,
      longitude: longitud,
      mascota: mascotaId
    });
    
    console.log('Respuesta del servidor:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error al enviar ubicación de mascota con ID ${mascotaId}:`, error);
    console.error('Detalles del error:', error.response ? error.response.data : 'Sin detalles');
    throw error;
  }
}; 