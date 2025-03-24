/**
 * Genera un color basado en un string (útil para avatares)
 * @param {string} str - Cadena para generar el color (nombre, id, etc.)
 * @returns {string} - Código de color hexadecimal
 */
export const generateColorFromString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    // Aseguramos que los colores no sean demasiado claros
    const adjustedValue = Math.max(value, 70);
    color += ('00' + adjustedValue.toString(16)).substr(-2);
  }
  return color;
};

/**
 * Paleta de colores predefinidos
 */
export const COLORS = [
  '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#34495e',
  '#16a085', '#27ae60', '#2980b9', '#8e44ad', '#2c3e50',
  '#f1c40f', '#e67e22', '#e74c3c', '#f39c12', '#d35400'
];

/**
 * Genera un color más claro basado en un color existente
 * @param {string} hex - Color hexadecimal
 * @param {number} amount - Cantidad de iluminación (0-1)
 * @returns {string} - Color iluminado
 */
export const lightenColor = (hex, amount = 0.3) => {
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);

  r = Math.min(255, Math.floor(r + (255 - r) * amount));
  g = Math.min(255, Math.floor(g + (255 - g) * amount));
  b = Math.min(255, Math.floor(b + (255 - b) * amount));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}; 