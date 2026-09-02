/**
 * Modo demostración.
 *
 * La sesión de este prototipo es simulada: no hay contraseñas reales y cualquier
 * visitante puede actuar como administrador. Eso es aceptable en local, pero no
 * en una URL pública. Con MODO_DEMO=true se bloquean las operaciones que
 * destruyen datos de forma irreversible, para que nadie pueda dejar la
 * demostración inservible desde el enlace compartido.
 *
 * Lo que SIGUE funcionando: navegar, buscar, filtrar, ver fichas, crear y editar
 * categorías, activarlas o desactivarlas, y editar el perfil. Todo eso es
 * recuperable volviendo a cargar los datos semilla.
 *
 * Esto NO sustituye a la autenticación real (RF06), que llega en el Sprint 2.
 */

export const MODO_DEMO = process.env.MODO_DEMO === 'true';

/** Bloquea la ruta cuando el modo demostración está activo. */
export function bloquearEnDemo(quePasaria) {
  return (_req, res, next) => {
    if (!MODO_DEMO) return next();
    return res.status(403).json({
      error: 'Acción no disponible en la demostración pública.',
      detalle:
        `${quePasaria} Como la sesión de este prototipo es simulada, las operaciones ` +
        'irreversibles están deshabilitadas en el enlace público. En local funcionan con normalidad.',
      modoDemo: true,
    });
  };
}
