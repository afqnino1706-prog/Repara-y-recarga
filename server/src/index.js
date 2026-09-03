import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { prisma } from './lib/prisma.js';
import { sesionSimulada } from './lib/sesion.js';
import { MODO_DEMO } from './lib/demo.js';
import { comerciosRouter } from './routes/comercios.js';
import { categoriasRouter } from './routes/categorias.js';
import { perfilRouter } from './routes/perfil.js';

const aqui = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(sesionSimulada);

app.get('/api/salud', (_req, res) => res.json({ ok: true, sprint: 1, modoDemo: MODO_DEMO }));

/**
 * GET /api/sesion — usuarios disponibles para la sesión simulada.
 * Reemplazar por RF06 (autenticación real) en el Sprint 2.
 */
app.get('/api/sesion', async (req, res, next) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nombre: true, correo: true, rol: true, ciudad: true, fotoUrl: true },
      orderBy: { rol: 'asc' },
    });
    res.json({ actual: req.usuario, disponibles: usuarios, simulada: true, modoDemo: MODO_DEMO });
  } catch (e) {
    next(e);
  }
});

app.use('/api/comercios', comerciosRouter);
app.use('/api/categorias', categoriasRouter);
app.use('/api/perfil', perfilRouter);

app.use('/api', (req, res) =>
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` })
);

/**
 * En producción el mismo proceso sirve la web ya construida, de modo que la
 * aplicación completa vive en una única URL y no hace falta configurar CORS.
 * En desarrollo esta carpeta no existe: el cliente lo sirve Vite en el 5173.
 */
const WEB = join(aqui, '..', '..', 'client', 'dist');
if (existsSync(WEB)) {
  app.use(express.static(WEB));
  // Cualquier ruta que no sea de la API devuelve el index: el enrutado lo
  // resuelve React Router en el navegador.
  app.get('*', (_req, res) => res.sendFile(join(WEB, 'index.html')));
} else {
  app.get('*', (req, res) =>
    res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` })
  );
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'Error interno del servidor.', detalle: err.message });
});

/**
 * Redes de seguridad del proceso.
 *
 * En el plan gratuito de Neon el cómputo se suspende tras unos minutos de
 * inactividad y las conexiones abiertas de Prisma se cortan. Si ese fallo llega
 * como promesa rechazada sin capturar, Node cierra el proceso, el servicio se
 * reinicia y el enrutador de Render lo retira mientras tanto: exactamente el
 * bucle de caídas que queremos evitar. Registramos el fallo y seguimos vivos;
 * la siguiente consulta reabre la conexión.
 */
process.on('unhandledRejection', (razon) => {
  console.error('[promesa rechazada sin capturar]', razon);
});

process.on('uncaughtException', (error) => {
  console.error('[excepción no capturada]', error);
});

const servidor = app.listen(PORT, () => {
  console.log(`API de Repara y Recarga escuchando en el puerto ${PORT}`);
  console.log('Sesión SIMULADA activa (RF06 pendiente para el Sprint 2).');
  if (MODO_DEMO) console.log('MODO DEMOSTRACIÓN: las operaciones destructivas están bloqueadas.');
  if (existsSync(WEB)) console.log('Sirviendo la web construida desde client/dist.');
});

// Render envía SIGTERM al redesplegar: cerrar ordenadamente evita peticiones cortadas.
for (const senal of ['SIGTERM', 'SIGINT']) {
  process.on(senal, () => {
    console.log(`${senal} recibida: cerrando el servidor…`);
    servidor.close(async () => {
      await prisma.$disconnect().catch(() => {});
      process.exit(0);
    });
  });
}
