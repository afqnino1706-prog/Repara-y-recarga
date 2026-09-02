/**
 * Perfil de usuario — HU-01 (RF16).
 *
 * Las secciones de Favoritos (RF10) e Historial de reparaciones (RF15) no
 * pertenecen al Sprint 1: se exponen con datos reales cuando existen y se
 * declaran explícitamente como pendientes en `disponibleEn`.
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { requiereSesion } from '../lib/sesion.js';
import { bloquearEnDemo } from '../lib/demo.js';

export const perfilRouter = Router();

perfilRouter.use(requiereSesion);

/** GET /api/perfil — vista centralizada de la cuenta. */
perfilRouter.get('/', async (req, res, next) => {
  try {
    const id = req.usuario.id;

    const [usuario, favoritos, resenas, propuestas] = await Promise.all([
      prisma.usuario.findUnique({
        where: { id },
        select: {
          id: true, nombre: true, correo: true, rol: true,
          ciudad: true, fotoUrl: true, fechaRegistro: true,
        },
      }),
      prisma.favorito.findMany({
        where: { usuarioId: id },
        include: { comercio: { select: { id: true, nombreComercial: true, direccion: true } } },
        orderBy: { fechaGuardado: 'desc' },
      }),
      prisma.resena.findMany({
        where: { usuarioId: id },
        include: { comercio: { select: { id: true, nombreComercial: true } } },
        orderBy: { fecha: 'desc' },
      }),
      prisma.comercio.findMany({
        where: { propuestoPorId: id },
        select: { id: true, nombreComercial: true, estado: true, fechaCreacion: true },
        orderBy: { fechaCreacion: 'desc' },
      }),
    ]);

    res.json({
      usuario,
      secciones: {
        favoritos: {
          titulo: 'Favoritos',
          total: favoritos.length,
          disponibleEn: 'Sprint 2 (RF10)',
          items: favoritos.map((f) => ({ ...f.comercio, fechaGuardado: f.fechaGuardado })),
        },
        historial: {
          titulo: 'Historial de reparaciones',
          total: 0,
          disponibleEn: 'Sprint 2 (RF15)',
          items: [],
        },
        resenas: {
          titulo: 'Mis reseñas publicadas',
          total: resenas.length,
          disponibleEn: null,
          items: resenas.map((r) => ({
            id: r.id,
            calificacion: r.calificacion,
            comentario: r.comentario,
            fecha: r.fecha,
            comercio: r.comercio,
          })),
        },
        propuestas: {
          titulo: 'Comercios propuestos',
          total: propuestas.length,
          disponibleEn: null,
          // El estado de cada solicitud es un criterio explícito de HU-01.
          items: propuestas,
        },
      },
    });
  } catch (e) {
    next(e);
  }
});

/** PUT /api/perfil — editar nombre, ciudad y fotografía. */
perfilRouter.put('/', async (req, res, next) => {
  try {
    const nombre = String(req.body?.nombre ?? '').trim();
    if (!nombre) return res.status(400).json({ error: 'El nombre no puede quedar vacío.' });

    const actualizado = await prisma.usuario.update({
      where: { id: req.usuario.id },
      data: {
        nombre,
        ciudad: String(req.body?.ciudad ?? '').trim() || null,
        ...(req.body?.fotoUrl !== undefined
          ? { fotoUrl: String(req.body.fotoUrl).trim() || null }
          : {}),
      },
      select: { id: true, nombre: true, correo: true, rol: true, ciudad: true, fotoUrl: true },
    });
    res.json({ usuario: actualizado, mensaje: 'Los datos del perfil se actualizaron correctamente.' });
  } catch (e) {
    next(e);
  }
});

/**
 * PUT /api/perfil/correo — cambiar el correo.
 * Exige confirmar la contraseña actual (criterio de HU-01).
 */
perfilRouter.put('/correo', async (req, res, next) => {
  try {
    const correo = String(req.body?.correo ?? '').trim().toLowerCase();
    const passwordActual = String(req.body?.passwordActual ?? '');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return res.status(400).json({ error: 'El correo electrónico no tiene un formato válido.' });
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario.id } });
    const ok = await bcrypt.compare(passwordActual, usuario.passwordHash);
    if (!ok) {
      return res.status(400).json({ error: 'La contraseña actual no es correcta.' });
    }

    const enUso = await prisma.usuario.findFirst({
      where: { correo, NOT: { id: req.usuario.id } },
    });
    if (enUso) return res.status(409).json({ error: 'Ese correo ya está registrado por otra cuenta.' });

    const actualizado = await prisma.usuario.update({
      where: { id: req.usuario.id },
      data: { correo },
      select: { id: true, nombre: true, correo: true, rol: true, ciudad: true, fotoUrl: true },
    });
    res.json({ usuario: actualizado, mensaje: 'El correo electrónico se actualizó correctamente.' });
  } catch (e) {
    next(e);
  }
});

/**
 * PUT /api/perfil/password — cambiar la contraseña.
 * Valida la contraseña actual y la política: mínimo 8 caracteres,
 * al menos un número y al menos una mayúscula (criterio de HU-01).
 */
perfilRouter.put('/password', async (req, res, next) => {
  try {
    const passwordActual = String(req.body?.passwordActual ?? '');
    const passwordNueva = String(req.body?.passwordNueva ?? '');

    const errores = [];
    if (passwordNueva.length < 8) errores.push('Debe tener al menos 8 caracteres.');
    if (!/[0-9]/.test(passwordNueva)) errores.push('Debe incluir al menos un número.');
    if (!/[A-ZÁÉÍÓÚÑ]/.test(passwordNueva)) errores.push('Debe incluir al menos una letra mayúscula.');
    if (errores.length) {
      return res.status(400).json({ error: 'La nueva contraseña no cumple la política.', errores });
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario.id } });
    const ok = await bcrypt.compare(passwordActual, usuario.passwordHash);
    if (!ok) return res.status(400).json({ error: 'La contraseña actual no es correcta.' });

    await prisma.usuario.update({
      where: { id: req.usuario.id },
      data: { passwordHash: await bcrypt.hash(passwordNueva, 10) },
    });
    res.json({ mensaje: 'La contraseña se actualizó correctamente.' });
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/perfil — eliminar la cuenta y su información asociada.
 * Exige confirmación explícita (criterio de HU-01).
 */
perfilRouter.delete(
  '/',
  bloquearEnDemo('Eliminar una cuenta borra al usuario y toda su actividad de forma permanente.'),
  async (req, res, next) => {
  try {
    if (req.body?.confirmacion !== 'ELIMINAR') {
      return res.status(400).json({
        error: 'Se requiere confirmación explícita.',
        detalle: 'Envía { "confirmacion": "ELIMINAR" }. Esta acción es irreversible.',
      });
    }

    const id = req.usuario.id;
    await prisma.$transaction([
      prisma.favorito.deleteMany({ where: { usuarioId: id } }),
      prisma.resena.deleteMany({ where: { usuarioId: id } }),
      prisma.comercio.updateMany({ where: { propuestoPorId: id }, data: { propuestoPorId: null } }),
      prisma.comercio.updateMany({ where: { propietarioId: id }, data: { propietarioId: null } }),
      prisma.usuario.delete({ where: { id } }),
    ]);

    res.json({ mensaje: 'La cuenta y su información asociada fueron eliminadas.' });
    } catch (e) {
      next(e);
    }
  }
);
