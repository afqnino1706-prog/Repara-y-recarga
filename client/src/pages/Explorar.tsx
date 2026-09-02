import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { CENTRO_BOGOTA, Mapa } from '../components/Mapa';
import type { Categoria, ComercioResumen } from '../tipos';

/**
 * Pantalla principal — HU-02 (mapa), HU-04 (filtro por categoría),
 * HU-05 (buscador) y HU-07 (abierto ahora).
 */
export function Explorar() {
  const navegar = useNavigate();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [comercios, setComercios] = useState<ComercioResumen[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);

  const [q, setQ] = useState('');
  const [seleccionadas, setSeleccionadas] = useState<string[]>([]);
  const [abiertoAhora, setAbiertoAhora] = useState(false);
  const [orden, setOrden] = useState('distancia');

  const [ubicacion, setUbicacion] = useState<[number, number] | null>(null);
  const [permisoDenegado, setPermisoDenegado] = useState(false);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);

  const refLista = useRef<HTMLDivElement>(null);

  // Geolocalización: si se deniega, el mapa se centra en la coordenada por
  // defecto de la ciudad sin bloquear la navegación (criterio de HU-02).
  useEffect(() => {
    if (!navigator.geolocation) {
      setPermisoDenegado(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUbicacion([pos.coords.latitude, pos.coords.longitude]),
      () => setPermisoDenegado(true),
      { timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    void api.categorias().then(setCategorias).catch(() => setCategorias([]));
  }, []);

  // El filtrado ocurre en tiempo real, sin botón adicional (criterio de HU-04).
  useEffect(() => {
    let vigente = true;
    setCargando(true);
    const t = setTimeout(() => {
      api
        .comercios({
          q,
          categorias: seleccionadas,
          abiertoAhora,
          lat: ubicacion?.[0] ?? null,
          lng: ubicacion?.[1] ?? null,
          orden,
        })
        .then((r) => {
          if (!vigente) return;
          setComercios(r.comercios);
          setTotal(r.total);
        })
        .catch(() => {
          if (vigente) setComercios([]);
        })
        .finally(() => vigente && setCargando(false));
    }, 220); // pequeño retardo para no consultar en cada tecla
    return () => {
      vigente = false;
      clearTimeout(t);
    };
  }, [q, seleccionadas, abiertoAhora, orden, ubicacion]);

  const centro = useMemo<[number, number]>(() => ubicacion ?? CENTRO_BOGOTA, [ubicacion]);

  const alternarCategoria = (id: string) =>
    setSeleccionadas((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const restablecer = () => {
    setQ('');
    setSeleccionadas([]);
    setAbiertoAhora(false);
  };

  const seleccionarDesdeMapa = (id: string) => {
    setSeleccionado(id);
    document.getElementById(`tarjeta-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const hayFiltros = q.trim() !== '' || seleccionadas.length > 0 || abiertoAhora;

  return (
    <div className="explorar">
      <aside className="panel">
        <div className="panel-filtros">
          {/* HU-05 · buscador general */}
          <div className="buscador">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar taller, servicio u objeto…"
              aria-label="Buscar taller, servicio u objeto"
            />
            {q && (
              <button className="limpiar" onClick={() => setQ('')} aria-label="Limpiar búsqueda">
                ×
              </button>
            )}
          </div>

          {/* HU-04 · selección múltiple de categorías */}
          <div className="chips">
            <button
              className={`chip ${seleccionadas.length === 0 ? 'on' : ''}`}
              onClick={() => setSeleccionadas([])}
            >
              Todas
            </button>
            {categorias.map((c) => (
              <button
                key={c.id}
                className={`chip ${seleccionadas.includes(c.id) ? 'on' : ''}`}
                onClick={() => alternarCategoria(c.id)}
                title={c.descripcion ?? undefined}
              >
                {c.icono} {c.nombre}
              </button>
            ))}
          </div>

          {/* HU-07 · conmutador "Abierto ahora" */}
          <div className="chips">
            <button
              className={`chip toggle-abierto ${abiertoAhora ? 'on' : ''}`}
              onClick={() => setAbiertoAhora((v) => !v)}
              aria-pressed={abiertoAhora}
            >
              {abiertoAhora ? '✓' : '○'} Abierto ahora
            </button>
          </div>

          <div className="fila-orden">
            <span className="contador">
              {cargando ? 'Buscando…' : `${total} ${total === 1 ? 'taller' : 'talleres'}`}
            </span>
            <select value={orden} onChange={(e) => setOrden(e.target.value)} aria-label="Ordenar por">
              <option value="distancia">Más cercanos</option>
              <option value="calificacion">Mejor calificados</option>
              <option value="nombre">Nombre (A-Z)</option>
            </select>
          </div>

          {permisoDenegado && (
            <p className="ayuda" style={{ fontSize: 12, color: '#6c7a72', marginTop: 10, marginBottom: 0 }}>
              Sin permiso de ubicación: el mapa se centra en Bogotá y no se calculan distancias.
            </p>
          )}
        </div>

        <div className="panel-lista" ref={refLista}>
          {!cargando && comercios.length === 0 && (
            <div className="vacio">
              <strong>No se encontraron talleres de reparación que coincidan con su búsqueda</strong>
              {hayFiltros && (
                <button className="btn pequeno" onClick={restablecer} style={{ marginTop: 10 }}>
                  Restablecer los filtros
                </button>
              )}
            </div>
          )}

          {comercios.map((c) => (
            <article
              key={c.id}
              id={`tarjeta-${c.id}`}
              className={`tarjeta ${seleccionado === c.id ? 'sel' : ''}`}
              onClick={() => navegar(`/comercio/${c.id}`)}
              onMouseEnter={() => setSeleccionado(c.id)}
            >
              <h3>{c.nombreComercial}</h3>
              <div className="meta">
                <span>
                  {c.categoria.icono} {c.categoria.nombre}
                </span>
                {c.calificacionPromedio != null && (
                  <span className="estrella">
                    ★ {c.calificacionPromedio}{' '}
                    <span style={{ color: '#6c7a72', fontWeight: 400 }}>({c.totalResenas})</span>
                  </span>
                )}
                {c.distanciaKm != null && <span>{c.distanciaKm} km</span>}
                {!c.tieneHorarios ? (
                  <span className="etiqueta sinhorario">Sin horario</span>
                ) : (
                  <span className={`etiqueta ${c.abiertoAhora ? 'abierto' : 'cerrado'}`}>
                    {c.abiertoAhora ? 'Abierto' : 'Cerrado'}
                  </span>
                )}
              </div>
              <div className="servicios">{c.servicios.slice(0, 4).join(' · ')}</div>
            </article>
          ))}
        </div>
      </aside>

      <div className="mapa">
        <Mapa
          comercios={comercios}
          centro={centro}
          ubicacionUsuario={ubicacion}
          seleccionado={seleccionado}
          onSeleccionar={seleccionarDesdeMapa}
        />
      </div>
    </div>
  );
}
