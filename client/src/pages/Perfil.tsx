import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ErrorApi } from '../api';
import { useSesion } from '../sesion';
import type { Perfil as TPerfil } from '../tipos';

type Aviso = { tipo: 'ok' | 'error'; texto: string; lista?: string[] } | null;

/** Perfil de usuario — HU-01 (RF16). */
export function Perfil() {
  const { usuario, recargar } = useSesion();
  const [perfil, setPerfil] = useState<TPerfil | null>(null);
  const [aviso, setAviso] = useState<Aviso>(null);

  const [nombre, setNombre] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [passActual, setPassActual] = useState('');
  const [passNueva, setPassNueva] = useState('');

  const cargar = () =>
    api
      .perfil()
      .then((p) => {
        setPerfil(p);
        setNombre(p.usuario.nombre);
        setCiudad(p.usuario.ciudad ?? '');
      })
      .catch(() => setPerfil(null));

  useEffect(() => {
    if (usuario) void cargar();
    else setPerfil(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.id]);

  // El acceso al perfil exige sesión iniciada (criterio de HU-01).
  if (!usuario) {
    return (
      <div className="pagina">
        <div className="cabecera-pagina">
          <div className="eyebrow">HU-01 · RF16</div>
          <h1>Perfil de usuario</h1>
        </div>
        <div className="alerta info">
          Necesitas una sesión iniciada para ver tu perfil. Selecciona un usuario en el conmutador
          de la barra superior.
        </div>
      </div>
    );
  }

  if (!perfil) return <div className="pagina cargando">Cargando el perfil…</div>;

  const guardarDatos = async () => {
    try {
      const r = await api.editarPerfil({ nombre, ciudad });
      setAviso({ tipo: 'ok', texto: r.mensaje });
      await cargar();
      await recargar();
    } catch (e) {
      const err = e as ErrorApi;
      setAviso({ tipo: 'error', texto: err.message, lista: err.errores });
    }
  };

  const cambiarPassword = async () => {
    try {
      const r = await api.cambiarPassword({
        passwordActual: passActual,
        passwordNueva: passNueva,
      });
      setAviso({ tipo: 'ok', texto: r.mensaje });
      setPassActual('');
      setPassNueva('');
    } catch (e) {
      const err = e as ErrorApi;
      setAviso({ tipo: 'error', texto: err.message, lista: err.errores });
    }
  };

  const s = perfil.secciones;

  return (
    <div className="pagina">
      <div className="cabecera-pagina">
        <div className="eyebrow">HU-01 · RF16</div>
        <h1>Perfil de usuario</h1>
        <p>
          {perfil.usuario.correo} · <span className="insignia-rol">{perfil.usuario.rol}</span>
        </p>
      </div>

      {aviso && (
        <div className={`alerta ${aviso.tipo}`}>
          {aviso.texto}
          {aviso.lista && (
            <ul>
              {aviso.lista.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="ficha-grid">
        <div>
          <div className="bloque">
            <h2>Datos personales</h2>
            <div className="campo">
              <label htmlFor="p-nombre">Nombre</label>
              <input id="p-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor="p-ciudad">Ciudad</label>
              <input id="p-ciudad" value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor="p-correo">Correo electrónico</label>
              <input id="p-correo" value={perfil.usuario.correo} disabled />
              <div className="ayuda">
                Cambiar el correo exige confirmar la contraseña actual. Disponible desde la API
                (<code>PUT /api/perfil/correo</code>).
              </div>
            </div>
            <button className="btn oscuro" onClick={guardarDatos}>
              Guardar cambios
            </button>
          </div>

          <div className="bloque">
            <h2>Cambiar contraseña</h2>
            <div className="campo">
              <label htmlFor="p-actual">Contraseña actual</label>
              <input
                id="p-actual"
                type="password"
                value={passActual}
                onChange={(e) => setPassActual(e.target.value)}
              />
            </div>
            <div className="campo">
              <label htmlFor="p-nueva">Contraseña nueva</label>
              <input
                id="p-nueva"
                type="password"
                value={passNueva}
                onChange={(e) => setPassNueva(e.target.value)}
              />
              <div className="ayuda">
                Mínimo 8 caracteres, al menos un número y al menos una letra mayúscula.
              </div>
            </div>
            <button
              className="btn oscuro"
              onClick={cambiarPassword}
              disabled={!passActual || !passNueva}
            >
              Actualizar contraseña
            </button>
          </div>

          <div className="bloque">
            <h2>Eliminar cuenta</h2>
            <p style={{ marginTop: 0, color: '#6c7a72', fontSize: 13.5 }}>
              Elimina la cuenta y toda la información asociada a ella. La acción es irreversible y
              exige una confirmación explícita.
            </p>
            <button className="btn peligro" disabled>
              Eliminar mi cuenta
            </button>
            <p className="pendiente" style={{ marginTop: 10, marginBottom: 0 }}>
              Deshabilitado en el prototipo para no perder los datos de demostración. El endpoint
              (<code>DELETE /api/perfil</code>) está implementado y probado.
            </p>
          </div>
        </div>

        <aside>
          <div className="bloque">
            <h2>{s.resenas.titulo}</h2>
            {s.resenas.items.length === 0 && (
              <p style={{ margin: 0, color: '#6c7a72' }}>Todavía no has publicado reseñas.</p>
            )}
            {s.resenas.items.map((r) => (
              <div className="resena" key={r.id}>
                <div className="autor">
                  <Link to={`/comercio/${r.comercio.id}`}>{r.comercio.nombreComercial}</Link>{' '}
                  <span className="estrella">{'★'.repeat(r.calificacion)}</span>
                </div>
                {r.comentario && (
                  <p style={{ margin: '4px 0 0', fontSize: 13.5 }}>{r.comentario}</p>
                )}
              </div>
            ))}
          </div>

          <div className="bloque">
            <h2>{s.propuestas.titulo}</h2>
            {s.propuestas.items.length === 0 && (
              <p style={{ margin: 0, color: '#6c7a72' }}>No has propuesto comercios.</p>
            )}
            {s.propuestas.items.map((p) => (
              <div
                key={p.id}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', gap: 10 }}
              >
                <span style={{ fontSize: 13.5 }}>{p.nombreComercial}</span>
                <span
                  className={`etiqueta ${p.estado === 'APROBADO' ? 'abierto' : p.estado === 'RECHAZADO' ? 'cerrado' : 'sinhorario'}`}
                >
                  {p.estado}
                </span>
              </div>
            ))}
          </div>

          <div className="bloque">
            <h2>{s.favoritos.titulo}</h2>
            {s.favoritos.items.map((f) => (
              <div key={f.id} style={{ padding: '5px 0', fontSize: 13.5 }}>
                <Link to={`/comercio/${f.id}`}>{f.nombreComercial}</Link>
              </div>
            ))}
            <p className="pendiente" style={{ marginTop: 10, marginBottom: 0 }}>
              La gestión de favoritos ({s.favoritos.disponibleEn}) llega en el Sprint 2. Aquí solo
              se listan los datos de demostración.
            </p>
          </div>

          <div className="bloque">
            <h2>{s.historial.titulo}</h2>
            <p className="pendiente" style={{ margin: 0 }}>
              El historial de reparaciones ({s.historial.disponibleEn}) llega en el Sprint 2.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
