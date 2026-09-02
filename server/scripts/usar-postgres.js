/**
 * Cambia el motor del esquema de Prisma de SQLite a PostgreSQL.
 *
 * Se ejecuta ÚNICAMENTE durante el despliegue (Render trabaja sobre una copia
 * limpia del repositorio, así que esto no toca tu archivo local). En desarrollo
 * seguimos con SQLite para no depender de ningún servidor.
 *
 * El resto del esquema es idéntico en ambos motores: no se usan enums de Prisma,
 * ni campos Json, ni arrays, que son las diferencias habituales entre uno y otro.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const aqui = dirname(fileURLToPath(import.meta.url));
const ruta = join(aqui, '..', 'prisma', 'schema.prisma');

const original = readFileSync(ruta, 'utf8');

if (original.includes('provider = "postgresql"')) {
  console.log('El esquema ya apunta a PostgreSQL. No hay nada que hacer.');
  process.exit(0);
}

const bloqueSqlite = /datasource\s+db\s*\{[^}]*\}/m;
if (!bloqueSqlite.test(original)) {
  console.error('No se encontró el bloque "datasource db" en schema.prisma.');
  process.exit(1);
}

const nuevo = original.replace(
  bloqueSqlite,
  `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`
);

writeFileSync(ruta, nuevo, 'utf8');
console.log('Esquema cambiado a PostgreSQL para el despliegue.');
