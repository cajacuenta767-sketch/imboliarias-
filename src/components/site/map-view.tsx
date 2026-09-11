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
const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

export function MapView({ points, center, zoom = 12, className, single, onBoundsChange, activeId, height = "100%" }: {
  points: MapPoint[]; center?: [number, number]; zoom?: number; className?: string; single?: boolean; onBoundsChange?: (bbox: string) => void; activeId?: string | null; height?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.MarkerClusterGroup | L.LayerGroup | null>(null);
  const { price } = useCurrency();
  const priceRef = useRef(price);
  priceRef.current = price;
  const programmatic = useRef(false);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { scrollWheelZoom: !single, zoomControl: true });
    L.tileLayer(TILES, { attribution: ATTR, maxZoom: 19 }).addTo(map);
    mapRef.current = map;
    if (onBoundsChange) {
      // Solo reaccionamos a movimientos del usuario (arrastrar/zoom), no a fitBounds programático.
      let timer: ReturnType<typeof setTimeout> | undefined;
      const emit = () => {
        if (programmatic.current) return;
        clearTimeout(timer);
        timer = setTimeout(() => {
          const b = map.getBounds();
          onBoundsChange(`${b.getSouth().toFixed(4)},${b.getWest().toFixed(4)},${b.getNorth().toFixed(4)},${b.getEast().toFixed(4)}`);
        }, 500);
      };
      map.on("dragend", emit);
      map.on("zoomend", emit);
    }
    return () => {
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
        const img = p.images?.[0]?.url ?? IMAGE_PLACEHOLDER;
        m.bindPopup(
          `<a href="/propiedades/${p.slug}" style="display:block;text-decoration:none;color:inherit">
            <img src="${img}" onerror="this.src='${IMAGE_PLACEHOLDER}'" style="width:100%;height:120px;object-fit:cover" alt="" />
            <div style="padding:10px 12px">
              <div style="font-weight:800;font-size:14px;line-height:1.2">${p.title}</div>
              <div style="font-size:12px;color:#6b7280;margin-top:2px">${p.city?.name ?? ""}</div>
              <div style="margin-top:6px;font-weight:800;color:#0f766e">${priceRef.current(p.price, p.currencyCode)} <span style="font-weight:600;color:#6b7280;font-size:11px">${p.type === "RENT" ? "/mes" : ""}</span></div>
              <div style="font-size:11px;color:#6b7280;margin-top:4px">${[p.bedrooms ? `${p.bedrooms} hab` : "", p.bathrooms ? `${p.bathrooms} baños` : "", p.area ? `${p.area} m²` : ""].filter(Boolean).join(" · ")}</div>
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
    setTimeout(() => { programmatic.current = false; }, 800);
  }, [points, center, zoom, single, activeId]);

  return <div ref={ref} className={className} style={{ height, width: "100%" }} />;
}
