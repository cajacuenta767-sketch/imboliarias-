"use client";

import { useEffect, useRef, useState } from "react";
import { cn, initials } from "@/lib/utils";

export function Avatar({ src, name, className, size = "md" }: { src?: string | null; name: string; className?: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0 && src) setFailed(true);
  }, [src]);
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-base", xl: "h-24 w-24 text-2xl" };
  if (src && !failed) return <img ref={ref} src={src} alt={name} onError={() => setFailed(true)} className={cn("rounded-full object-cover ring-2 ring-white", sizes[size], className)} />;
  return (
    <span className={cn("inline-flex items-center justify-center rounded-full bg-brand-soft font-bold text-brand-strong ring-2 ring-white", sizes[size], className)}>
      {initials(name)}
    </span>
  );
}
