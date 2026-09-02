import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, sesion as almacen } from './api';
import type { Usuario } from './tipos';

interface CtxSesion {
  usuario: Usuario | null;
  disponibles: Usuario[];
  modoDemo: boolean;
  cambiar: (correo: string | null) => void;
  recargar: () => Promise<void>;
  cargando: boolean;
}

const Ctx = createContext<CtxSesion>({
  usuario: null,
  disponibles: [],
  modoDemo: false,
  cambiar: () => {},
  recargar: async () => {},
  cargando: true,
});

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [disponibles, setDisponibles] = useState<Usuario[]>([]);
  const [modoDemo, setModoDemo] = useState(false);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    try {
      const r = await api.sesion();
      setUsuario(r.actual);
      setDisponibles(r.disponibles);
      setModoDemo(Boolean(r.modoDemo));
    } catch {
      setUsuario(null);
      setDisponibles([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const cambiar = useCallback(
    (correo: string | null) => {
      almacen.set(correo);
      void recargar();
    },
    [recargar]
  );

  return (
    <Ctx.Provider value={{ usuario, disponibles, modoDemo, cambiar, recargar, cargando }}>
      {children}
    </Ctx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSesion = () => useContext(Ctx);
