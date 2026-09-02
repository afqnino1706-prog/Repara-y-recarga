/**
 * Categorías — HU-03 (gestión de categorías, rol Administrador)
 * y alimenta el filtro de HU-04.
 */

import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requiereRol } from '../lib/sesion.js';
import { bloquearEnDemo } from '../lib/demo.js';

export const categoriasRouter = Router();

/**
 * GET /api/categorias — público. Alimenta el filtro por categoría.
 * ?todas=true devuelve también las desactivadas (solo lo usa el panel de administración).
 */
categoriasRouter.get('/', async (req, res, next) => {
  try {
    const incluirInactivas = String(req.query.todas) === 'true';
    const categorias = await prisma.categoria.findMany({
      where: incluirInactivas ? {} : { activa: true },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
      include: { _count: { select: { comercios: true } } },
    });
    res.json(
      categorias.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        descripcion: c.descripcion,
        icono: c.icono,
        activa: c.activa,
        orden: c.orden,
        // El panel muestra cuántos comercios dependen de cada categoría (criterio de HU-03).
        totalComercios: c._count.comercios,
      }))
    );
  } catch (e) {
    next(e);
  }
});

/** POST /api/categorias — crear (solo ADMIN). */
categoriasRouter.post('/', requiereRol('ADMIN'), async (req, res, next) => {
  try {
    const nombre = String(req.body?.nombre ?? '').trim();
    const descripcion = String(req.body?.descripcion ?? '').trim() || null;

    if (!nombre) return res.status(400).json({ error: 'El nombre de la categoría es obligatorio.' });

    // No se permiten dos categorías con el mismo nombre (criterio de HU-03).
    const existente = await prisma.categoria.findFirst({
      where: { nombre: { equals: nombre } },
    });
    if (existente) {
      return res.status(409).json({ error: `Ya existe una categoría llamada "${nombre}".` });
    }

    const maxOrden = await prisma.categoria.aggregate({ _max: { orden: true } });
    const creada = await prisma.categoria.create({
      data: {
        nombre,
        descripcion,
        icono: String(req.body?.icono ?? '').trim() || null,
        orden: (maxOrden._max.orden ?? 0) + 1,
      },
    });
    res.status(201).json(creada);
  } catch (e) {
    next(e);
  }
});

/**
 * PUT /api/categorias/:id — editar una categoría (solo ADMIN).
 *
 * Actualización parcial: solo se modifican los campos presentes en el cuerpo de
 * la petición. Omitir un campo lo deja intacto; enviarlo vacío sí lo borra.
 * Esto evita que una edición que solo cambia el nombre arrase con la descripción.
 */
categoriasRouter.put('/:id', requiereRol('ADMIN'), async (req, res, next) => {
  try {
    const actual = await prisma.categoria.findUnique({ where: { id: req.params.id } });
    if (!actual) return res.status(404).json({ error: 'La categoría no existe.' });

    const cuerpo = req.body ?? {};
    const data = {};

    if (cuerpo.nombre !== undefined) {
      const nombre = String(cuerpo.nombre).trim();
      if (!nombre) {
        return res.status(400).json({ error: 'El nombre de la categoría es obligatorio.' });
      }
      const duplicada = await prisma.categoria.findFirst({
        where: { nombre: { equals: nombre }, NOT: { id: req.params.id } },
      });
      if (duplicada) {
        return res.status(409).json({ error: `Ya existe otra categoría llamada "${nombre}".` });
      }
      data.nombre = nombre;
    }

    if (cuerpo.descripcion !== undefined) {
      data.descripcion = String(cuerpo.descripcion).trim() || null;
    }
    if (cuerpo.icono !== undefined) {
      data.icono = String(cuerpo.icono).trim() || null;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No se envió ningún campo para actualizar.' });
    }

    const actualizada = await prisma.categoria.update({ where: { id: req.params.id }, data });
    res.json(actualizada);
  } catch (e) {
    next(e);
  }
});

/** PATCH /api/categorias/:id/estado — activar o desactivar sin eliminar (criterio de HU-03). */
categoriasRouter.patch('/:id/estado', requiereRol('ADMIN'), async (req, res, next) => {
  try {
    const actual = await prisma.categoria.findUnique({ where: { id: req.params.id } });
    if (!actual) return res.status(404).json({ error: 'La categoría no existe.' });

    const actualizada = await prisma.categoria.update({
      where: { id: req.params.id },
      data: { activa: Boolean(req.body?.activa) },
    });
    res.json(actualizada);
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/categorias/:id
 * No se permite eliminar una categoría con comercios asociados: hay que
 * reasignarlos primero (criterio de HU-03).
 */
categoriasRouter.delete(
  '/:id',
  requiereRol('ADMIN'),
  bloquearEnDemo('Eliminar una categoría borra el registro de forma permanente.'),
  async (req, res, next) => {
  try {
    const categoria = await prisma.categoria.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { comercios: true } } },
    });
    if (!categoria) return res.status(404).json({ error: 'La categoría no existe.' });

    if (categoria._count.comercios > 0) {
      return res.status(409).json({
        error: 'No se puede eliminar una categoría que tiene comercios asociados.',
        detalle: `"${categoria.nombre}" tiene ${categoria._count.comercios} comercio(s). Reasígnalos a otra categoría antes de eliminarla.`,
        totalComercios: categoria._count.comercios,
      });
    }

    await prisma.categoria.delete({ where: { id: req.params.id } });
    res.status(204).end();
    } catch (e) {
      next(e);
    }
  }
);
