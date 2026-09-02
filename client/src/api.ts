import type { Categoria, Ficha, Perfil, RespuestaComercios, Usuario } from './tipos';

const CLAVE_SESION = 'ryr.usuarioSimulado';

/** Correo del usuario con el que se está actuando (sesión simulada del Sprint 1). */
export const sesion = {
  get: () => localStorage.getItem(CLAVE_SESION),
  set: (correo: string | null) => {
    if (correo) localStorage.setItem(CLAVE_SESION, correo);
    else localStorage.removeItem(CLAVE_SESION);
  },
};

export class ErrorApi extends Error {
  status: number;
  detalle?: string;
  errores?: string[];
  constructor(status: number, mensaje: string, detalle?: string, errores?: string[]) {
    super(mensaje);
    this.status = status;
    this.detalle = detalle;
    this.errores = errores;
  }
}

async function pedir<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const correo = sesion.get();
  const r = await fetch(`/api${ruta}`, {
    ...opciones,
    headers: {
      'content-type': 'application/json',
      ...(correo ? { 'x-usuario-simulado': correo } : {}),
      ...(opciones.headers ?? {}),
    },
  });

  if (r.status === 204) return undefined as T;

  const cuerpo = await r.json().catch(() => null);
  if (!r.ok) {
    throw new ErrorApi(
      r.status,
      cuerpo?.error ?? `Error ${r.status}`,
      cuerpo?.detalle,
      cuerpo?.errores
    );
  }
  return cuerpo as T;
}

export const api = {
  sesion: () =>
    pedir<{ actual: Usuario | null; disponibles: Usuario[]; simulada: boolean; modoDemo: boolean }>(
      '/sesion'
    ),

  categorias: (todas = false) => pedir<Categoria[]>(`/categorias${todas ? '?todas=true' : ''}`),

  crearCategoria: (datos: { nombre: string; descripcion?: string; icono?: string }) =>
    pedir<Categoria>('/categorias', { method: 'POST', body: JSON.stringify(datos) }),

  editarCategoria: (id: string, datos: { nombre: string; descripcion?: string; icono?: string }) =>
    pedir<Categoria>(`/categorias/${id}`, { method: 'PUT', body: JSON.stringify(datos) }),

  estadoCategoria: (id: string, activa: boolean) =>
    pedir<Categoria>(`/categorias/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ activa }),
    }),

  eliminarCategoria: (id: string) => pedir<void>(`/categorias/${id}`, { method: 'DELETE' }),

  comercios: (p: {
    q?: string;
    categorias?: string[];
    abiertoAhora?: boolean;
    lat?: number | null;
    lng?: number | null;
    orden?: string;
  }) => {
    const qs = new URLSearchParams();
    if (p.q) qs.set('q', p.q);
    if (p.categorias?.length) qs.set('categorias', p.categorias.join(','));
    if (p.abiertoAhora) qs.set('abiertoAhora', 'true');
    if (p.lat != null && p.lng != null) {
      qs.set('lat', String(p.lat));
      qs.set('lng', String(p.lng));
    }
    if (p.orden) qs.set('orden', p.orden);
    return pedir<RespuestaComercios>(`/comercios?${qs.toString()}`);
  },

  ficha: (id: string) => pedir<Ficha>(`/comercios/${id}`),

  perfil: () => pedir<Perfil>('/perfil'),

  editarPerfil: (datos: { nombre: string; ciudad: string }) =>
    pedir<{ usuario: Usuario; mensaje: string }>('/perfil', {
      method: 'PUT',
      body: JSON.stringify(datos),
    }),

  cambiarCorreo: (datos: { correo: string; passwordActual: string }) =>
    pedir<{ usuario: Usuario; mensaje: string }>('/perfil/correo', {
      method: 'PUT',
      body: JSON.stringify(datos),
    }),

  cambiarPassword: (datos: { passwordActual: string; passwordNueva: string }) =>
    pedir<{ mensaje: string }>('/perfil/password', {
      method: 'PUT',
      body: JSON.stringify(datos),
    }),

  eliminarCuenta: () =>
    pedir<{ mensaje: string }>('/perfil', {
      method: 'DELETE',
      body: JSON.stringify({ confirmacion: 'ELIMINAR' }),
    }),
};
