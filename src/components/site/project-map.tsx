"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

const MapView = dynamic(() => import("@/components/site/map-view").then((m) => m.MapView), { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-muted" /> });

export function ProjectMap({ lat, lng, name, slug }: { lat: number; lng: number; name: string; slug: string }) {
  const points = useMemo(() => [{ id: slug, slug, title: name, price: 0, currencyCode: "USD", type: "SALE", lat, lng }], [slug, name, lat, lng]);
  const center = useMemo<[number, number]>(() => [lat, lng], [lat, lng]);
  return (
    <div className="h-[260px] overflow-hidden rounded-3xl border border-line sm:h-[360px]">
      <MapView single points={points} center={center} zoom={15} />
    </div>
  );
}
