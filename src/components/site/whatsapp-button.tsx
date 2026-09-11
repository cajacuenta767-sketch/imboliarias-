"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useSettings } from "@/lib/hooks/use-settings";

export function WhatsAppButton({ message }: { message?: string }) {
  const s = useSettings();
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const number = (s.contact_whatsapp ?? "").replace(/\D/g, "");
  if (!number) return null;
  const href = `https://wa.me/${number}?text=${encodeURIComponent(message ?? `Hola ${s.site_name}, quiero más información.`)}`;
  return (
    <div className="fixed bottom-5 right-5 z-30 flex flex-col items-end gap-2">
      {showTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex h-10 w-10 items-center justify-center rounded-full bg-elevated text-ink shadow-float ring-1 ring-line hover:text-brand" aria-label="Subir">
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
      <a href={href} target="_blank" rel="noreferrer" className="group flex items-center gap-2 rounded-full bg-[#25D366] py-2.5 pl-2.5 pr-4 text-sm font-bold text-white shadow-float transition hover:bg-[#1ebe5b]">
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-1 1.2-.4.2-.7.1a8.2 8.2 0 0 1-2.4-1.5 9 9 0 0 1-1.7-2.1c-.2-.3 0-.5.1-.6l.5-.6.3-.5c.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4l-.5-.3zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z" /></svg>
        <span className="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 group-hover:max-w-[140px] sm:max-w-[140px]">WhatsApp</span>
      </a>
    </div>
  );
}
