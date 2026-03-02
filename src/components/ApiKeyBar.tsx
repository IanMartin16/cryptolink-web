"use client";

import { useEffect, useState } from "react";
import { clearApiKey, getApiKey, setApiKey } from "@/lib/apiKey";
import { UI } from "@/lib/ui";


export default function ApiKeyBar() {
  const [value, setValue] = useState("");

  useEffect(() => {
    const existing = getApiKey();
    if (existing) setValue(existing);
  }, []);

  return (
  <section
    style={{
      marginTop: 16,
      padding: 16,
      border: `1px solid ${UI.border}`,
      borderRadius: 14,
      background: UI.panel,
      overflow: "hidden", // ✅ por si algo intenta salirse
    }}
  >
    <h2 style={{ margin: 0 }}>API Key</h2>

    <p style={{ marginTop: 8, opacity: 0.8, wordBreak: "break-word" }}>
      Pega tu key para que el dashboard pueda consumir <code>/v1/prices</code>.
    </p>

    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        flexWrap: "wrap", // ✅ permite brincar en pantallas chicas
      }}
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="ck_live_... o la key que uses"
        style={{
          flex: "1 1 240px",   // ✅ crece y también puede bajar de línea
          minWidth: 0,         // ✅ clave para que no empuje todo
          padding: 10,
          borderRadius: 10,
          border: `1px solid ${UI.border}`,
          background: "rgba(255,255,255,0.03)",
          color: UI.text,
          outline: "none",
        }}
      />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={() => setApiKey(value)}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: `1px solid ${UI.border}`,
            background: "rgba(255,255,255,0.03)",
            color: UI.text,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Guardar
        </button>

        <button
          onClick={() => {
            clearApiKey();
            setValue("");
          }}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: `1px solid ${UI.border}`,
            background: "rgba(255,255,255,0.03)",
            color: UI.text,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Limpiar
        </button>
      </div>
    </div>
  </section>
);
}