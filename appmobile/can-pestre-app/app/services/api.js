import axios from 'axios';

// URL base de la API - Configurable
export let API_URL = 'https://bc0e-190-242-58-130.ngrok-free.app';  // URL predeterminada

// Variables en memoria para cacheo y control
const apiCache = new Map();
const lastFetchTimes = new Map();
let isFetchingMascotas = false;
let isFetchingDueños = false;

// Tiempo mínimo entre solicitudes a la API (en milisegundos)
const MIN_FETCH_INTERVAL = {
  MASCOTAS_LIST: 30 * 1000,        // 30 segundos para listas de mascotas
  MASCOTA_DETAIL: 60 * 1000,       // 1 minuto para detalles de mascota
  DUEÑOS_LIST: 30 * 1000,          // 30 segundos para listas de dueños
  DUEÑO_DETAIL: 60 * 1000,         // 1 minuto para detalles de dueño
};

// Creando una instancia de axios con la URL base y configuraciones optimizadas
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000, // Aumentado de 8000 a 15000 ms (15 segundos) para dar más tiempo al servidor
  timeoutErrorMessage: 'La solicitud ha tardado demasiado tiempo. Comprueba tu conexión.',
  validateStatus: status => status >= 200 && status < 500, // Solo rechazar errores de red, no de API
  maxRedirects: 2, // Limitar redirecciones para mejorar rendimiento
  transitional: { 
    silentJSONParsing: true,
    forcedJSONParsing: true 
  }
});

// Función para cambiar la URL de la API
export const setApiUrl = (newUrl) => {
  if (!newUrl || !newUrl.startsWith('http')) {
    console.error('URL inválida, debe comenzar con http:// o https://');
    return false;
  }
  
  // Actualizar variable global
  API_URL = newUrl;
  
  // Actualizar la configuración de axios
  apiClient.defaults.baseURL = newUrl;
  
  console.log('URL de API actualizada a:', API_URL);
  return true;
};

/**
 * Verifica si se puede hacer una nueva solicitud a la API
 * @param {string} key - Clave para el registro de tiempo
 * @param {number} minInterval - Intervalo mínimo entre solicitudes
 */
const canFetchNewData = (key, minInterval) => {
  const lastFetchTime = lastFetchTimes.get(key);
  if (!lastFetchTime) return true;
  
  return (Date.now() - lastFetchTime) > minInterval;
};

/**
 * Función optimizada para obtener datos con control de solicitudes repetidas
 */
const fetchWithThrottle = async (cacheKey, timeKey, minInterval, fetchFunction, forceRefresh = false, retryCount = 0) => {
  // Usar caché si es válida y no se fuerza refresco
  if (!forceRefresh && apiCache.has(cacheKey)) {
    if (!canFetchNewData(timeKey, minInterval)) {
      return apiCache.get(cacheKey);
    }
  }
  
  try {
    const freshData = await fetchFunction();
    apiCache.set(cacheKey, freshData);
    lastFetchTimes.set(timeKey, Date.now());
    return freshData;
  } catch (error) {
    // Si es un error de timeout o conexión y aún podemos reintentar (máx 2 veces)
    if ((error.code === 'ECONNABORTED' || error.message.includes('timeout') || 
         error.message.includes('network')) && retryCount < 2) {
      console.log(`Reintentando solicitud (${retryCount + 1}/2)...`);
      return new Promise(resolve => 
        setTimeout(() => resolve(
          fetchWithThrottle(cacheKey, timeKey, minInterval, fetchFunction, forceRefresh, retryCount + 1)
        ), 1000 * (retryCount + 1)) // Espera progresiva: 1s, 2s
      );
    }
    
    // Usar caché como fallback si existe
    if (apiCache.has(cacheKey)) {
      console.log('Usando datos en caché como respaldo tras error:', error.message);
      return apiCache.get(cacheKey);
    }
    throw error;
  }
};

// Funciones para mascotas
export const fetchMascotas = async (forceRefresh = false) => {
  // Evitar múltiples solicitudes simultáneas
  if (isFetchingMascotas && !forceRefresh) {
    return apiCache.has('mascotas_list') 
      ? apiCache.get('mascotas_list') 
      : new Promise(resolve => setTimeout(() => resolve(fetchMascotas(forceRefresh)), 300));
  }
  
  try {
    isFetchingMascotas = true;
    return await fetchWithThrottle(
      'mascotas_list',
      'mascotas_list_time',
      MIN_FETCH_INTERVAL.MASCOTAS_LIST,
      async () => {
        const response = await apiClient.get('mascotas/mascotas_list');
        return response.data;
      },
      forceRefresh
    );
  } catch (error) {
    console.error('Error al obtener mascotas:', error);
    return []; // Retornar arreglo vacío para evitar errores en UI
  } finally {
    isFetchingMascotas = false;
  }
};

export const fetchMascotaById = async (id, forceRefresh = false) => {
  if (!id) return null;
  
  try {
    return await fetchWithThrottle(
      `mascota_${id}`,
      `mascota_${id}_time`,
      MIN_FETCH_INTERVAL.MASCOTA_DETAIL,
      async () => {
        const response = await apiClient.get(`mascotas/mascotas_id/${id}`);
        return response.data;
      },
      forceRefresh
    );
  } catch (error) {
    console.error(`Error al obtener mascota con ID ${id}:`, error);
    return null; // Retornar null para manejar en UI
  }
};

export const createMascota = async (mascotaData) => {
  try {
    const response = await apiClient.post('mascotas/mascotas_create', mascotaData);
    apiCache.delete('mascotas_list');
    return response.data;
  } catch (error) {
    console.error('Error al crear mascota:', error);
    throw error;
  }
};

