/**
 * Comercios — cubre HU-02 (mapa), HU-04 (filtro por categoría),
 * HU-05 (buscador general), HU-06 (ficha) y HU-07 (abierto ahora).
 */

import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { estaAbierto, horarioSemanal } from '../lib/horarios.js';
import { coincide, distanciaKm } from '../lib/texto.js';

export const comerciosRouter = Router();

/** Calificación promedio y número de reseñas. */
function resumenResenas(resenas) {
  if (!resenas.length) return { calificacionPromedio: null, totalResenas: 0 };
  const suma = resenas.reduce((acc, r) => acc + r.calificacion, 0);
  return {
    calificacionPromedio: Number((suma / resenas.length).toFixed(1)),
    totalResenas: resenas.length,
  };
}

/**
 * GET /api/comercios
 * Parámetros: q, categorias (ids separados por coma), abiertoAhora, lat, lng, orden
 *
 * Solo devuelve comercios en estado APROBADO: los pendientes y rechazados no
 * aparecen ni en el mapa ni en las búsquedas (criterio de HU-02).
 */
comerciosRouter.get('/', async (req, res, next) => {
  try {
    const { q = '', categorias = '', abiertoAhora = 'false', lat, lng, orden = 'distancia' } = req.query;

    const idsCategoria = String(categorias).split(',').map((s) => s.trim()).filter(Boolean);

    const comercios = await prisma.comercio.findMany({
      where: {
        estado: 'APROBADO',
        // Sin categorías seleccionadas se asume "mostrar todas" (criterio de HU-04).
        ...(idsCategoria.length ? { categoriaId: { in: idsCategoria } } : {}),
      },
      include: {
        categoria: true,
        horarios: true,
        servicios: true,
        resenas: { select: { calificacion: true } },
      },
    });

    const ahora = new Date();
    const filtroAbierto = String(abiertoAhora) === 'true';
    const latNum = lat !== undefined ? Number(lat) : null;
    const lngNum = lng !== undefined ? Number(lng) : null;
    const hayUbicacion = Number.isFinite(latNum) && Number.isFinite(lngNum);

    let resultado = comercios
      .map((c) => {
        const abierto = estaAbierto(c.horarios, ahora);
        return {
          id: c.id,
          nombreComercial: c.nombreComercial,
          descripcion: c.descripcion,
          direccion: c.direccion,
          ciudad: c.ciudad,
          lat: c.lat,
          lng: c.lng,
          fotoPortada: c.fotoPortada,
          categoria: { id: c.categoria.id, nombre: c.categoria.nombre, icono: c.categoria.icono },
          servicios: c.servicios.map((s) => s.nombre),
          abiertoAhora: abierto,
          tieneHorarios: c.horarios.length > 0,
          reclamado: Boolean(c.propietarioId),
          ...resumenResenas(c.resenas),
          distanciaKm: hayUbicacion
            ? Number(distanciaKm(latNum, lngNum, c.lat, c.lng).toFixed(2))
            : null,
        };
      })
      // El buscador mira nombre, descripción del servicio y tipo de objeto (criterio de HU-05).
      .filter((c) => coincide(q, c.nombreComercial, c.descripcion, c.categoria.nombre, c.servicios.join(' ')))
      // Los comercios sin horarios registrados se excluyen con el filtro activo (criterio de HU-07).
      .filter((c) => (filtroAbierto ? c.abiertoAhora : true));

    const ordenadores = {
      distancia: (a, b) => (a.distanciaKm ?? Infinity) - (b.distanciaKm ?? Infinity),
      calificacion: (a, b) => (b.calificacionPromedio ?? 0) - (a.calificacionPromedio ?? 0),
      nombre: (a, b) => a.nombreComercial.localeCompare(b.nombreComercial, 'es'),
    };
    resultado.sort(ordenadores[orden] ?? ordenadores.distancia);

    res.json({
      total: resultado.length,
      filtros: {
        q: String(q),
        categorias: idsCategoria,
        abiertoAhora: filtroAbierto,
        orden,
        ubicacionUsuario: hayUbicacion ? { lat: latNum, lng: lngNum } : null,
      },
      comercios: resultado,
    });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/comercios/:id  — ficha completa (HU-06).
 * Lectura pública: no exige sesión.
 */
comerciosRouter.get('/:id', async (req, res, next) => {
  try {
    const c = await prisma.comercio.findUnique({
      where: { id: req.params.id },
      include: {
        categoria: true,
        horarios: true,
        servicios: true,
        propietario: { select: { id: true, nombre: true } },
        resenas: {
          orderBy: { fecha: 'desc' },
          include: { usuario: { select: { id: true, nombre: true, fotoUrl: true } } },
        },
      },
    });

    if (!c || c.estado !== 'APROBADO') {
      return res.status(404).json({ error: 'El comercio no existe o aún no ha sido aprobado.' });
    }

    res.json({
      id: c.id,
      nombreComercial: c.nombreComercial,
      descripcion: c.descripcion,
      categoria: { id: c.categoria.id, nombre: c.categoria.nombre, icono: c.categoria.icono },
      direccion: c.direccion,
      ciudad: c.ciudad,
      lat: c.lat,
      lng: c.lng,
      contacto: { telefono: c.telefono, whatsapp: c.whatsapp, correo: c.correo },
      fotoPortada: c.fotoPortada,
      servicios: c.servicios.map((s) => s.nombre),
      horarioSemanal: horarioSemanal(c.horarios),
      abiertoAhora: estaAbierto(c.horarios),
      tieneHorarios: c.horarios.length > 0,
      // Si el comercio no fue reclamado se oculta el formulario de cotización y
      // se muestran los canales de contacto directo (criterio de HU-06).
      reclamado: Boolean(c.propietarioId),
      propietario: c.propietario,
      ...resumenResenas(c.resenas),
      resenas: c.resenas.map((r) => ({
        id: r.id,
        calificacion: r.calificacion,
        comentario: r.comentario,
        respuestaComercio: r.respuestaComercio,
        fecha: r.fecha,
        usuario: r.usuario,
      })),
    });
  } catch (e) {
    next(e);
  }
});
