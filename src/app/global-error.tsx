"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "#faf8f5", color: "#111827" }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Algo salió mal</h1>
          <p style={{ color: "#4b5563", marginTop: 8 }}>Ocurrió un error inesperado. Puedes intentarlo de nuevo.</p>
          {error.digest && <p style={{ color: "#6b7280", fontSize: 12, marginTop: 8 }}>ID: {error.digest}</p>}
          <button onClick={reset} style={{ marginTop: 20, background: "#0f766e", color: "#fff", border: 0, borderRadius: 999, padding: "10px 20px", fontWeight: 600, cursor: "pointer" }}>Reintentar</button>
        </div>
      </body>
    </html>
  );
}
