import AsyncStorage from '@react-native-async-storage/async-storage';

// Prefijos para las claves del caché
const CACHE_PREFIX = 'api_cache_';
const TIMESTAMP_PREFIX = 'timestamp_';

// Tiempos de expiración por defecto (en milisegundos)
const DEFAULT_EXPIRY_TIME = 2 * 60 * 1000; // 2 minutos

/**
 * Guarda datos en el caché con un timestamp
 * @param {string} key - Clave del caché
 * @param {any} data - Datos a guardar
 * @param {number} expiryTime - Tiempo de expiración en milisegundos (por defecto 10 minutos)
 */
export const setCacheData = async (key, data, expiryTime = DEFAULT_EXPIRY_TIME) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const timestampKey = `${TIMESTAMP_PREFIX}${key}`;
    const now = Date.now();
    
    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    await AsyncStorage.setItem(timestampKey, now.toString());
    
    console.log(`Datos guardados en caché: ${key}`);
    
    // Establecer tiempo de expiración
    setTimeout(() => {
      clearCacheItem(key).catch(err => 
        console.error(`Error al limpiar caché expirado para ${key}:`, err)
      );
    }, expiryTime);
    
    return true;
  } catch (error) {
    console.error(`Error al guardar en caché ${key}:`, error);
    return false;
  }
};

/**
 * Obtiene datos del caché si son válidos (no han expirado)
 * @param {string} key - Clave del caché
 * @param {number} expiryTime - Tiempo de expiración en milisegundos (por defecto 10 minutos)
 * @returns {Promise<any|null>} Datos del caché o null si no existen o han expirado
 */
export const getCacheData = async (key, expiryTime = DEFAULT_EXPIRY_TIME) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const timestampKey = `${TIMESTAMP_PREFIX}${key}`;
    
    const cachedData = await AsyncStorage.getItem(cacheKey);
    const timestamp = await AsyncStorage.getItem(timestampKey);
    
    if (!cachedData || !timestamp) {
      console.log(`No se encontraron datos en caché para ${key}`);
      return null;
    }
    
    const now = Date.now();
    const storedTime = parseInt(timestamp, 10);
    
    // Verificar si los datos han expirado
    if (now - storedTime > expiryTime) {
      console.log(`Datos en caché expirados para ${key}`);
      // Limpiar datos expirados
      await clearCacheItem(key);
      return null;
    }
    
    console.log(`Datos recuperados del caché: ${key}`);
    return JSON.parse(cachedData);
  } catch (error) {
    console.error(`Error al recuperar datos del caché ${key}:`, error);
    return null;
  }
};

/**
 * Limpia un elemento específico del caché
 * @param {string} key - Clave del caché a limpiar
 */
export const clearCacheItem = async (key) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const timestampKey = `${TIMESTAMP_PREFIX}${key}`;
    
    await AsyncStorage.removeItem(cacheKey);
    await AsyncStorage.removeItem(timestampKey);
    
    console.log(`Caché eliminado: ${key}`);
    return true;
  } catch (error) {
    console.error(`Error al limpiar caché ${key}:`, error);
    return false;
  }
};

/**
 * Limpia todo el caché de la API
 */
export const clearAllCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => 
      key.startsWith(CACHE_PREFIX) || key.startsWith(TIMESTAMP_PREFIX)
    );
    
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`Se eliminaron ${cacheKeys.length} elementos del caché`);
    } else {
      console.log('No hay elementos en caché para eliminar');
    }
    
    return true;
  } catch (error) {
    console.error('Error al limpiar todo el caché:', error);
    return false;
  }
}; 