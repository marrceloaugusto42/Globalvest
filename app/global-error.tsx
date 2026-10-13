"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Globalvest fatal application error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", fontFamily: "Arial, sans-serif", background: "#f5f7fa", color: "#111827" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, boxSizing: "border-box" }}>
          <section style={{ width: "100%", maxWidth: 440, padding: 28, borderRadius: 18, background: "#fff", border: "1px solid #e5e7eb", boxShadow: "0 12px 36px rgba(15,23,42,.08)", textAlign: "center", boxSizing: "border-box" }}>
            <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-1px", marginBottom: 8 }}>Globalvest</div>
            <h1 style={{ fontSize: 22, margin: "0 0 10px" }}>We couldn’t start the app</h1>
            <p style={{ color: "#4b5563", lineHeight: 1.6, margin: "0 0 22px" }}>The app encountered an unexpected error. Please try again. If it keeps happening, share this reference with support.</p>
            {error.digest ? <p style={{ color: "#6b7280", fontSize: 12, margin: "0 0 16px" }}>Reference: {error.digest}</p> : null}
            <button onClick={() => reset()} style={{ width: "100%", border: 0, borderRadius: 10, padding: "14px 18px", background: "#16a34a", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>Try again</button>
            <a href="/" style={{ display: "inline-block", marginTop: 16, color: "#374151", fontWeight: 600, textDecoration: "none" }}>Reload home page</a>
          </section>
        </main>
      </body>
    </html>
  );
}
