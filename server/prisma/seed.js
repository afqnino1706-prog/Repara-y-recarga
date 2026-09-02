/**
 * Datos semilla — Sprint 1.
 *
 * Los comercios son ficticios; las coordenadas corresponden a barrios reales de
 * Bogotá para que el mapa se vea creíble. El conjunto está construido a propósito
 * para poder probar los criterios de aceptación:
 *   - comercios sin horarios registrados (se excluyen con "Abierto ahora");
 *   - horarios partidos (mañana y tarde el mismo día);
 *   - un taller nocturno que cruza la medianoche;
 *   - comercios en estado PENDIENTE y RECHAZADO (no deben aparecer en el mapa);
 *   - comercios reclamados por su propietario y comercios sin reclamar.
 */

import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma.js';

const L_V = [1, 2, 3, 4, 5];
const L_S = [1, 2, 3, 4, 5, 6];

/** Genera franjas horarias para los días indicados. */
const franjas = (dias, ...rangos) =>
  dias.flatMap((diaSemana) =>
    rangos.map(([horaApertura, horaCierre]) => ({ diaSemana, horaApertura, horaCierre }))
  );

const CATEGORIAS = [
  { nombre: 'Electrodomésticos', icono: '🔌', descripcion: 'Lavadoras, neveras, licuadoras, microondas y línea blanca.' },
  { nombre: 'Ropa y textiles', icono: '🧵', descripcion: 'Sastrería, arreglos, cremalleras y confección.' },
  { nombre: 'Muebles y madera', icono: '🪑', descripcion: 'Restauración, tapizado y ebanistería.' },
  { nombre: 'Electrónica', icono: '📱', descripcion: 'Celulares, computadores, televisores y consolas.' },
  { nombre: 'Calzado y marroquinería', icono: '👟', descripcion: 'Zapatería, suelas, bolsos y artículos de cuero.' },
  { nombre: 'Bicicletas', icono: '🚲', descripcion: 'Mantenimiento, frenos, transmisión y ruedas.' },
];

const USUARIOS = [
  { nombre: 'Laura Restrepo', correo: 'laura@correo.com', rol: 'USUARIO', ciudad: 'Bogotá', password: 'Laura2026' },
  { nombre: 'Ernesto Vargas', correo: 'ernesto@correo.com', rol: 'PROPIETARIO', ciudad: 'Bogotá', password: 'Ernesto2026' },
  { nombre: 'Camila Ordóñez', correo: 'camila@correo.com', rol: 'ADMIN', ciudad: 'Bogotá', password: 'Camila2026' },
  { nombre: 'Juan Pablo Ríos', correo: 'juan@correo.com', rol: 'USUARIO', ciudad: 'Bogotá', password: 'JuanP2026' },
];

