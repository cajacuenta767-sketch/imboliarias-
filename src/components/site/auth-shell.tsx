import { SmartImage } from "@/components/ui/smart-image";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="container-x py-12">
      <div className="card mx-auto grid max-w-4xl overflow-hidden md:grid-cols-2">
        <div className="relative hidden min-h-[520px] bg-ink md:block">
          <SmartImage src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&q=80" alt="" className="absolute inset-0 h-full w-full opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8 text-white">
            <p className="font-display text-2xl font-extrabold">Tu próxima propiedad empieza aquí.</p>
            <p className="mt-2 text-sm text-white/80">Publica, guarda favoritos y recibe consultas en un solo lugar.</p>
          </div>
        </div>
        <div className="p-8 sm:p-10">
          <h1 className="font-display text-2xl font-extrabold">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-ink-soft">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
