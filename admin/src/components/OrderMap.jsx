import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// react-leaflet doesn't ship default marker images, so we point Leaflet at
// the CDN copies. Without this, markers render as broken images.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const GEBETA_TILE = import.meta.env.VITE_GEBETA_TILE_URL || '';
const TILE_URL =
  GEBETA_TILE || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = GEBETA_TILE
  ? '&copy; <a href="https://gebeta.app">Gebeta Maps</a>'
  : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// Addis Ababa default centre — sensible for an Ethiopian-first product.
const FALLBACK_CENTRE = [9.0192, 38.7525];

export default function OrderMap({ orders }) {
  const located = orders.filter(
    (o) => Number.isFinite(o.lat) && Number.isFinite(o.lon)
  );

  const centre =
    located.length > 0 ? [located[0].lat, located[0].lon] : FALLBACK_CENTRE;

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
      <MapContainer
        center={centre}
        zoom={12}
        style={{ height: 360, width: '100%' }}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        {located.map((o) => (
          <Marker key={o.id} position={[o.lat, o.lon]}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{o.id}</div>
                <div className="text-slate-500 text-xs">{o.address}</div>
                <div className="mt-1">
                  <span className="font-semibold">
                    {o.total?.toFixed?.(0) ?? o.total} ETB
                  </span>{' '}
                  · {o.status}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {located.length === 0 && (
        <div className="px-4 py-3 text-xs text-slate-500">
          No orders with map coordinates yet. Orders are plotted once the
          backend can geocode the customer address (set <code>GEBETA_API_KEY</code>).
        </div>
      )}
    </div>
  );
}
