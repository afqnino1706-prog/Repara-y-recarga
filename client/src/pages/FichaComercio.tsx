import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import type { Ficha } from '../tipos';

/** Ficha del comercio — HU-06 (RF05). Lectura pública, sin exigir sesión. */
export function FichaComercio() {
  const { id = '' } = useParams();
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFicha(null);
    setError(null);
    api
      .ficha(id)
      .then(setFicha)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <div className="pagina">
        <div className="alerta error">{error}</div>
        <Link className="btn" to="/">
          ← Volver al mapa
        </Link>
      </div>
    );
  }
  if (!ficha) return <div className="pagina cargando">Cargando la ficha…</div>;

  const hoy = new Date().getDay();
  const rutaMaps = `https://www.google.com/maps/dir/?api=1&destination=${ficha.lat},${ficha.lng}`;

  return (
    <div className="pagina">
      <Link className="btn pequeno" to="/" style={{ marginBottom: 14 }}>
        ← Volver al mapa
      </Link>

      <div className="ficha-portada">Fotografía de portada del establecimiento</div>

      <div className="ficha-cab">
        <div style={{ flex: 1, minWidth: 240 }}>
          <h1>{ficha.nombreComercial}</h1>
          <div className="meta" style={{ marginTop: 6, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span>
              {ficha.categoria.icono} {ficha.categoria.nombre}
            </span>
            {ficha.calificacionPromedio != null ? (
              <span className="estrella">
                ★ {ficha.calificacionPromedio}{' '}
                <span style={{ color: '#6c7a72', fontWeight: 400 }}>
                  ({ficha.totalResenas} {ficha.totalResenas === 1 ? 'reseña' : 'reseñas'})
                </span>
              </span>
            ) : (
              <span style={{ color: '#6c7a72' }}>Sin reseñas todavía</span>
            )}
            {!ficha.tieneHorarios ? (
              <span className="etiqueta sinhorario">Sin horario registrado</span>
            ) : (
              <span className={`etiqueta ${ficha.abiertoAhora ? 'abierto' : 'cerrado'}`}>
                {ficha.abiertoAhora ? 'Abierto ahora' : 'Cerrado ahora'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="ficha-grid">
        <div>
          {ficha.descripcion && (
            <div className="bloque">
              <h2>Sobre el taller</h2>
              <p style={{ margin: 0, lineHeight: 1.55 }}>{ficha.descripcion}</p>
            </div>
          )}

          <div className="bloque">
            <h2>Ubicación y contacto</h2>
            <p style={{ margin: '0 0 12px' }}>
              {ficha.direccion}
              <br />
              <span style={{ color: '#6c7a72' }}>{ficha.ciudad}</span>
            </p>
            <div className="botones">
              <a className="btn" href={rutaMaps} target="_blank" rel="noreferrer">
                🧭 Cómo llegar
              </a>
              {ficha.contacto.telefono && (
                <a className="btn" href={`tel:${ficha.contacto.telefono}`}>
                  📞 {ficha.contacto.telefono}
                </a>
              )}
              {ficha.contacto.whatsapp && (
                <a
                  className="btn"
                  href={`https://wa.me/${ficha.contacto.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  💬 WhatsApp
                </a>
              )}
              {ficha.contacto.correo && (
                <a className="btn" href={`mailto:${ficha.contacto.correo}`}>
                  ✉️ Correo
                </a>
              )}
            </div>
          </div>

          <div className="bloque">
            <h2>Objetos y servicios que repara</h2>
            {ficha.servicios.length ? (
              <div className="chips">
                {ficha.servicios.map((s) => (
                  <span key={s} className="chip" style={{ cursor: 'default' }}>
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, color: '#6c7a72' }}>El taller aún no registró sus servicios.</p>
            )}
          </div>

          <div className="bloque">
            <h2>
              Reseñas de usuarios{' '}
              <span style={{ color: '#6c7a72', fontWeight: 400 }}>({ficha.totalResenas})</span>
            </h2>
            {ficha.resenas.length === 0 && (
              <p style={{ margin: 0, color: '#6c7a72' }}>Este taller todavía no tiene reseñas.</p>
            )}
            {ficha.resenas.map((r) => (
              <div className="resena" key={r.id}>
                <div className="autor">
                  {r.usuario.nombre}{' '}
                  <span className="estrella">{'★'.repeat(r.calificacion)}</span>
                  <span style={{ color: '#c7d2cb' }}>{'★'.repeat(5 - r.calificacion)}</span>
                </div>
                {r.comentario && (
                  <p style={{ margin: '5px 0 0', lineHeight: 1.5 }}>{r.comentario}</p>
                )}
                {r.respuestaComercio && (
                  <div className="respuesta">
                    <strong>Respuesta del taller: </strong>
                    {r.respuestaComercio}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <aside>
          <div className="bloque">
            <h2>Horario semanal</h2>
            <table className="horario">
              <tbody>
                {ficha.horarioSemanal.map((d) => (
                  <tr key={d.dia} className={d.dia === hoy ? 'hoy' : ''}>
                    <td>
                      {d.nombre}
                      {d.dia === hoy && ' (hoy)'}
                    </td>
                    <td>
                      {d.franjas.length
                        ? d.franjas.map((f) => `${f.horaApertura}–${f.horaCierre}`).join('  /  ')
                        : 'Cerrado'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bloque">
            {/* Si el comercio no fue reclamado se oculta el formulario de cotización
                y se muestran los canales de contacto directo (criterio de HU-06). */}
            {ficha.reclamado ? (
              <>
                <h2>Solicitar cotización</h2>
                <p style={{ marginTop: 0, color: '#6c7a72', fontSize: 13.5 }}>
                  Este taller está verificado por {ficha.propietario?.nombre ?? 'su propietario'} y
                  responde solicitudes de presupuesto.
                </p>
                <button className="btn principal" style={{ width: '100%' }} disabled>
                  Solicitar cotización
                </button>
                <p className="pendiente" style={{ marginBottom: 0, marginTop: 10 }}>
                  El formulario de cotización (RF17) llega en el Sprint 2.
                </p>
              </>
            ) : (
              <>
                <h2>Contacto directo</h2>
                <p style={{ marginTop: 0, color: '#6c7a72', fontSize: 13.5 }}>
                  Este taller aún no ha sido reclamado por su propietario, así que no se puede
                  solicitar una cotización. Puedes contactarlo por estos canales:
                </p>
                <div className="botones">
                  {ficha.contacto.telefono && (
                    <a className="btn" href={`tel:${ficha.contacto.telefono}`}>
                      📞 Llamar
                    </a>
                  )}
                  {ficha.contacto.whatsapp && (
                    <a
                      className="btn"
                      href={`https://wa.me/${ficha.contacto.whatsapp}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      💬 WhatsApp
                    </a>
                  )}
                  {!ficha.contacto.telefono && !ficha.contacto.whatsapp && (
                    <span style={{ color: '#6c7a72' }}>Sin canales de contacto registrados.</span>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="bloque">
            <h2>¿Encontraste un error?</h2>
            <button className="btn pequeno" disabled>
              Reportar información errónea
            </button>
            <p className="pendiente" style={{ marginBottom: 0, marginTop: 10 }}>
              El reporte de inconsistencias (RF09) llega en el Sprint 2.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
