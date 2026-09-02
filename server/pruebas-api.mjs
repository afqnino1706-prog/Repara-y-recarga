/**
 * Pruebas de los criterios de aceptación del Sprint 1 contra la API en marcha.
 * Uso:  node pruebas-api.mjs      (requiere `npm run dev` en otra terminal)
 */

const BASE = process.env.API ?? 'http://localhost:3001';
const ADMIN = { 'x-usuario-simulado': 'camila@correo.com' };
const LAURA = { 'x-usuario-simulado': 'laura@correo.com' };

let ok = 0;
let fail = 0;
const fallos = [];

function check(hu, criterio, condicion, detalle = '') {
  if (condicion) {
    ok++;
    console.log(`  OK   ${hu}  ${criterio}`);
  } else {
    fail++;
    fallos.push(`${hu} — ${criterio} ${detalle}`);
    console.log(`  FALLA ${hu}  ${criterio}  ${detalle}`);
  }
}

const api = async (ruta, opciones = {}) => {
  const r = await fetch(`${BASE}${ruta}`, {
    ...opciones,
    headers: { 'content-type': 'application/json', ...(opciones.headers ?? {}) },
  });
  const cuerpo = r.status === 204 ? null : await r.json().catch(() => null);
  return { status: r.status, body: cuerpo };
};

console.log('\n=== HU-02 · Mapa interactivo (RF01) ===');
{
  const { body } = await api('/api/comercios');
  check('HU-02', 'devuelve comercios sin requerir sesión', body.total > 0, `total=${body.total}`);
  check('HU-02', 'solo muestra comercios APROBADOS',
    !body.comercios.some((c) => /Pendiente|Fantasma/.test(c.nombreComercial)));
  const c = body.comercios[0];
  check('HU-02', 'cada comercio trae coordenadas para el pin',
    Number.isFinite(c.lat) && Number.isFinite(c.lng));
  check('HU-02', 'la tarjeta emergente trae nombre, categoría y calificación',
    'nombreComercial' in c && 'categoria' in c && 'calificacionPromedio' in c);
}

console.log('\n=== HU-04 · Filtro por categoría (RF02) ===');
{
  const { body: cats } = await api('/api/categorias');
  const electro = cats.find((c) => c.nombre === 'Electrodomésticos');
  const bicis = cats.find((c) => c.nombre === 'Bicicletas');

  const { body: todos } = await api('/api/comercios');
  const { body: uno } = await api(`/api/comercios?categorias=${electro.id}`);
  const { body: dos } = await api(`/api/comercios?categorias=${electro.id},${bicis.id}`);

  check('HU-04', 'sin categorías seleccionadas muestra todas', todos.total > uno.total);
  check('HU-04', 'filtra por una categoría',
    uno.comercios.every((c) => c.categoria.nombre === 'Electrodomésticos'), `total=${uno.total}`);
  check('HU-04', 'admite selección múltiple', dos.total > uno.total, `${uno.total} -> ${dos.total}`);
  check('HU-04', 'informa el número de resultados', typeof dos.total === 'number');
  check('HU-04', 'el filtro funciona sin sesión iniciada', uno.total > 0);
}

console.log('\n=== HU-05 · Buscador general (RF03) ===');
{
  const { body: a } = await api('/api/comercios?q=lavadora');
  check('HU-05', 'busca en la lista de servicios', a.total > 0, `total=${a.total}`);

  const { body: b } = await api('/api/comercios?q=REPARACION');
  const { body: c } = await api('/api/comercios?q=reparación');
  check('HU-05', 'ignora mayúsculas y tildes', b.total === c.total && b.total > 0,
    `${b.total} vs ${c.total}`);

  const { body: d } = await api('/api/comercios?q=tecno');
  check('HU-05', 'admite coincidencias parciales',
    d.comercios.some((x) => x.nombreComercial.includes('TecnoRepara')));

  const { body: e } = await api('/api/comercios?q=xyz123');
  check('HU-05', 'sin coincidencias devuelve lista vacía', e.total === 0);

  const { body: f } = await api('/api/comercios?orden=nombre');
  const nombres = f.comercios.map((x) => x.nombreComercial);
  check('HU-05', 'permite ordenar por nombre',
    JSON.stringify(nombres) === JSON.stringify([...nombres].sort((x, y) => x.localeCompare(y, 'es'))));

  const { body: g } = await api('/api/comercios?lat=4.6486&lng=-74.0628&orden=distancia');
  check('HU-05', 'permite ordenar por distancia',
    g.comercios[0].distanciaKm <= g.comercios[g.comercios.length - 1].distanciaKm);
}

