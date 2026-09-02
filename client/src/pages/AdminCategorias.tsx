import { useEffect, useState } from 'react';
import { api, ErrorApi } from '../api';
import { useSesion } from '../sesion';
import type { Categoria } from '../tipos';

type Aviso = { tipo: 'ok' | 'error'; texto: string; detalle?: string } | null;

/** Gestión de categorías — HU-03 (RF19). Exclusivo del rol Administrador. */
export function AdminCategorias() {
  const { usuario } = useSesion();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [aviso, setAviso] = useState<Aviso>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [icono, setIcono] = useState('');
  const [editando, setEditando] = useState<string | null>(null);
  const [edicion, setEdicion] = useState({ icono: '', nombre: '', descripcion: '' });

  const cargar = () => api.categorias(true).then(setCategorias).catch(() => setCategorias([]));

  useEffect(() => {
    void cargar();
  }, []);

  const esAdmin = usuario?.rol === 'ADMIN';

  const manejarError = (e: unknown) => {
    const err = e as ErrorApi;
    setAviso({ tipo: 'error', texto: err.message, detalle: err.detalle });
  };

  const crear = async () => {
    try {
      await api.crearCategoria({ nombre, descripcion, icono });
      setAviso({ tipo: 'ok', texto: `Categoría "${nombre}" creada.` });
      setNombre('');
      setDescripcion('');
      setIcono('');
      await cargar();
    } catch (e) {
      manejarError(e);
    }
  };

  const abrirEdicion = (c: Categoria) => {
    setEditando(c.id);
    setEdicion({
      icono: c.icono ?? '',
      nombre: c.nombre,
      descripcion: c.descripcion ?? '',
    });
  };

  const guardarEdicion = async (id: string) => {
    try {
      // Se envían los tres campos: el servidor solo actualiza los que recibe.
      await api.editarCategoria(id, edicion);
      setAviso({ tipo: 'ok', texto: 'Categoría actualizada.' });
      setEditando(null);
      await cargar();
    } catch (e) {
      manejarError(e);
    }
  };

  const alternarEstado = async (c: Categoria) => {
    try {
      await api.estadoCategoria(c.id, !c.activa);
      setAviso({
        tipo: 'ok',
        texto: `"${c.nombre}" quedó ${!c.activa ? 'activa' : 'desactivada'}.`,
      });
      await cargar();
    } catch (e) {
      manejarError(e);
    }
  };

  const eliminar = async (c: Categoria) => {
    if (!confirm(`¿Eliminar la categoría "${c.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.eliminarCategoria(c.id);
      setAviso({ tipo: 'ok', texto: `Categoría "${c.nombre}" eliminada.` });
      await cargar();
    } catch (e) {
      manejarError(e);
    }
  };

  return (
    <div className="pagina">
      <div className="cabecera-pagina">
        <div className="eyebrow">HU-03 · RF19</div>
        <h1>Gestión de categorías</h1>
        <p>
          Catálogo de categorías de reparación. Los cambios se reflejan de inmediato en el filtro
          de la pantalla principal.
        </p>
      </div>

      {!esAdmin && (
        <div className="alerta info">
          Esta sección es exclusiva del rol <strong>Administrador</strong>. Cambia la sesión
          simulada a <strong>Camila Ordóñez (ADMIN)</strong> en la barra superior para poder
          editar. Mientras tanto puedes ver el catálogo en modo consulta.
        </div>
      )}

      {aviso && (
        <div className={`alerta ${aviso.tipo}`}>
          {aviso.texto}
          {aviso.detalle && <div style={{ marginTop: 4, fontSize: 12.5 }}>{aviso.detalle}</div>}
        </div>
      )}

      {esAdmin && (
        <div className="bloque">
          <h2>Nueva categoría</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 2fr auto', gap: 10, alignItems: 'end' }}>
            <div className="campo" style={{ marginBottom: 0 }}>
              <label htmlFor="c-icono">Icono</label>
              <input id="c-icono" value={icono} onChange={(e) => setIcono(e.target.value)} placeholder="🔧" />
            </div>
            <div className="campo" style={{ marginBottom: 0 }}>
              <label htmlFor="c-nombre">Nombre</label>
              <input id="c-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="campo" style={{ marginBottom: 0 }}>
              <label htmlFor="c-desc">Descripción</label>
              <input id="c-desc" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            </div>
            <button className="btn principal" onClick={crear} disabled={!nombre.trim()}>
              Crear
            </button>
          </div>
        </div>
      )}

      <table className="datos">
        <thead>
          <tr>
            <th style={{ width: 50 }}></th>
            <th>Categoría</th>
            <th>Descripción</th>
            <th style={{ width: 110, textAlign: 'center' }}>Comercios</th>
            <th style={{ width: 100, textAlign: 'center' }}>Estado</th>
            {esAdmin && <th style={{ width: 250 }}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {categorias.map((c) => (
            <tr key={c.id}>
              <td style={{ fontSize: 20, textAlign: 'center' }}>
                {editando === c.id ? (
                  <input
                    value={edicion.icono}
                    onChange={(e) => setEdicion({ ...edicion, icono: e.target.value })}
                    style={{ width: '100%', textAlign: 'center' }}
                    aria-label="Icono"
                  />
                ) : (
                  c.icono
                )}
              </td>
              <td>
                {editando === c.id ? (
                  <input
                    value={edicion.nombre}
                    onChange={(e) => setEdicion({ ...edicion, nombre: e.target.value })}
                    style={{ width: '100%' }}
                    aria-label="Nombre de la categoría"
                  />
                ) : (
                  <strong style={{ color: '#1b4332' }}>{c.nombre}</strong>
                )}
              </td>
              <td style={{ color: '#6c7a72', fontSize: 13.5 }}>
                {editando === c.id ? (
                  <input
                    value={edicion.descripcion}
                    onChange={(e) => setEdicion({ ...edicion, descripcion: e.target.value })}
                    style={{ width: '100%' }}
                    aria-label="Descripción de la categoría"
                  />
                ) : (
                  c.descripcion
                )}
              </td>
              <td style={{ textAlign: 'center', fontWeight: 700 }}>{c.totalComercios}</td>
              <td style={{ textAlign: 'center' }}>
                <span className={`etiqueta ${c.activa ? 'abierto' : 'cerrado'}`}>
                  {c.activa ? 'Activa' : 'Inactiva'}
                </span>
              </td>
              {esAdmin && (
                <td>
                  <div className="botones">
                    {editando === c.id ? (
                      <>
                        <button className="btn pequeno" onClick={() => void guardarEdicion(c.id)}>
                          Guardar
                        </button>
                        <button className="btn pequeno" onClick={() => setEditando(null)}>
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="btn pequeno" onClick={() => abrirEdicion(c)}>
                          Editar
                        </button>
                        <button className="btn pequeno" onClick={() => void alternarEstado(c)}>
                          {c.activa ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          className="btn pequeno peligro"
                          onClick={() => void eliminar(c)}
                          title={
                            c.totalComercios > 0
                              ? 'No se puede eliminar: tiene comercios asociados'
                              : 'Eliminar'
                          }
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ color: '#6c7a72', fontSize: 13, marginTop: 14 }}>
        Una categoría con comercios asociados no se puede eliminar: primero hay que reasignarlos.
        Desactivarla la retira del filtro público sin borrar el histórico.
      </p>
    </div>
  );
}
