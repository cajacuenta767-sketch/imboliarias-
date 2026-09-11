"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Images, X, Play, Map as MapIcon } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { useDialog } from "@/lib/hooks/use-dialog";
import { cn } from "@/lib/utils";

export function Gallery({ images, title, hasVideo, onVideo, onMap }: { images: { url: string; alt?: string | null }[]; title: string; hasVideo?: boolean; onVideo?: () => void; onMap?: () => void }) {
  const t = useTranslations("property");
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const imgs = images.length ? images : [{ url: "", alt: title }];

  const lightboxRef = useDialog(open, () => setOpen(false));
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % imgs.length);
      if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + imgs.length) % imgs.length);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, imgs.length]);

  const show = (i: number) => {
    setIdx(i);
    setOpen(true);
  };

  return (
    <>
      <div className="relative grid gap-2 overflow-hidden rounded-3xl sm:grid-cols-4 sm:grid-rows-2" style={{ height: "clamp(260px, 52vw, 520px)" }}>
        <button type="button" onClick={() => show(0)} className="relative col-span-2 row-span-2 h-full overflow-hidden focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/50" aria-label={`${t("allPhotos")} (1/${imgs.length})`}>
          <SmartImage src={imgs[0].url} alt={imgs[0].alt ?? title} priority className="h-full w-full transition duration-700 hover:scale-105" />
        </button>
        {imgs.slice(1, 5).map((im, i) => (
          <button type="button" key={i} onClick={() => show(i + 1)} aria-label={`Foto ${i + 2} de ${imgs.length}`} className={cn("relative hidden h-full overflow-hidden focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/50 sm:block", i === 3 && imgs.length > 5 && "after:absolute after:inset-0 after:bg-ink/50")}>
            <SmartImage src={im.url} alt={im.alt ?? title} className="h-full w-full transition duration-700 hover:scale-105" />
            {i === 3 && imgs.length > 5 && <span className="absolute inset-0 z-10 flex items-center justify-center font-display text-2xl font-extrabold text-white">+{imgs.length - 5}</span>}
          </button>
        ))}
        {imgs.length < 5 && Array.from({ length: 5 - imgs.length }).map((_, i) => <div key={`f${i}`} className="hidden bg-muted sm:block" />)}
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 sm:bottom-4 sm:left-auto sm:right-4">
          <button onClick={() => show(0)} className="btn whitespace-nowrap bg-white/95 px-3 py-2 text-xs text-ink shadow backdrop-blur hover:bg-white sm:px-5 sm:py-2.5 sm:text-sm"><Images className="h-4 w-4" /> {t("allPhotos")} ({imgs.length})</button>
          {hasVideo && <button onClick={onVideo} className="btn whitespace-nowrap bg-white/95 px-3 py-2 text-xs text-ink shadow backdrop-blur hover:bg-white sm:px-5 sm:py-2.5 sm:text-sm"><Play className="h-4 w-4" /> {t("video")}</button>}
          {onMap && <button onClick={onMap} className="btn whitespace-nowrap bg-white/95 px-3 py-2 text-xs text-ink shadow backdrop-blur hover:bg-white sm:hidden"><MapIcon className="h-4 w-4" /> {t("location")}</button>}
        </div>
      </div>

      {open && (
        <div ref={lightboxRef} tabIndex={-1} className="fixed inset-0 z-[1100] flex flex-col bg-black/95 outline-none" role="dialog" aria-modal="true" aria-label={title}>
          <div className="flex items-center justify-between px-5 py-4 text-white">
            <p className="text-sm font-semibold">{idx + 1} / {imgs.length}</p>
            <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-white/10" aria-label="Cerrar"><X className="h-6 w-6" /></button>
          </div>
          <div className="relative flex flex-1 items-center justify-center px-4">
            <button onClick={() => setIdx((i) => (i - 1 + imgs.length) % imgs.length)} className="absolute left-4 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20" aria-label="Anterior"><ChevronLeft className="h-6 w-6" /></button>
            <SmartImage key={idx} src={imgs[idx].url} alt={imgs[idx].alt ?? title} width={1600} height={1067} className="h-auto max-h-[75vh] w-auto max-w-full rounded-xl object-contain animate-fade-up" />
            <button onClick={() => setIdx((i) => (i + 1) % imgs.length)} className="absolute right-4 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20" aria-label="Siguiente"><ChevronRight className="h-6 w-6" /></button>
          </div>
          <div className="flex gap-2 overflow-x-auto px-5 py-4 scrollbar-thin">
            {imgs.map((im, i) => (
              <button type="button" key={i} onClick={() => setIdx(i)} aria-label={`Foto ${i + 1}`} aria-current={i === idx} className={cn("h-16 w-24 shrink-0 overflow-hidden rounded-lg ring-2 transition", i === idx ? "ring-brand" : "ring-transparent opacity-60 hover:opacity-100")}>
                <SmartImage src={im.url} alt="" width={96} height={64} className="h-full w-full" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
