"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#d9f0ec'/><stop offset='1' stop-color='#f3efe9'/></linearGradient></defs><rect width='800' height='600' fill='url(#g)'/><g fill='none' stroke='#0f766e' stroke-width='14' stroke-linecap='round' stroke-linejoin='round' opacity='.35'><path d='M250 330 400 210l150 120'/><path d='M290 310v150h220V310'/></g></svg>`,
  );

export function SmartImage({ src, alt, className, ...rest }: Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & { src?: string | null }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // Si la imagen falló antes de hidratar, onError no se dispara: lo comprobamos manualmente.
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0 && src) setFailed(true);
  }, [src]);
  const url = !src || failed ? PLACEHOLDER : src;
  return <img ref={ref} src={url} alt={alt ?? ""} loading="lazy" onError={() => setFailed(true)} className={cn("object-cover", className)} {...rest} />;
}

export { PLACEHOLDER as IMAGE_PLACEHOLDER };
