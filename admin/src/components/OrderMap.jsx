import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * Renders order pins on a Gebeta-tiled MapLibre map.
 *
 * Gebeta's tile server requires the same apiKey query parameter as the REST
 * APIs. The MapLibre style URL itself is open, but the tile/sprite/glyph URLs
 * it references are key-protected — so we use `transformRequest` to append
 * the key to every request hitting gebeta.app.
 *
 * If VITE_GEBETA_API_KEY is unset, we fall back to the OSM raster style so
 * the page is still usable in dev / before keys are wired up.
 */

const GEBETA_API_KEY = import.meta.env.VITE_GEBETA_API_KEY || '';
const GEBETA_STYLE_URL =
  import.meta.env.VITE_GEBETA_STYLE_URL ||
  'https://tiles.gebeta.app/styles/standard/style.json';

// Plain OSM raster fallback expressed as an inline MapLibre style so we don't
// need a separate tile library.
const OSM_FALLBACK_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

const FALLBACK_CENTRE = [38.7525, 9.0192]; // Addis Ababa [lng, lat]

export default function OrderMap({ orders }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  // Init the map once.
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const useGebeta = Boolean(GEBETA_API_KEY);

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: useGebeta ? GEBETA_STYLE_URL : OSM_FALLBACK_STYLE,
      center: FALLBACK_CENTRE,
      zoom: 11,
      attributionControl: false,
      // Inject the API key on every Gebeta request.
      transformRequest: useGebeta
        ? (url) => {
            if (!url.includes('gebeta.app')) return { url };
            const sep = url.includes('?') ? '&' : '?';
            return { url: `${url}${sep}apiKey=${GEBETA_API_KEY}` };
          }
        : undefined,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: useGebeta
          ? '© <a href="https://gebeta.app" target="_blank" rel="noopener">Gebeta Maps</a>'
          : '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
      })
    );

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Re-render markers whenever orders change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Wipe the existing marker set.
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const located = orders.filter(
      (o) => Number.isFinite(o.lat) && Number.isFinite(o.lon)
    );

    located.forEach((o) => {
      const el = document.createElement('div');
      el.className =
        'rounded-full w-6 h-6 bg-orange-500 border-2 border-white shadow-lg ring-2 ring-orange-300/40';

      const popup = new maplibregl.Popup({ offset: 14 }).setHTML(`
        <div style="font: 13px Inter, system-ui, sans-serif">
          <div style="font-weight:700">${o.id}</div>
          <div style="color:#64748b; font-size:11px">${escapeHtml(o.address || '—')}</div>
          <div style="margin-top:4px">
            <strong>${Number(o.total).toFixed(0)} ETB</strong> · ${o.status}
          </div>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([o.lon, o.lat])
        .setPopup(popup)
        .addTo(map);
      markersRef.current.push(marker);
    });

    // Fit to bounds if we have at least one located order.
    if (located.length === 1) {
      map.flyTo({ center: [located[0].lon, located[0].lat], zoom: 13 });
    } else if (located.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      located.forEach((o) => bounds.extend([o.lon, o.lat]));
      map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
    }
  }, [orders]);

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
      <div ref={containerRef} style={{ height: 360, width: '100%' }} />
      {orders.filter((o) => Number.isFinite(o.lat) && Number.isFinite(o.lon))
        .length === 0 && (
        <div className="px-4 py-3 text-xs text-slate-500">
          No orders with map coordinates yet. The backend geocodes addresses
          when <code>GEBETA_API_KEY</code> is set; until then pins won't render.
        </div>
      )}
    </div>
  );
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
