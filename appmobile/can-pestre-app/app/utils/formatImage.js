/**
 * Formatea correctamente una imagen base64 para mostrarla en componentes de React Native
 * @param {string|null} imagenData - La cadena base64 de la imagen
 * @returns {string|null} - La URL con formato para usar en componentes Image
 */
export const formatearImagen = (imagenData) => {
  if (!imagenData) return null;
  
  // Si es un objeto undefined o null, retornar null
  if (typeof imagenData !== 'string') return null;
  
  // Verificar si la cadena ya contiene el prefijo data:image
  if (imagenData.startsWith('data:image')) {
    return imagenData;
  }
  
  // Si no tiene el prefijo, añadirlo
  return `data:image/jpeg;base64,${imagenData}`;
};

/**
 * Valida si una cadena base64 es correcta para mostrar como imagen
 * @param {string|null} imagenData - La cadena base64 a validar
 * @returns {boolean} - true si es válida, false si no
 */
export const isValidImageData = (imagenData) => {
  if (!imagenData) return false;
  if (typeof imagenData !== 'string') return false;
  
  // Comprobar si es una cadena base64 válida
  // Debe tener un mínimo de caracteres para ser una imagen válida
  return imagenData.length > 100;
}; 