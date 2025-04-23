import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// URL base de la API - Asegúrate de cambiar esto según tu configuración local
export const API_URL = 'https://1381-161-18-52-113.ngrok-free.app';  // cambiar por url de ngrok

// Creando una instancia de axios con la URL base
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Claves para los datos en AsyncStorage
const STORAGE_KEYS = {
  MASCOTAS_LIST: 'mascotas_list',
  MASCOTA_DETAIL: (id) => `mascota_${id}`,
  DUEÑOS_LIST: 'dueños_list',
  DUEÑO_DETAIL: (id) => `dueño_${id}`,
  LAST_FETCH_TIME: (key) => `last_fetch_${key}`,
};

// Tiempo mínimo entre solicitudes a la API (en milisegundos)
const MIN_FETCH_INTERVAL = {
  MASCOTAS_LIST: 30 * 1000,        // 30 segundos para listas de mascotas
  MASCOTA_DETAIL: 60 * 1000,       // 1 minuto para detalles de mascota
  DUEÑOS_LIST: 30 * 1000,          // 30 segundos para listas de dueños
  DUEÑO_DETAIL: 60 * 1000,         // 1 minuto para detalles de dueño
};

// Variables para controlar solicitudes simultáneas
let isFetchingMascotas = false;
let isFetchingDueños = false;

/**
 * Verifica si se puede hacer una nueva solicitud a la API
 * @param {string} key - Clave para el registro de tiempo
 * @param {number} minInterval - Intervalo mínimo entre solicitudes
 * @returns {Promise<boolean>} - true si se puede hacer una nueva solicitud
 */
const canFetchNewData = async (key, minInterval) => {
  try {
    const lastFetchTimeKey = STORAGE_KEYS.LAST_FETCH_TIME(key);
    const lastFetchTime = await AsyncStorage.getItem(lastFetchTimeKey);
    
    if (!lastFetchTime) return true;
    
    const now = Date.now();
    const timeSinceLastFetch = now - parseInt(lastFetchTime, 10);
    
    return timeSinceLastFetch > minInterval;
  } catch (error) {
    console.error(`Error al verificar tiempo de última solicitud para ${key}:`, error);
    return true; // En caso de error, permitimos hacer la solicitud
  }
};

/**
 * Registra el tiempo de la última solicitud a la API
 * @param {string} key - Clave para el registro de tiempo
 */
const updateLastFetchTime = async (key) => {
  try {
    const lastFetchTimeKey = STORAGE_KEYS.LAST_FETCH_TIME(key);
    await AsyncStorage.setItem(lastFetchTimeKey, Date.now().toString());
  } catch (error) {
    console.error(`Error al actualizar tiempo de última solicitud para ${key}:`, error);
  }
};

/**
 * Función para obtener datos con control de solicitudes repetidas
 * @param {string} storageKey - Clave para AsyncStorage
 * @param {string} fetchTimeKey - Clave para el registro de tiempo
 * @param {number} minInterval - Intervalo mínimo entre solicitudes
 * @param {Function} fetchFunction - Función para obtener datos del servidor
 * @param {boolean} forceRefresh - Si es true, ignora el intervalo y obtiene datos nuevos
 */
const fetchWithThrottle = async (storageKey, fetchTimeKey, minInterval, fetchFunction, forceRefresh = false) => {
  // Intentar obtener datos de AsyncStorage
  try {
    const storedData = await AsyncStorage.getItem(storageKey);
    
    // Si tenemos datos almacenados y no se fuerza actualización, verificamos si se puede hacer una nueva solicitud
    if (storedData && !forceRefresh) {
      const parsedData = JSON.parse(storedData);
      const shouldFetch = await canFetchNewData(fetchTimeKey, minInterval);
      
      // Si no ha pasado suficiente tiempo desde la última solicitud, devolver datos almacenados
      if (!shouldFetch) {
        console.log(`Usando datos almacenados para: ${storageKey}`);
        return parsedData;
      }
    }
  } catch (error) {
    console.error(`Error al recuperar datos de AsyncStorage para ${storageKey}:`, error);
    // Continuamos con la solicitud al servidor
  }
  
  // Obtener datos frescos del servidor
  console.log(`Obteniendo datos frescos para: ${storageKey}`);
  const freshData = await fetchFunction();
  
  // Guardar en AsyncStorage
  try {
    await AsyncStorage.setItem(storageKey, JSON.stringify(freshData));
    await updateLastFetchTime(fetchTimeKey);
  } catch (error) {
    console.error(`Error al guardar datos en AsyncStorage para ${storageKey}:`, error);
  }
  
  return freshData;
};

