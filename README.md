# Repara y Recarga — Prototipo del Sprint 1

Plataforma web que conecta a la ciudadanía con talleres locales de reparación de
electrodomésticos, ropa, muebles y electrónica, alineada con el **ODS 12** (consumo y
producción responsables).

Proyecto de la asignatura *Patrones y Metodologías de Construcción de Software* —
Universidad Manuela Beltrán.

---

## Puesta en marcha

Requisitos: **Node.js 18 o superior**. No hace falta instalar ninguna base de datos.

```bash
npm run instalar     # instala las dependencias de la raíz, del servidor y del cliente
npm run db:reset     # crea la base SQLite y carga los datos de demostración
npm run dev          # levanta la API (3001) y el cliente (5173) a la vez
```

Después abre **http://localhost:5173**.

Para comprobar que todo funciona, con el servidor levantado:

```bash
npm run pruebas
```

Ejecuta 53 comprobaciones automáticas, una por criterio de aceptación verificable
desde la API.

---

## Alcance del Sprint 1

Los siete requerimientos priorizados, en orden de relevancia:

| ID | Requerimiento | RF | Estado |
|----|---------------|-----|--------|
| HU-01 | Perfil de usuario | RF16 | Implementado |
| HU-02 | Mapa interactivo | RF01 | Implementado |
| HU-03 | Gestión de categorías | RF19 | Implementado |
| HU-04 | Filtro de categorías | RF02 | Implementado |
| HU-05 | Buscador general | RF03 | Implementado |
| HU-06 | Ficha de comercio | RF05 | Implementado |
| HU-07 | Filtro «Abierto ahora» | RF04 | Implementado |

### Lo que está deliberadamente fuera de alcance

- **Autenticación real (RF06).** La sesión es **simulada**: el cliente envía la
  cabecera `x-usuario-simulado` y el servidor resuelve el usuario. Se eligió así para
  no arrastrar RF06 al Sprint 1. **No es un mecanismo de seguridad** y debe
  reemplazarse por completo antes de cualquier despliegue.
- **Favoritos (RF10)** e **Historial de reparaciones (RF15)**: el perfil los muestra
  como secciones con su etiqueta de sprint pendiente.
- **Solicitud de cotización (RF17)** y **reporte de datos (RF09)**: la ficha muestra
  los botones deshabilitados con la nota correspondiente.

---

## Arquitectura

```
repara-y-recarga/
├── server/                  API REST — Node + Express + Prisma + SQLite
│   ├── prisma/
│   │   ├── schema.prisma    Esquema transcrito del Modelo E-R documentado
│   │   └── seed.js          17 comercios, 6 categorías, 4 usuarios, 8 reseñas
│   ├── src/
│   │   ├── lib/horarios.js  Lógica del filtro «Abierto ahora»
│   │   ├── lib/texto.js     Normalización de búsqueda y distancia haversine
│   │   ├── lib/sesion.js    Sesión simulada (sustituir por RF06)
│   │   └── routes/          comercios · categorias · perfil
│   └── pruebas-api.mjs      53 comprobaciones de criterios de aceptación
└── client/                  React + Vite + TypeScript + Leaflet
    └── src/
        ├── pages/           Explorar · FichaComercio · Perfil · AdminCategorias
        └── components/      Mapa (Leaflet + OpenStreetMap)
```

**Decisiones técnicas y su motivo:**

- **SQLite en lugar de PostgreSQL.** El documento de arquitectura fija PostgreSQL +
  PostGIS como objetivo de producción. Para el prototipo se usa SQLite porque no
  requiere instalar ningún servidor. Prisma permite cambiar de motor modificando
  únicamente el `provider` del esquema.
- **Leaflet + OpenStreetMap en lugar de Google Maps.** RF01 pide «una API de mapas
  como Google Maps»; Leaflet cumple el requisito sin exigir clave de API ni
  facturación.
- **Distancias calculadas con la fórmula del haversine** en lugar de consultas
  geoespaciales, dado el volumen de datos del prototipo.

---

## Usuarios de demostración

El conmutador de la barra superior permite actuar como cualquiera de ellos.

| Usuario | Rol | Para qué sirve |
|---------|-----|----------------|
| Laura Restrepo | USUARIO | Perfil con reseñas y favoritos |
| Ernesto Vargas | PROPIETARIO | Propietario verificado de TecnoRepara Andrés |
| Camila Ordóñez | ADMIN | Único rol que puede gestionar categorías |
| Juan Pablo Ríos | USUARIO | Tiene comercios propuestos pendientes y rechazados |

Las contraseñas de los datos semilla están en `server/prisma/seed.js`.

---

## Datos de demostración

El conjunto está construido para poder verificar los criterios de aceptación:

- **Ebanistería El Roble** no tiene horarios registrados: desaparece con «Abierto ahora».
- **TV Service Nocturno** abre de 18:00 a 02:00: prueba las franjas que cruzan la medianoche.
- **TecnoRepara Andrés** tiene horario partido (08:00–12:30 / 14:00–18:00) y propietario
  verificado, así que muestra el bloque de cotización.
- **ElectroFix Sur** no está reclamado: muestra los canales de contacto directo en su lugar.
- **Reparaciones Pendiente SAS** y **Taller Fantasma** están en estado `PENDIENTE` y
  `RECHAZADO`: no deben aparecer nunca en el mapa ni en las búsquedas.

