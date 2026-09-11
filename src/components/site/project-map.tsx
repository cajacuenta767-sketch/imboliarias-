"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/site/map-view").then((m) => m.MapView), { ssr: false });

export function ProjectMap({ lat, lng, name, slug }: { lat: number; lng: number; name: string; slug: string }) {
  return (
    <div className="h-[360px] overflow-hidden rounded-3xl border border-line">
      <MapView single points={[{ id: slug, slug, title: name, price: 0, currencyCode: "USD", type: "SALE", lat, lng }]} center={[lat, lng]} zoom={15} />
    </div>
  );
}