console.log('\n=== HU-07 · Filtro "Abierto ahora" (RF04) ===');
{
  const { body: sin } = await api('/api/comercios');
  const { body: con } = await api('/api/comercios?abiertoAhora=true');
  check('HU-07', 'el filtro reduce o mantiene los resultados', con.total <= sin.total,
    `${sin.total} -> ${con.total}`);
  check('HU-07', 'todos los resultados están efectivamente abiertos',
    con.comercios.every((c) => c.abiertoAhora === true));
  check('HU-07', 'excluye los comercios sin horarios registrados',
    !con.comercios.some((c) => c.tieneHorarios === false));

  const roble = sin.comercios.find((c) => c.nombreComercial === 'Ebanistería El Roble');
  check('HU-07', 'un comercio sin horarios nunca figura como abierto',
    roble && roble.tieneHorarios === false && roble.abiertoAhora === false);

  const { body: comb } = await api('/api/comercios?abiertoAhora=true&q=nevera');
  check('HU-07', 'es acumulable con el buscador', comb.total <= con.total);
}

console.log('\n=== HU-06 · Ficha de comercio (RF05) ===');
{
  const { body: lista } = await api('/api/comercios?q=TecnoRepara');
  const { status, body: ficha } = await api(`/api/comercios/${lista.comercios[0].id}`);

  check('HU-06', 'la ficha es de lectura pública', status === 200);
  check('HU-06', 'muestra nombre y dirección completa',
    Boolean(ficha.nombreComercial && ficha.direccion));
  check('HU-06', 'trae coordenadas para el botón de ruta',
    Number.isFinite(ficha.lat) && Number.isFinite(ficha.lng));
  check('HU-06', 'presenta los canales de contacto',
    ficha.contacto && 'telefono' in ficha.contacto && 'whatsapp' in ficha.contacto && 'correo' in ficha.contacto);
  check('HU-06', 'lista los objetos que repara', Array.isArray(ficha.servicios) && ficha.servicios.length > 0);
  check('HU-06', 'incluye el horario semanal de 7 días', ficha.horarioSemanal?.length === 7);
  check('HU-06', 'soporta horarios partidos',
    ficha.horarioSemanal.some((d) => d.franjas.length > 1));
  check('HU-06', 'muestra calificación promedio y total de reseñas',
    ficha.calificacionPromedio > 0 && ficha.totalResenas > 0);
  check('HU-06', 'incluye las respuestas del propietario a las reseñas',
    ficha.resenas.some((r) => r.respuestaComercio));
  check('HU-06', 'indica si el comercio fue reclamado', ficha.reclamado === true);

  const { body: sinReclamar } = await api('/api/comercios?q=ElectroFix');
  const { body: f2 } = await api(`/api/comercios/${sinReclamar.comercios[0].id}`);
  check('HU-06', 'un comercio no reclamado se marca como tal', f2.reclamado === false);

  const { status: s404 } = await api('/api/comercios/no-existe');
  check('HU-06', 'un comercio inexistente devuelve 404', s404 === 404);
}

console.log('\n=== HU-03 · Gestión de categorías (RF19) ===');
{
  const { status: sinSesion } = await api('/api/categorias', {
    method: 'POST', body: JSON.stringify({ nombre: 'Prueba sin sesión' }),
  });
  check('HU-03', 'sin sesión no permite crear', sinSesion === 401, `status=${sinSesion}`);

  const { status: sinRol } = await api('/api/categorias', {
    method: 'POST', headers: LAURA, body: JSON.stringify({ nombre: 'Prueba sin rol' }),
  });
  check('HU-03', 'un usuario sin rol ADMIN recibe 403', sinRol === 403, `status=${sinRol}`);

  const { status: creado, body: nueva } = await api('/api/categorias', {
    method: 'POST', headers: ADMIN,
    body: JSON.stringify({ nombre: 'Juguetes', descripcion: 'Reparación de juguetes.' }),
  });
  check('HU-03', 'el ADMIN puede crear una categoría', creado === 201, `status=${creado}`);

  const { status: dup } = await api('/api/categorias', {
    method: 'POST', headers: ADMIN, body: JSON.stringify({ nombre: 'Juguetes' }),
  });
  check('HU-03', 'impide nombres duplicados', dup === 409, `status=${dup}`);

  const { status: edit, body: editada } = await api(`/api/categorias/${nueva.id}`, {
    method: 'PUT', headers: ADMIN,
    body: JSON.stringify({ nombre: 'Juguetes y peluches', descripcion: 'Actualizada.' }),
  });
  check('HU-03', 'el ADMIN puede editar', edit === 200 && editada.nombre === 'Juguetes y peluches');

  // Regresión: editar solo el nombre no debe borrar la descripción ni el icono.
  const { body: soloNombre } = await api(`/api/categorias/${nueva.id}`, {
    method: 'PUT', headers: ADMIN, body: JSON.stringify({ nombre: 'Juguetes infantiles' }),
  });
  check('HU-03', 'editar solo el nombre conserva la descripción',
    soloNombre.descripcion === 'Actualizada.', `descripcion=${JSON.stringify(soloNombre.descripcion)}`);

  // Enviar la descripción vacía sí debe borrarla (distinto de omitirla).
  const { body: vaciada } = await api(`/api/categorias/${nueva.id}`, {
    method: 'PUT', headers: ADMIN, body: JSON.stringify({ descripcion: '' }),
  });
  check('HU-03', 'enviar la descripción vacía sí la borra',
    vaciada.descripcion === null && vaciada.nombre === 'Juguetes infantiles');

  const { body: desact } = await api(`/api/categorias/${nueva.id}/estado`, {
    method: 'PATCH', headers: ADMIN, body: JSON.stringify({ activa: false }),
  });
  check('HU-03', 'puede desactivar sin eliminar', desact.activa === false);

  const { body: activas } = await api('/api/categorias');
  check('HU-03', 'las desactivadas no aparecen en el filtro público',
    !activas.some((c) => c.id === nueva.id));

  const { body: todas } = await api('/api/categorias?todas=true');
  check('HU-03', 'el panel sí ve las desactivadas', todas.some((c) => c.id === nueva.id));
  check('HU-03', 'muestra cuántos comercios dependen de cada categoría',
    todas.every((c) => typeof c.totalComercios === 'number'));

  const conComercios = todas.find((c) => c.totalComercios > 0);
  const { status: bloqueada, body: err } = await api(`/api/categorias/${conComercios.id}`, {
    method: 'DELETE', headers: ADMIN,
  });
  check('HU-03', 'no permite eliminar una categoría con comercios asociados',
    bloqueada === 409 && err.totalComercios > 0, `status=${bloqueada}`);

  const { status: borrada } = await api(`/api/categorias/${nueva.id}`, {
    method: 'DELETE', headers: ADMIN,
  });
  check('HU-03', 'sí permite eliminar una categoría vacía', borrada === 204, `status=${borrada}`);
}

