/**
 * Normalización de texto para el buscador general (RF03 / HU-05).
 *
 * Criterios que implementa: la búsqueda ignora mayúsculas y minúsculas,
 * ignora tildes y descarta los caracteres especiales.
 */

// Rango Unicode de los diacríticos combinantes que produce la normalización NFD.
// Se escribe escapado para que el archivo siga siendo válido en ASCII puro.
const DIACRITICOS = new RegExp('[\\u0300-\\u036f]', 'g');

/** Pasa a minúsculas, quita diacríticos y reduce los caracteres especiales a espacios. */
export function normalizar(texto) {
  if (texto === null || texto === undefined) return '';
  return String(texto)
    .normalize('NFD')
    .replace(DIACRITICOS, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Indica si alguno de los campos contiene todos los términos de la consulta.
 * Admite coincidencias parciales además de exactas.
 */
export function coincide(consulta, ...campos) {
  const q = normalizar(consulta);
  if (!q) return true;
  const heno = normalizar(campos.filter(Boolean).join(' '));
  return q.split(' ').every((termino) => heno.includes(termino));
}

/** Distancia en kilómetros entre dos coordenadas (fórmula del haversine). */
export function distanciaKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