---

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/comercios` | Búsqueda y filtros. Parámetros: `q`, `categorias`, `abiertoAhora`, `lat`, `lng`, `orden` |
| GET | `/api/comercios/:id` | Ficha completa. Lectura pública |
| GET | `/api/categorias` | Categorías activas. `?todas=true` incluye las desactivadas |
| POST | `/api/categorias` | Crear categoría — solo ADMIN |
| PUT | `/api/categorias/:id` | Editar categoría — solo ADMIN |
| PATCH | `/api/categorias/:id/estado` | Activar o desactivar — solo ADMIN |
| DELETE | `/api/categorias/:id` | Eliminar — solo ADMIN, bloqueado si tiene comercios |
| GET | `/api/perfil` | Perfil y sus cuatro secciones — requiere sesión |
| PUT | `/api/perfil` | Editar nombre y ciudad |
| PUT | `/api/perfil/correo` | Cambiar correo — exige la contraseña actual |
| PUT | `/api/perfil/password` | Cambiar contraseña — valida la política |
| DELETE | `/api/perfil` | Eliminar cuenta — exige confirmación explícita |
| GET | `/api/sesion` | Usuarios disponibles para la sesión simulada |

---

## Publicar en internet

El proyecto está preparado para desplegarse como **un único servicio en Render**
(la API sirve también la web construida, así que todo vive en una sola URL) con la
base de datos **PostgreSQL en Neon**. Ambos planes son gratuitos.

> Las cuentas de Render, Neon y GitHub debes crearlas tú: el código ya está listo,
> pero nadie más puede registrarse en tu nombre.

### 1. Subir el repositorio a GitHub

Primero crea un repositorio **vacío** en <https://github.com/new> (sin README ni
`.gitignore`, porque este proyecto ya los tiene). Luego, desde la carpeta del
proyecto:

```bash
git add -A
git commit -m "Prototipo del Sprint 1"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/repara-y-recarga.git
git push -u origin main
```

Sustituye `TU_USUARIO` por tu usuario de GitHub. Comprueba que el push terminó
correctamente y que ves los archivos en la web de GitHub: si este paso no se
completa, Render no tendrá nada que desplegar.

### 2. Crear la base de datos en Neon

1. Entra en <https://neon.tech> y crea un proyecto.
2. Copia la **cadena de conexión** (empieza por `postgresql://…` y termina en
   `?sslmode=require`). La necesitarás en el paso siguiente.

### 3. Desplegar en Render

1. Entra en <https://render.com> → **New** → **Blueprint**.
2. Conecta el repositorio de GitHub. Render leerá el archivo `render.yaml` de la
   raíz y configurará el servicio solo.
3. Cuando pida la variable `DATABASE_URL`, pega la cadena de Neon.
4. Pulsa **Apply**. El primer despliegue tarda unos minutos.

Durante el build, Render ejecuta `npm run build:render`, que:

1. instala las dependencias del cliente y del servidor;
2. construye la web de React en `client/dist`;
3. cambia el esquema de Prisma a PostgreSQL (`scripts/usar-postgres.js`);
4. crea las tablas en Neon y carga los datos semilla **solo si la base está vacía**,
   de modo que un redespliegue no borra la información existente.

Al terminar tendrás una URL accesible desde cualquier dispositivo.

> **Lee la URL en el panel de Render, no la deduzcas.** Los subdominios
> `.onrender.com` son únicos a nivel mundial: si `repara-y-recarga` ya está en uso
> por otra persona, Render le añadirá un sufijo y tu dirección será algo como
> `repara-y-recarga-a1b2.onrender.com`. La dirección real aparece en la parte
> superior de la página del servicio.
>
> Si al abrirla ves un `Not Found` en texto plano, mira los encabezados de la
> respuesta: `x-render-routing: no-server` significa que **no hay ningún servicio
> publicado en esa dirección** (el despliegue falló o la URL no es la correcta),
> no que la aplicación esté devolviendo un 404.

### Modo demostración

`render.yaml` fija `MODO_DEMO=true`. Como la sesión de este prototipo es simulada
y cualquier visitante puede elegir el rol de administrador, en el enlace público se
**bloquean las operaciones irreversibles**: eliminar categorías y eliminar cuentas
devuelven `403`. Todo lo demás —navegar, buscar, filtrar, ver fichas, crear y editar
categorías, activarlas o desactivarlas, editar el perfil— funciona con normalidad, y
es recuperable volviendo a cargar los datos semilla.

En local el modo está desactivado, así que puedes probar todo sin restricciones.

### Limitaciones del plan gratuito

- **El servicio se duerme tras 15 minutos sin visitas.** La primera petición
  después de ese tiempo tarda unos 50 segundos en responder mientras Render lo
  despierta; a partir de ahí va a velocidad normal. Es el comportamiento normal
  del plan gratuito, no un fallo.
- Neon también suspende la base tras un rato de inactividad, pero despierta en
  un par de segundos.

---

## Próximos sprints

Quedan 13 requerimientos funcionales y los 10 no funcionales. El orden de las
entregas 2 y 3 está por definir; los candidatos naturales para la 2, por dependencia,
son RF06 (autenticación real), RF10 (favoritos), RF15 (historial) y RF17 (cotización).