console.log('\n=== HU-01 · Perfil de usuario (RF16) ===');
{
  const { status: sinSesion } = await api('/api/perfil');
  check('HU-01', 'sin sesión iniciada devuelve 401', sinSesion === 401, `status=${sinSesion}`);

  const { body: perfil } = await api('/api/perfil', { headers: LAURA });
  check('HU-01', 'muestra nombre, correo y ciudad',
    Boolean(perfil.usuario.nombre && perfil.usuario.correo && perfil.usuario.ciudad));
  check('HU-01', 'reúne las cuatro secciones en un mismo menú',
    ['favoritos', 'historial', 'resenas', 'propuestas'].every((k) => k in perfil.secciones));
  check('HU-01', 'las propuestas muestran su estado',
    perfil.secciones.propuestas.items.every((p) => ['PENDIENTE', 'APROBADO', 'RECHAZADO'].includes(p.estado))
    || perfil.secciones.propuestas.total === 0);
  check('HU-01', 'declara qué secciones llegan en el Sprint 2',
    perfil.secciones.historial.disponibleEn === 'Sprint 2 (RF15)');

  const { body: edit } = await api('/api/perfil', {
    method: 'PUT', headers: LAURA,
    body: JSON.stringify({ nombre: 'Laura Restrepo', ciudad: 'Medellín' }),
  });
  check('HU-01', 'permite editar los datos personales', edit.usuario.ciudad === 'Medellín');
  await api('/api/perfil', {
    method: 'PUT', headers: LAURA,
    body: JSON.stringify({ nombre: 'Laura Restrepo', ciudad: 'Bogotá' }),
  });

  const { status: sinPass } = await api('/api/perfil/correo', {
    method: 'PUT', headers: LAURA,
    body: JSON.stringify({ correo: 'otro@correo.com', passwordActual: 'incorrecta' }),
  });
  check('HU-01', 'cambiar el correo exige la contraseña actual', sinPass === 400, `status=${sinPass}`);

  const { status: debil, body: errPass } = await api('/api/perfil/password', {
    method: 'PUT', headers: LAURA,
    body: JSON.stringify({ passwordActual: 'Laura2026', passwordNueva: 'corta' }),
  });
  check('HU-01', 'valida la política de contraseña',
    debil === 400 && errPass.errores.length === 3, `errores=${errPass?.errores?.length}`);

  const { status: cambio } = await api('/api/perfil/password', {
    method: 'PUT', headers: LAURA,
    body: JSON.stringify({ passwordActual: 'Laura2026', passwordNueva: 'LauraNueva1' }),
  });
  check('HU-01', 'permite cambiar la contraseña con datos válidos', cambio === 200);
  await api('/api/perfil/password', {
    method: 'PUT', headers: LAURA,
    body: JSON.stringify({ passwordActual: 'LauraNueva1', passwordNueva: 'Laura2026' }),
  });

  const { status: sinConfirmar } = await api('/api/perfil', {
    method: 'DELETE', headers: LAURA, body: JSON.stringify({}),
  });
  check('HU-01', 'eliminar la cuenta exige confirmación explícita', sinConfirmar === 400);
}

console.log(`\n${'='.repeat(52)}`);
console.log(`  Criterios verificados: ${ok + fail}   Correctos: ${ok}   Fallos: ${fail}`);
if (fallos.length) {
  console.log('\n  Fallos:');
  fallos.forEach((f) => console.log(`   - ${f}`));
}
console.log('='.repeat(52));
process.exit(fail ? 1 : 0);