export const updateMascota = async (id, mascotaData) => {
  try {
    const response = await apiClient.put(`mascotas/mascotas_update/${id}`, mascotaData);
    // Limpiar caché relacionada
    apiCache.delete('mascotas_list');
    apiCache.delete(`mascota_${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar mascota con ID ${id}:`, error);
    throw error;
  }
};

export const deleteMascota = async (id) => {
  try {
    const response = await apiClient.delete(`mascotas/mascotas_delete/${id}`);
    // Limpiar caché relacionada
    apiCache.delete('mascotas_list');
    apiCache.delete(`mascota_${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar mascota con ID ${id}:`, error);
    throw error;
  }
};

// Funciones para dueños - CORREGIDO: dueño en lugar de dueños
export const fetchDueños = async (forceRefresh = false) => {
  // Evitar múltiples solicitudes simultáneas
  if (isFetchingDueños && !forceRefresh) {
    return apiCache.has('dueños_list') 
      ? apiCache.get('dueños_list') 
      : new Promise(resolve => setTimeout(() => resolve(fetchDueños(forceRefresh)), 300));
  }
  
  try {
    isFetchingDueños = true;
    return await fetchWithThrottle(
      'dueños_list',
      'dueños_list_time',
      MIN_FETCH_INTERVAL.DUEÑOS_LIST,
      async () => {
        console.log('Realizando solicitud de dueños al servidor...');
        // CORREGIDO: URL corregida a dueño/dueños_list
        const response = await apiClient.get('dueño/dueños_list', {
          timeout: 20000 // Timeout específico más largo para esta petición (20 segundos)
        });
        console.log('Respuesta de dueños recibida con éxito');
        return response.data;
      },
      forceRefresh
    );
  } catch (error) {
    console.error('Error al obtener dueños:', error);
    // Intento de diagnóstico
    if (error.code === 'ECONNABORTED') {
      console.error('→ Error por timeout, el servidor tardó demasiado en responder');
    } else if (error.message.includes('Network Error')) {
      console.error('→ Error de red, verifica la conectividad o el estado del servidor');
    }
    return []; // Retornar arreglo vacío para evitar errores en UI
  } finally {
    isFetchingDueños = false;
  }
};

export const fetchDueñoById = async (id, forceRefresh = false) => {
  if (!id) return null;
  
  try {
    return await fetchWithThrottle(
      `dueño_${id}`,
      `dueño_${id}_time`,
      MIN_FETCH_INTERVAL.DUEÑO_DETAIL,
      async () => {
        // CORREGIDO: URL corregida a dueño/dueños_id
        const response = await apiClient.get(`dueño/dueños_id/${id}`, {
          timeout: 15000 // Timeout específico para detalles (15 segundos)
        });
        return response.data;
      },
      forceRefresh
    );
  } catch (error) {
    console.error(`Error al obtener dueño con ID ${id}:`, error);
    return null; // Retornar null para manejar en UI
  }
};

export const createDueño = async (dueñoData) => {
  try {
    // CORREGIDO: URL corregida a dueño/dueños_create
    const response = await apiClient.post('dueño/dueños_create', dueñoData, {
      timeout: 20000 // Timeout más largo para creación (20 segundos)
    });
    apiCache.delete('dueños_list'); // Invalidar caché
    return response.data;
  } catch (error) {
    console.error('Error al crear dueño:', error);
    throw error;
  }
};

export const updateDueño = async (id, dueñoData) => {
  try {
    // CORREGIDO: URL corregida a dueño/dueños_update
    const response = await apiClient.put(`dueño/dueños_update/${id}`, dueñoData, {
      timeout: 20000 // Timeout más largo para actualización (20 segundos)
    });
    // Limpiar caché relacionada
    apiCache.delete('dueños_list');
    apiCache.delete(`dueño_${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar dueño con ID ${id}:`, error);
    throw error;
  }
};

export const deleteDueño = async (id) => {
  try {
    // CORREGIDO: URL corregida a dueño/dueños_delete
    const response = await apiClient.delete(`dueño/dueños_delete/${id}`, {
      timeout: 15000 // Timeout específico para eliminación (15 segundos)
    });
    // Limpiar caché relacionada
    apiCache.delete('dueños_list');
    apiCache.delete(`dueño_${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar dueño con ID ${id}:`, error);
    throw error;
  }
};

// Función para limpiar toda la caché
export const clearAllCachedData = () => {
  apiCache.clear();
  lastFetchTimes.clear();
};

// Ubicación de mascotas - Solo lectura, ya no se envía ubicación desde el celular
/**
 * Obtiene las ubicaciones de una mascota por su ID
 * @param {number} mascotaId - ID de la mascota
 * @param {number} minutos - Limitar a ubicaciones de los últimos X minutos (opcional)
 * @param {boolean} forceRefresh - Forzar actualización ignorando caché
 * @returns {Promise<Array>} - Lista de ubicaciones
 */
export const getPetLocations = async (mascotaId, minutos = 30, forceRefresh = false) => {
  try {
    return await fetchWithThrottle(
      `pet_locations_${mascotaId}`,
      `pet_locations_time_${mascotaId}`,
      60 * 1000, // Refresco máximo cada 1 minuto
      async () => {
        console.log(`Obteniendo ubicaciones para mascota ID: ${mascotaId}`);
        const response = await apiClient.get(`location/${mascotaId}/`, {
          params: { minutos },
          timeout: 10000 // 10 segundos de timeout
        });
        
        return response.data || [];
      },
      forceRefresh
    );
  } catch (error) {
    console.error(`Error al obtener ubicaciones de mascota ID ${mascotaId}:`, error);
    return []; // Retornar array vacío en caso de error
  }
}; 