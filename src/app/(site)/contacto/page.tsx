import type { Metadata } from "next";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { InquiryForm } from "@/components/site/forms";
import { getSettings } from "@/server/modules/settings/service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contacto" };

export default async function ContactPage() {
  const s = await getSettings();
  return (
    <div className="container-x py-10">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="eyebrow mb-2">Hablemos</p>
          <h1 className="section-title">Estamos para ayudarte</h1>
          <p className="mt-3 text-ink-soft">Escríbenos y un asesor te responderá en menos de 24 horas hábiles.</p>
          <ul className="mt-8 space-y-4 text-sm">
            {[[MapPin, s.contact_address], [Phone, s.contact_phone], [Mail, s.contact_email], [Clock, "Lunes a viernes 8:00 a 18:00 · Sábados 9:00 a 13:00"]].map(([Icon, v], i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">{(() => { const I = Icon as React.ComponentType<{ className?: string }>; return <I className="h-5 w-5" />; })()}</span>
                <span className="pt-2 text-ink-soft">{v as string}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-7">
          <h2 className="mb-4 font-display text-xl font-bold">Envíanos un mensaje</h2>
          <InquiryForm defaultMessage="" whatsapp={s.contact_whatsapp} phone={s.contact_phone} />
        </div>
      </div>
    </div>
  );
}
