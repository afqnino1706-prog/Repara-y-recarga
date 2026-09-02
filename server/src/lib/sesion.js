/**
 * Sesión SIMULADA — decisión de alcance del Sprint 1.
 *
 * La autenticación real (RF06: registro, hash de contraseña, token con expiración,
 * OAuth2) pertenece al Sprint 2. Mientras tanto, el cliente indica con qué usuario
 * quiere actuar mediante la cabecera `x-usuario-simulado`, y este módulo resuelve
 * el usuario correspondiente contra la base de datos.
 *
 * IMPORTANTE: esto NO es un mecanismo de seguridad. Cualquiera puede cambiar la
 * cabecera. Debe reemplazarse íntegramente por RF06 antes de cualquier despliegue.
 */

import { prisma } from './prisma.js';

/** Carga el usuario indicado por la cabecera y lo deja en req.usuario (o null). */
export async function sesionSimulada(req, _res, next) {
  const correo = req.header('x-usuario-simulado');
  req.usuario = null;
  if (correo) {
    try {
      req.usuario = await prisma.usuario.findUnique({
        where: { correo },
        select: { id: true, nombre: true, correo: true, rol: true, ciudad: true, fotoUrl: true },
      });
    } catch {
      req.usuario = null;
    }
  }
  next();
}

/** Exige que haya un usuario en la sesión simulada. */
export function requiereSesion(req, res, next) {
  if (!req.usuario) {
    return res.status(401).json({
      error: 'Se requiere una sesión iniciada.',
      detalle: 'Selecciona un usuario en el conmutador de sesión simulada.',
    });
  }
  next();
}

/** Exige que el usuario de la sesión tenga uno de los roles indicados. */
export function requiereRol(...roles) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: 'Se requiere una sesión iniciada.' });
    }
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({
        error: 'No tienes autorización para esta acción.',
        detalle: `Requiere rol: ${roles.join(' o ')}. Tu rol actual: ${req.usuario.rol}.`,
      });
    }
    next();
  };
}
