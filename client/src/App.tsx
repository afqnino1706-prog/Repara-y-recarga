import { NavLink, Route, Routes } from 'react-router-dom';
import { Explorar } from './pages/Explorar';
import { FichaComercio } from './pages/FichaComercio';
import { Perfil } from './pages/Perfil';
import { AdminCategorias } from './pages/AdminCategorias';
import { useSesion } from './sesion';

function SelectorSesion() {
  const { usuario, disponibles, cambiar } = useSesion();
  return (
    <select
      className="selector-sesion"
      value={usuario?.correo ?? ''}
      onChange={(e) => cambiar(e.target.value || null)}
      aria-label="Usuario de la sesión simulada"
    >
      <option value="">Sin sesión (visitante)</option>
      {disponibles.map((u) => (
        <option key={u.id} value={u.correo}>
          {u.nombre} · {u.rol}
        </option>
      ))}
    </select>
  );
}

export function App() {
  const { usuario, modoDemo } = useSesion();
  const clase = ({ isActive }: { isActive: boolean }) => (isActive ? 'activo' : '');

  return (
    <div className="app">
      <header className="barra">
        <div className="marca">
          Repara <span>y</span> Recarga
        </div>
        <nav>
          <NavLink to="/" className={clase} end>
            Explorar
          </NavLink>
          <NavLink to="/perfil" className={clase}>
            Mi perfil
          </NavLink>
          <NavLink to="/admin/categorias" className={clase}>
            Categorías
          </NavLink>
        </nav>
        <div className="derecha">
          {usuario && <span className="insignia-rol">{usuario.rol}</span>}
          <SelectorSesion />
        </div>
      </header>

      <div className="aviso-sprint">
        <strong>Prototipo del Sprint 1</strong> · La sesión es simulada: la autenticación real
        (RF06) llega en el Sprint 2.
        {modoDemo && (
          <>
            {' '}Demostración pública: las acciones irreversibles están deshabilitadas.
          </>
        )}
      </div>

      <main className="contenido">
        <Routes>
          <Route path="/" element={<Explorar />} />
          <Route path="/comercio/:id" element={<FichaComercio />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/admin/categorias" element={<AdminCategorias />} />
          <Route
            path="*"
            element={
              <div className="pagina">
                <h1>Página no encontrada</h1>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
