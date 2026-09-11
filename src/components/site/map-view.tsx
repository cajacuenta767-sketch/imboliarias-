"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { useCurrency } from "@/lib/hooks/use-currency";
import { IMAGE_PLACEHOLDER } from "@/components/ui/smart-image";

export type MapPoint = {
  id: string; slug: string; title: string; price: number; currencyCode: string; type: string; period?: string | null; lat: number | null; lng: number | null;
  bedrooms?: number | null; bathrooms?: number | null; area?: number | null; images?: { url: string }[]; city?: { name: string } | null;
};

const TILES = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

/** Los textos del popup los escribe el agente: se escapan antes de inyectarlos como HTML. */
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
const safeUrl = (u: string | undefined) => (u && /^(https?:\/\/|\/)/.test(u) && !/^\/\//.test(u) ? u : IMAGE_PLACEHOLDER);
const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

export function MapView({ points, center, zoom = 12, className, single, onBoundsChange, activeId, height = "100%", labels }: {
  points: MapPoint[]; center?: [number, number]; zoom?: number; className?: string; single?: boolean; onBoundsChange?: (bbox: string) => void; activeId?: string | null; height?: string;
  labels?: { perMonth: string; bedrooms: string; bathrooms: string };
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.MarkerClusterGroup | L.LayerGroup | null>(null);
  const { price } = useCurrency();
  const priceRef = useRef(price);
  priceRef.current = price;
  // El callback se guarda en un ref para que el mapa use siempre la versión más reciente (evita cierres obsoletos).
  const boundsRef = useRef(onBoundsChange);
  boundsRef.current = onBoundsChange;
  const programmatic = useRef(false);
  const l = { perMonth: "/mes", bedrooms: "hab", bathrooms: "baños", ...labels };
  const pointsKey = points.map((p) => `${p.id}:${p.lat},${p.lng}:${p.price}`).join("|");
  const centerKey = center ? `${center[0]},${center[1]}` : "";

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { scrollWheelZoom: !single, zoomControl: true });
    L.tileLayer(TILES, { attribution: ATTR, maxZoom: 19 }).addTo(map);
    mapRef.current = map;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (onBoundsChange) {
      // Solo reaccionamos a movimientos del usuario (arrastrar/zoom), no a fitBounds programático.
      const emit = () => {
        if (programmatic.current) return;
        clearTimeout(timer);
        timer = setTimeout(() => {
          const b = map.getBounds();
          boundsRef.current?.(`${b.getSouth().toFixed(4)},${b.getWest().toFixed(4)},${b.getNorth().toFixed(4)},${b.getEast().toFixed(4)}`);
        }, 500);
      };
      map.on("dragend", emit);
      map.on("zoomend", emit);
    }
    return () => {
      clearTimeout(timer);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (layerRef.current) map.removeLayer(layerRef.current);
    const valid = points.filter((p) => p.lat != null && p.lng != null);
    const group: L.MarkerClusterGroup | L.LayerGroup = single
      ? L.layerGroup()
      : L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 50,
          iconCreateFunction: (c) => L.divIcon({ html: `<div class="marker-cluster-custom" style="width:40px;height:40px">${c.getChildCount()}</div>`, className: "", iconSize: [40, 40] }),
        });
    valid.forEach((p) => {
      const label = single ? "●" : priceRef.current(p.price, p.currencyCode, { compact: true });
      const icon = L.divIcon({ html: `<div class="price-marker ${p.type === "RENT" ? "rent" : ""} ${p.id === activeId ? "active" : ""}">${label}</div>`, className: "", iconSize: [0, 0] });
      const m = L.marker([p.lat!, p.lng!], { icon });
      if (!single) {
        const img = safeUrl(p.images?.[0]?.url);
        m.bindPopup(
          `<a href="/propiedades/${encodeURIComponent(p.slug)}" style="display:block;text-decoration:none;color:inherit">
            <img src="${esc(img)}" onerror="this.onerror=null;this.src='${IMAGE_PLACEHOLDER}'" style="width:100%;height:120px;object-fit:cover" alt="" />
            <div style="padding:10px 12px">
              <div style="font-weight:800;font-size:14px;line-height:1.2">${esc(p.title)}</div>
              <div style="font-size:12px;color:#6b7280;margin-top:2px">${esc(p.city?.name ?? "")}</div>
              <div style="margin-top:6px;font-weight:800;color:#0f766e">${esc(priceRef.current(p.price, p.currencyCode))} <span style="font-weight:600;color:#6b7280;font-size:11px">${p.type === "RENT" ? esc(l.perMonth) : ""}</span></div>
              <div style="font-size:11px;color:#6b7280;margin-top:4px">${esc([p.bedrooms ? `${p.bedrooms} ${l.bedrooms}` : "", p.bathrooms ? `${p.bathrooms} ${l.bathrooms}` : "", p.area ? `${p.area} m²` : ""].filter(Boolean).join(" · "))}</div>
            </div>
          </a>`,
          { closeButton: true, minWidth: 240 },
        );
      }
      group.addLayer(m);
    });
    group.addTo(map);
    layerRef.current = group;

    programmatic.current = true;
    if (center) map.setView(center, zoom);
    else if (valid.length > 0) {
      const bounds = L.latLngBounds(valid.map((p) => [p.lat!, p.lng!] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    } else map.setView([4.6, -74.1], 5);
    const t = setTimeout(() => { programmatic.current = false; }, 800);
    return () => clearTimeout(t);
    // Se compara por contenido (ids/centro) para no reconstruir los marcadores en cada render del padre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointsKey, centerKey, zoom, single, activeId]);

  return <div ref={ref} className={className} style={{ height, width: "100%" }} role="region" aria-label="Mapa de propiedades" />;
}