// Funciones para mascotas
export const fetchMascotas = async (forceRefresh = false) => {
  // Evitar múltiples solicitudes simultáneas
  if (isFetchingMascotas && !forceRefresh) {
    console.log('Ya hay una solicitud en curso para mascotas, esperando...');
    
    // Intentar obtener datos almacenados mientras esperamos
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEYS.MASCOTAS_LIST);
      if (storedData) {
        return JSON.parse(storedData);
      }
    } catch (error) {
      // Ignorar errores y continuar
    }
    
    // Esperar un momento y reintentar
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(fetchMascotas(forceRefresh));
      }, 500);
    });
  }
  
  try {
    isFetchingMascotas = true;
    return await fetchWithThrottle(
      STORAGE_KEYS.MASCOTAS_LIST,
      'mascotas_list',
      MIN_FETCH_INTERVAL.MASCOTAS_LIST,
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
    return await fetchWithThrottle(
      STORAGE_KEYS.MASCOTA_DETAIL(id),
      `mascota_${id}`,
      MIN_FETCH_INTERVAL.MASCOTA_DETAIL,
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
    // Limpiar datos almacenados
    await AsyncStorage.removeItem(STORAGE_KEYS.MASCOTAS_LIST);
    return response.data;
  } catch (error) {
    console.error('Error al crear mascota:', error);
    throw error;
  }
};

export const updateMascota = async (id, mascotaData) => {
  try {
    const response = await apiClient.put(`mascotas/mascotas_update/${id}`, mascotaData);
    // Limpiar datos almacenados
    await AsyncStorage.removeItem(STORAGE_KEYS.MASCOTAS_LIST);
    await AsyncStorage.removeItem(STORAGE_KEYS.MASCOTA_DETAIL(id));
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar mascota con ID ${id}:`, error);
    throw error;
  }
};

export const deleteMascota = async (id) => {
  try {
    const response = await apiClient.delete(`mascotas/mascotas_delete/${id}`);
    // Limpiar datos almacenados
    await AsyncStorage.removeItem(STORAGE_KEYS.MASCOTAS_LIST);
    await AsyncStorage.removeItem(STORAGE_KEYS.MASCOTA_DETAIL(id));
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar mascota con ID ${id}:`, error);
    throw error;
  }
};

// Funciones para dueños
export const fetchDueños = async (forceRefresh = false) => {
  // Evitar múltiples solicitudes simultáneas
  if (isFetchingDueños && !forceRefresh) {
    console.log('Ya hay una solicitud en curso para dueños, esperando...');
    
    // Intentar obtener datos almacenados mientras esperamos
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEYS.DUEÑOS_LIST);
      if (storedData) {
        return JSON.parse(storedData);
      }
    } catch (error) {
      // Ignorar errores y continuar
    }
    
    // Esperar un momento y reintentar
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(fetchDueños(forceRefresh));
      }, 500);
    });
  }
  
  try {
    isFetchingDueños = true;
    return await fetchWithThrottle(
      STORAGE_KEYS.DUEÑOS_LIST,
      'dueños_list',
      MIN_FETCH_INTERVAL.DUEÑOS_LIST,
      async () => {
        const response = await apiClient.get('dueño/dueños_list');
        return response.data;
      },
      forceRefresh
    );
  } catch (error) {
    console.error('Error al obtener dueños:', error);
    throw error;
  } finally {
    isFetchingDueños = false;
  }
};

