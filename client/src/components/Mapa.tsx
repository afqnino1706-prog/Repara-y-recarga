import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import type { ComercioResumen } from '../tipos';

// Centro por defecto cuando el usuario deniega la geolocalización (criterio de HU-02).
export const CENTRO_BOGOTA: [number, number] = [4.6486, -74.0628];

/** Pin dibujado con CSS: evita depender de los iconos de imagen de Leaflet. */
const pin = (clases: string) =>
  L.divIcon({
    className: '',
    html: `<div class="pin ${clases}"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -22],
  });

function Recentrar({ centro }: { centro: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(centro, map.getZoom());
  }, [centro, map]);
  return null;
}

/**
 * Leaflet calcula el tamaño del lienzo al montarse, antes de que el layout de
 * CSS grid haya asignado su altura definitiva, y las teselas quedan recortadas.
 * Este componente lo recalcula al montar y ante cada cambio de tamaño.
 */
function AjustarTamano() {
  const map = useMap();
  useEffect(() => {
    const recalcular = () => map.invalidateSize();
    const t = setTimeout(recalcular, 0);
    const observador = new ResizeObserver(recalcular);
    observador.observe(map.getContainer());
    return () => {
      clearTimeout(t);
      observador.disconnect();
    };
  }, [map]);
  return null;
}

interface Props {
  comercios: ComercioResumen[];
  centro: [number, number];
  ubicacionUsuario: [number, number] | null;
  seleccionado: string | null;
  onSeleccionar: (id: string) => void;
}

export function Mapa({ comercios, centro, ubicacionUsuario, seleccionado, onSeleccionar }: Props) {
  return (
    <MapContainer center={centro} zoom={13} scrollWheelZoom className="leaflet-container">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <AjustarTamano />
      <Recentrar centro={centro} />

      {ubicacionUsuario && (
        <Marker position={ubicacionUsuario} icon={pin('sel')}>
          <Popup>Tu ubicación actual</Popup>
        </Marker>
      )}

      {comercios.map((c) => (
        <Marker
          key={c.id}
          position={[c.lat, c.lng]}
          icon={pin(
            `${c.abiertoAhora ? '' : 'cerrado'} ${seleccionado === c.id ? 'sel' : ''}`.trim()
          )}
          eventHandlers={{ click: () => onSeleccionar(c.id) }}
        >
          {/* Tarjeta emergente: nombre, categoría, calificación y enlace directo (criterio de HU-02). */}
          <Popup>
            <strong style={{ fontSize: 14 }}>{c.nombreComercial}</strong>
            <br />
            <span style={{ color: '#6c7a72' }}>
              {c.categoria.icono} {c.categoria.nombre}
            </span>
            <br />
            <span className="estrella">
              {c.calificacionPromedio ? `★ ${c.calificacionPromedio}` : 'Sin reseñas'}
            </span>
            {c.calificacionPromedio ? (
              <span style={{ color: '#6c7a72' }}> ({c.totalResenas})</span>
            ) : null}
            <br />
            <Link to={`/comercio/${c.id}`} style={{ fontWeight: 700 }}>
              Ver ficha completa →
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
