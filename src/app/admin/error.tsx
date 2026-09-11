"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="card flex flex-col items-center px-6 py-16 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-danger"><AlertTriangle className="h-7 w-7" /></span>
      <h2 className="font-display text-xl font-bold">Algo salió mal</h2>
      <p className="mt-1 max-w-sm text-sm text-ink-soft">No pudimos cargar esta sección. Inténtalo de nuevo; si persiste, escríbenos.</p>
      {error.digest && <p className="mt-2 text-xs text-ink-muted">ID: {error.digest}</p>}
      <button onClick={reset} className="btn-primary mt-5"><RotateCcw className="h-4 w-4" /> Reintentar</button>
    </div>
  );
}