const COMERCIOS = [
  {
    nombre: 'TecnoRepara Andrés', cat: 'Electrodomésticos', dir: 'Cra 45 #12-30, Chapinero',
    lat: 4.6486, lng: -74.0628, tel: '3001234567', wa: '573001234567', mail: 'contacto@tecnorepara.co',
    desc: 'Taller familiar con veinte años de experiencia en línea blanca y pequeños electrodomésticos.',
    servicios: ['Lavadoras', 'Neveras', 'Licuadoras', 'Microondas', 'Secadoras'],
    horarios: [...franjas(L_V, ['08:00', '12:30'], ['14:00', '18:00']), ...franjas([6], ['08:00', '13:00'])],
    propietario: 'ernesto@correo.com', estado: 'APROBADO',
  },
  {
    nombre: 'ElectroFix Sur', cat: 'Electrodomésticos', dir: 'Cl 38 Sur #24-11, Kennedy',
    lat: 4.6280, lng: -74.1490, tel: '3019876543', wa: '573019876543', mail: null,
    desc: 'Servicio a domicilio de refrigeración y lavado para el sur de la ciudad.',
    servicios: ['Neveras', 'Congeladores', 'Aires acondicionados', 'Lavadoras'],
    horarios: franjas(L_S, ['07:30', '17:30']), estado: 'APROBADO',
  },
  {
    nombre: 'Servicio Blanco Bogotá', cat: 'Electrodomésticos', dir: 'Av Suba #104-25, Suba',
    lat: 4.7420, lng: -74.0840, tel: '3145550011', wa: '573145550011', mail: 'servicioblanco@correo.co',
    desc: 'Especialistas en estufas, hornos y campanas extractoras.',
    servicios: ['Estufas', 'Hornos', 'Campanas extractoras'],
    horarios: franjas(L_V, ['09:00', '18:00']), estado: 'APROBADO',
  },
  {
    nombre: 'Sastrería La Puntada', cat: 'Ropa y textiles', dir: 'Cl 57 #9-40, Chapinero',
    lat: 4.6395, lng: -74.0645, tel: '3102223344', wa: '573102223344', mail: null,
    desc: 'Arreglos de prendas, cambio de cremalleras y confección a medida.',
    servicios: ['Arreglos de prendas', 'Cremalleras', 'Dobladillos', 'Confección a medida'],
    horarios: [...franjas(L_V, ['08:00', '13:00'], ['14:30', '19:00']), ...franjas([6], ['09:00', '15:00'])],
    estado: 'APROBADO',
  },
  {
    nombre: 'Costura Express Teusaquillo', cat: 'Ropa y textiles', dir: 'Cra 24 #39-18, Teusaquillo',
    lat: 4.6280, lng: -74.0790, tel: '3134445566', wa: null, mail: 'costuraexpress@correo.co',
    desc: 'Arreglos en el día para ropa formal y uniformes.',
    servicios: ['Uniformes', 'Ropa formal', 'Bastas', 'Ajustes de talla'],
    horarios: franjas(L_V, ['10:00', '19:00']), estado: 'APROBADO',
  },
  {
    nombre: 'Muebles Restaura', cat: 'Muebles y madera', dir: 'Cl 12 #30-52, Puente Aranda',
    lat: 4.6180, lng: -74.1020, tel: '3167778899', wa: '573167778899', mail: null,
    desc: 'Restauración de muebles antiguos, tapizado y reparación de estructuras en madera.',
    servicios: ['Tapizado', 'Restauración de madera', 'Sillas', 'Comedores', 'Camas'],
    horarios: franjas(L_V, ['08:00', '17:00']), estado: 'APROBADO',
  },
  {
    nombre: 'Ebanistería El Roble', cat: 'Muebles y madera', dir: 'Cra 7 #117-40, Usaquén',
    lat: 4.7020, lng: -74.0330, tel: '3181119900', wa: '573181119900', mail: 'elroble@correo.co',
    desc: 'Carpintería fina y reparación de puertas y closets.',
    servicios: ['Puertas', 'Closets', 'Cajones', 'Barnizado'],
    // Sin horarios registrados a propósito: debe desaparecer con "Abierto ahora".
    horarios: [], estado: 'APROBADO',
  },
  {
    nombre: 'ReCarga Móvil', cat: 'Electrónica', dir: 'Cra 15 #78-22, Chicó',
    lat: 4.6660, lng: -74.0540, tel: '3123334455', wa: '573123334455', mail: 'recargamovil@correo.co',
    desc: 'Cambio de pantalla y batería de celulares en menos de una hora.',
    servicios: ['Pantallas de celular', 'Baterías', 'Puertos de carga', 'Tablets'],
    horarios: franjas(L_S, ['09:00', '20:00']), estado: 'APROBADO',
  },
  {
    nombre: 'PC Doctor Restrepo', cat: 'Electrónica', dir: 'Cl 18 Sur #20-14, Restrepo',
    lat: 4.5760, lng: -74.1010, tel: '3196667788', wa: null, mail: null,
    desc: 'Mantenimiento de computadores portátiles y de escritorio.',
    servicios: ['Portátiles', 'Computadores de escritorio', 'Discos duros', 'Fuentes de poder'],
    horarios: [...franjas(L_V, ['08:30', '12:00'], ['13:30', '18:30'])], estado: 'APROBADO',
  },
  {
    nombre: 'TV Service Nocturno', cat: 'Electrónica', dir: 'Cl 63 #24-08, Barrios Unidos',
    lat: 4.6540, lng: -74.0760, tel: '3151112233', wa: '573151112233', mail: null,
    desc: 'Reparación de televisores con atención en horario nocturno.',
    // Cruza la medianoche: prueba el caso límite del filtro "Abierto ahora".
    servicios: ['Televisores', 'Consolas', 'Equipos de sonido'],
    horarios: franjas([1, 2, 3, 4, 5], ['18:00', '02:00']), estado: 'APROBADO',
  },
  {
    nombre: 'Zapatería El Andar', cat: 'Calzado y marroquinería', dir: 'Cra 13 #45-60, Palermo',
    lat: 4.6350, lng: -74.0680, tel: '3172223311', wa: '573172223311', mail: null,
    desc: 'Cambio de suelas, tinturado y reparación de bolsos de cuero.',
    servicios: ['Suelas', 'Tacones', 'Bolsos de cuero', 'Cinturones', 'Tinturado'],
    horarios: [...franjas(L_V, ['08:00', '18:00']), ...franjas([6], ['09:00', '14:00'])],
    estado: 'APROBADO',
  },
  {
    nombre: 'Cuero y Puntada', cat: 'Calzado y marroquinería', dir: 'Cl 72 #11-30, Chapinero Alto',
    lat: 4.6560, lng: -74.0600, tel: '3009998877', wa: null, mail: 'cueroypuntada@correo.co',
    desc: 'Marroquinería artesanal y reparación de maletas de viaje.',
    servicios: ['Maletas', 'Morrales', 'Billeteras', 'Costura en cuero'],
    horarios: franjas(L_V, ['10:00', '18:00']), estado: 'APROBADO',
  },
  {
    nombre: 'BiciTaller La Rueda', cat: 'Bicicletas', dir: 'Cra 50 #22-15, Salitre',
    lat: 4.6510, lng: -74.1000, tel: '3186665544', wa: '573186665544', mail: null,
    desc: 'Mantenimiento preventivo y correctivo de bicicletas urbanas y de montaña.',
    servicios: ['Frenos', 'Transmisión', 'Ruedas', 'Suspensión', 'Alineación'],
    horarios: franjas(L_S, ['08:00', '19:00']), estado: 'APROBADO',
  },
  {
    nombre: 'Ciclo Mecánica Norte', cat: 'Bicicletas', dir: 'Cl 134 #17-40, Cedritos',
    lat: 4.7180, lng: -74.0420, tel: '3134447788', wa: '573134447788', mail: null,
    desc: 'Taller especializado en bicicletas eléctricas y de ruta.',
    servicios: ['Bicicletas eléctricas', 'Bicicletas de ruta', 'Baterías', 'Motores'],
    horarios: franjas(L_V, ['09:00', '18:00']), estado: 'APROBADO',
  },
  {
    nombre: 'Taller La Nevera Feliz', cat: 'Electrodomésticos', dir: 'Cl 80 #69-22, Engativá',
    lat: 4.6890, lng: -74.1120, tel: '3145558899', wa: null, mail: null,
    desc: 'Refrigeración doméstica y comercial.',
    servicios: ['Neveras', 'Vitrinas refrigeradas', 'Cuartos fríos'],
    horarios: franjas(L_V, ['07:00', '16:00']), estado: 'APROBADO',
  },
  // No aprobados: verifican que el mapa solo muestre los APROBADOS.
  {
    nombre: 'Reparaciones Pendiente SAS', cat: 'Electrónica', dir: 'Cl 26 #68-35, Fontibón',
    lat: 4.6650, lng: -74.1400, tel: '3001112222', wa: null, mail: null,
    desc: 'Propuesta enviada por la comunidad, aún sin revisar por moderación.',
    servicios: ['Impresoras'], horarios: franjas(L_V, ['09:00', '17:00']),
    estado: 'PENDIENTE', propuestoPor: 'juan@correo.com',
  },
  {
    nombre: 'Taller Fantasma', cat: 'Muebles y madera', dir: 'Dirección inexistente #0-00',
    lat: 4.6000, lng: -74.1200, tel: null, wa: null, mail: null,
    desc: 'Rechazado por moderación tras verificar que el establecimiento no existe.',
    servicios: [], horarios: [], estado: 'RECHAZADO', propuestoPor: 'juan@correo.com',
  },
];

