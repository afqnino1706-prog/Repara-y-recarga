/**
 * Lógica del filtro "Abierto ahora" (RF04 / HU-07).
 *
 * Criterios que implementa este módulo:
 *  - captura del día de la semana y la hora del momento de la consulta;
 *  - comparación contra la matriz de horarios de cada comercio;
 *  - soporte de horarios partidos (varias franjas el mismo día);
 *  - exclusión de los comercios que no tengan ninguna franja registrada.
 */

/** Convierte "08:30" a minutos desde medianoche. Devuelve null si el formato no es válido. */
export function aMinutos(hhmm) {
  if (typeof hhmm !== 'string') return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/**
 * Indica si una franja cubre el instante dado.
 * Si la hora de cierre es menor o igual que la de apertura, se interpreta que
 * la franja cruza la medianoche (por ejemplo 20:00–02:00).
 */
function franjaCubre(franja, minutosAhora) {
  const abre = aMinutos(franja.horaApertura);
  const cierra = aMinutos(franja.horaCierre);
  if (abre === null || cierra === null) return false;

  if (cierra > abre) return minutosAhora >= abre && minutosAhora < cierra;
  return minutosAhora >= abre || minutosAhora < cierra; // cruza medianoche
}

/**
 * Determina si un comercio está abierto en el instante indicado.
 *
 * @param {Array<{diaSemana:number, horaApertura:string, horaCierre:string}>} horarios
 * @param {Date} ahora
 * @returns {boolean} false también cuando no hay ninguna franja registrada.
 */
export function estaAbierto(horarios, ahora = new Date()) {
  if (!Array.isArray(horarios) || horarios.length === 0) return false;

  const dia = ahora.getDay(); // 0 = domingo … 6 = sábado
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const diaAnterior = (dia + 6) % 7;

  for (const franja of horarios) {
    if (franja.diaSemana === dia && franjaCubre(franja, minutosAhora)) return true;

    // Una franja del día anterior que cruza la medianoche sigue vigente de madrugada.
    if (franja.diaSemana === diaAnterior) {
      const abre = aMinutos(franja.horaApertura);
      const cierra = aMinutos(franja.horaCierre);
      if (abre !== null && cierra !== null && cierra <= abre && minutosAhora < cierra) return true;
    }
  }
  return false;
}

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/** Agrupa las franjas por día para pintar la tabla de horario semanal de la ficha (RF05). */
export function horarioSemanal(horarios) {
  return DIAS.map((nombre, dia) => ({
    dia,
    nombre,
    franjas: (horarios || [])
      .filter((h) => h.diaSemana === dia)
      .sort((a, b) => (aMinutos(a.horaApertura) ?? 0) - (aMinutos(b.horaApertura) ?? 0))
      .map((h) => ({ horaApertura: h.horaApertura, horaCierre: h.horaCierre })),
  }));
}
