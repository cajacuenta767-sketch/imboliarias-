"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export function MapPicker({ lat, lng, onChange, fallback = [4.711, -74.0721] }: { lat?: number | null; lng?: number | null; onChange: (lat: number, lng: number) => void; fallback?: [number, number] }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current).setView(lat != null && lng != null ? [lat, lng] : fallback, lat != null ? 15 : 6);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", { attribution: "&copy; OpenStreetMap &copy; CARTO", maxZoom: 19 }).addTo(map);
    const icon = L.divIcon({ html: `<div class="price-marker">📍</div>`, className: "", iconSize: [0, 0] });
    const place = (la: number, ln: number) => {
      if (markerRef.current) markerRef.current.setLatLng([la, ln]);
      else markerRef.current = L.marker([la, ln], { icon, draggable: true }).addTo(map).on("dragend", (e) => { const p = (e.target as L.Marker).getLatLng(); cb.current(p.lat, p.lng); });
    };
    if (lat != null && lng != null) place(lat, lng);
    map.on("click", (e) => { place(e.latlng.lat, e.latlng.lng); cb.current(e.latlng.lat, e.latlng.lng); });
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || lat == null || lng == null) return;
    if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
    else {
      const icon = L.divIcon({ html: `<div class="price-marker">📍</div>`, className: "", iconSize: [0, 0] });
      markerRef.current = L.marker([lat, lng], { icon, draggable: true }).addTo(map).on("dragend", (e) => { const p = (e.target as L.Marker).getLatLng(); cb.current(p.lat, p.lng); });
      map.setView([lat, lng], 15);
    }
  }, [lat, lng]);

  return <div ref={ref} className="h-[320px] w-full overflow-hidden rounded-2xl border border-line" />;
}