const RESENAS = [
  ['TecnoRepara Andrés', 'laura@correo.com', 5, 'Me arreglaron la lavadora el mismo día y quedó como nueva. Muy recomendados.', 'Muchas gracias Laura, siempre a la orden.'],
  ['TecnoRepara Andrés', 'juan@correo.com', 4, 'Buen trabajo con la nevera, aunque tardaron un día más de lo prometido.', null],
  ['ReCarga Móvil', 'laura@correo.com', 5, 'Cambio de pantalla en 40 minutos y con garantía por escrito.', null],
  ['Sastrería La Puntada', 'laura@correo.com', 4, 'Buen arreglo del abrigo, precio justo.', null],
  ['BiciTaller La Rueda', 'juan@correo.com', 5, 'Dejaron la bici impecable y explicaron todo lo que hicieron.', 'Gracias Juan, nos vemos en el próximo mantenimiento.'],
  ['Muebles Restaura', 'juan@correo.com', 3, 'El tapizado quedó bien pero el acabado de la madera pudo ser mejor.', null],
  ['ElectroFix Sur', 'laura@correo.com', 4, 'Vinieron a domicilio sin costo adicional. Buen servicio.', null],
  ['Zapatería El Andar', 'juan@correo.com', 5, 'Las suelas quedaron perfectas y a muy buen precio.', null],
];

