export type Rol = 'USUARIO' | 'PROPIETARIO' | 'ADMIN';

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  ciudad: string | null;
  fotoUrl: string | null;
}

export interface Categoria {
  id: string;
  nombre: string;
  descripcion: string | null;
  icono: string | null;
  activa: boolean;
  orden: number;
  totalComercios: number;
}

export interface ComercioResumen {
  id: string;
  nombreComercial: string;
  descripcion: string | null;
  direccion: string;
  ciudad: string;
  lat: number;
  lng: number;
  fotoPortada: string | null;
  categoria: { id: string; nombre: string; icono: string | null };
  servicios: string[];
  abiertoAhora: boolean;
  tieneHorarios: boolean;
  reclamado: boolean;
  calificacionPromedio: number | null;
  totalResenas: number;
  distanciaKm: number | null;
}

export interface RespuestaComercios {
  total: number;
  filtros: {
    q: string;
    categorias: string[];
    abiertoAhora: boolean;
    orden: string;
    ubicacionUsuario: { lat: number; lng: number } | null;
  };
  comercios: ComercioResumen[];
}

export interface Franja {
  horaApertura: string;
  horaCierre: string;
}

export interface DiaHorario {
  dia: number;
  nombre: string;
  franjas: Franja[];
}

export interface Resena {
  id: string;
  calificacion: number;
  comentario: string | null;
  respuestaComercio: string | null;
  fecha: string;
  usuario: { id: string; nombre: string; fotoUrl: string | null };
}

export interface Ficha {
  id: string;
  nombreComercial: string;
  descripcion: string | null;
  categoria: { id: string; nombre: string; icono: string | null };
  direccion: string;
  ciudad: string;
  lat: number;
  lng: number;
  contacto: { telefono: string | null; whatsapp: string | null; correo: string | null };
  fotoPortada: string | null;
  servicios: string[];
  horarioSemanal: DiaHorario[];
  abiertoAhora: boolean;
  tieneHorarios: boolean;
  reclamado: boolean;
  propietario: { id: string; nombre: string } | null;
  calificacionPromedio: number | null;
  totalResenas: number;
  resenas: Resena[];
}

export interface SeccionPerfil<T = unknown> {
  titulo: string;
  total: number;
  disponibleEn: string | null;
  items: T[];
}

export interface Perfil {
  usuario: Usuario & { fechaRegistro: string };
  secciones: {
    favoritos: SeccionPerfil<{ id: string; nombreComercial: string; direccion: string }>;
    historial: SeccionPerfil;
    resenas: SeccionPerfil<{
      id: string;
      calificacion: number;
      comentario: string | null;
      fecha: string;
      comercio: { id: string; nombreComercial: string };
    }>;
    propuestas: SeccionPerfil<{
      id: string;
      nombreComercial: string;
      estado: string;
      fechaCreacion: string;
    }>;
  };
}