export const fetchDueñoById = async (id, forceRefresh = false) => {
  try {
    return await fetchWithThrottle(
      STORAGE_KEYS.DUEÑO_DETAIL(id),
      `dueño_${id}`,
      MIN_FETCH_INTERVAL.DUEÑO_DETAIL,
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
    // Limpiar datos almacenados
    await AsyncStorage.removeItem(STORAGE_KEYS.DUEÑOS_LIST);
    return response.data;
  } catch (error) {
    console.error('Error al crear dueño:', error);
    throw error;
  }
};

export const updateDueño = async (id, dueñoData) => {
  try {
    const response = await apiClient.put(`dueño/dueños_update/${id}`, dueñoData);
    // Limpiar datos almacenados
    await AsyncStorage.removeItem(STORAGE_KEYS.DUEÑOS_LIST);
    await AsyncStorage.removeItem(STORAGE_KEYS.DUEÑO_DETAIL(id));
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar dueño con ID ${id}:`, error);
    throw error;
  }
};

export const deleteDueño = async (id) => {
  try {
    const response = await apiClient.delete(`dueño/dueños_delete/${id}`);
    // Limpiar datos almacenados
    await AsyncStorage.removeItem(STORAGE_KEYS.DUEÑOS_LIST);
    await AsyncStorage.removeItem(STORAGE_KEYS.DUEÑO_DETAIL(id));
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar dueño con ID ${id}:`, error);
    throw error;
  }
};

// Función para limpiar todos los datos almacenados
export const clearAllStoredData = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const apiDataKeys = keys.filter(key => 
      Object.values(STORAGE_KEYS).some(pattern => 
        typeof pattern === 'function' 
          ? key.startsWith(pattern('').split('_')[0])
          : key.startsWith(pattern)
      )
    );
    
    if (apiDataKeys.length > 0) {
      await AsyncStorage.multiRemove(apiDataKeys);
      console.log(`Se eliminaron ${apiDataKeys.length} elementos almacenados`);
    }
    
    return true;
  } catch (error) {
    console.error('Error al limpiar datos almacenados:', error);
    return false;
  }
};

export const sendPetLocation = async (mascotaId, latitud, longitud) => {
  try {
    // Imprimir para depuración los valores exactos recibidos
    console.log('Valores recibidos en sendPetLocation:');
    console.log('mascotaId:', mascotaId, 'tipo:', typeof mascotaId);
    console.log('latitud:', latitud, 'tipo:', typeof latitud);
    console.log('longitud:', longitud, 'tipo:', typeof longitud);
    
    // Asegurarnos de que los valores sean del tipo correcto
    const idMascota = Number(mascotaId); // Convertir explícitamente a número
    
    // Crear el objeto con los datos en el formato exacto que espera el backend
    const locationData = {
      mascota: idMascota,           // ID como número
      latitud: parseFloat(latitud),  // Latitud como número decimal
      longitud: parseFloat(longitud) // Longitud como número decimal
    };
    
    // Mostrar los datos exactos que se enviarán
    console.log('Datos que se enviarán al backend:', JSON.stringify(locationData));
    
    // Hacer la petición POST con la URL correcta
    const response = await fetch(`${API_URL}/location/mobile/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(locationData)
    });
    
    // Obtener el texto de la respuesta para depuración
    const responseText = await response.text();
    console.log('Respuesta del servidor (texto):', responseText);
    
    // Si la respuesta no es exitosa, lanzar un error
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${responseText}`);
    }
    
    // Parsear la respuesta si es JSON
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Respuesta del servidor (parseada):', data);
    } catch (e) {
      console.log('La respuesta no es JSON válido');
      return { success: true, message: responseText };
    }
    
    return data;
  } catch (error) {
    console.error('Error al enviar ubicación de mascota:', error.message);
    throw error;
  }
}; 