async function main() {
  // En el despliegue se invoca con --si-vacio: así un redespliegue no borra los
  // datos existentes, solo carga la semilla la primera vez.
  if (process.argv.includes('--si-vacio')) {
    const yaHay = await prisma.categoria.count();
    if (yaHay > 0) {
      console.log(`La base ya tiene ${yaHay} categorías. No se recarga la semilla.`);
      return;
    }
    console.log('Base vacía: se cargan los datos semilla.');
  }

  console.log('Limpiando la base de datos…');
  await prisma.favorito.deleteMany();
  await prisma.resena.deleteMany();
  await prisma.servicio.deleteMany();
  await prisma.horario.deleteMany();
  await prisma.comercio.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.usuario.deleteMany();

  console.log('Creando usuarios…');
  const usuarios = {};
  for (const u of USUARIOS) {
    usuarios[u.correo] = await prisma.usuario.create({
      data: {
        nombre: u.nombre,
        correo: u.correo,
        rol: u.rol,
        ciudad: u.ciudad,
        passwordHash: await bcrypt.hash(u.password, 10),
      },
    });
  }

  console.log('Creando categorías…');
  const categorias = {};
  for (const [i, c] of CATEGORIAS.entries()) {
    categorias[c.nombre] = await prisma.categoria.create({
      data: { nombre: c.nombre, descripcion: c.descripcion, icono: c.icono, orden: i + 1 },
    });
  }

  console.log('Creando comercios…');
  const comercios = {};
  for (const c of COMERCIOS) {
    comercios[c.nombre] = await prisma.comercio.create({
      data: {
        nombreComercial: c.nombre,
        descripcion: c.desc,
        categoriaId: categorias[c.cat].id,
        direccion: c.dir,
        ciudad: 'Bogotá',
        lat: c.lat,
        lng: c.lng,
        telefono: c.tel,
        whatsapp: c.wa,
        correo: c.mail,
        estado: c.estado,
        propietarioId: c.propietario ? usuarios[c.propietario].id : null,
        propuestoPorId: c.propuestoPor ? usuarios[c.propuestoPor].id : null,
        servicios: { create: c.servicios.map((nombre) => ({ nombre })) },
        horarios: { create: c.horarios },
      },
    });
  }

  console.log('Creando reseñas…');
  for (const [comercio, correo, calificacion, comentario, respuesta] of RESENAS) {
    await prisma.resena.create({
      data: {
        comercioId: comercios[comercio].id,
        usuarioId: usuarios[correo].id,
        calificacion,
        comentario,
        respuestaComercio: respuesta,
      },
    });
  }

  console.log('Creando favoritos…');
  await prisma.favorito.createMany({
    data: [
      { usuarioId: usuarios['laura@correo.com'].id, comercioId: comercios['TecnoRepara Andrés'].id },
      { usuarioId: usuarios['laura@correo.com'].id, comercioId: comercios['ReCarga Móvil'].id },
    ],
  });

  const aprobados = COMERCIOS.filter((c) => c.estado === 'APROBADO').length;
  console.log('\nListo:');
  console.log(`  ${USUARIOS.length} usuarios (${USUARIOS.map((u) => u.rol).join(', ')})`);
  console.log(`  ${CATEGORIAS.length} categorías`);
  console.log(`  ${COMERCIOS.length} comercios (${aprobados} aprobados, ${COMERCIOS.length - aprobados} no aprobados)`);
  console.log(`  ${RESENAS.length} reseñas`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
