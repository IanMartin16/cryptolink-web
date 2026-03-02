"use client";

import React from "react";
import { cryptolinkDocs } from "@/lib/cryptolink/docs";
import { UI } from "@/lib/ui";

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 900);
    } catch {
      // fallback viejo
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 900);
    }
  };

  return (
    <div className="mt-2 rounded-xl border border-white/10 bg-black/30">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="text-[11px] text-white/50 font-mono">code</div>
        <button
          onClick={onCopy}
          className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] font-semibold text-white/70 hover:bg-white/[0.06]"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>

      <pre className="overflow-auto p-3 text-[12px] text-white/85">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[11px] font-semibold text-white/80">
      {children}
    </span>
  );
}

export default function CryptoLinkDocs() {
  const d = cryptolinkDocs;

  return (
    <div className="min-h-screen bg-[#0b0f14] text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white/95">
              <span style={{ color: UI.orange }}>{d.product.name}</span><span className="text-white/45">Docs</span>
            </h1>
            <Pill>v{d.version}</Pill>
            <Pill>public</Pill>
            <Pill>{d.limits.availableSymbolsToday} symbols</Pill>
          </div>

          <p className="mt-2 text-sm text-white/70">{d.product.tagline}</p>

          <div className="mt-4 grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-[12px] text-white/60">Base URL</div>
            <div className="font-mono text-[13px] text-white/90">{d.baseUrl}</div>

            <div className="mt-2 text-[12px] text-white/60">Quick curl</div>
            <CodeBlock
              code={`curl -s "${d.baseUrl}/v1/prices?symbols=BTC,ETH&fiat=MXN"`}
            />
            <div className="text-[12px] text-white/55">
              Nota: en producción agrega header <span className="font-mono text-white/80">{d.auth.header}</span>.
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {d.sections.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border border-white/10 bg-white/[0.05] p-5"
            >
              <div className="text-sm font-bold text-white/90">{s.title}</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/70">
                {s.body.map((line) => <li key={line}>{line}</li>)}
              </ul>
            </div>
          ))}
        </div>

        {/* Endpoints */}
        <div className="mt-8">
          <div className="mb-3 text-sm font-bold text-white/85">Endpoints</div>

          <div className="grid gap-4">
            {d.endpoints.map((ep) => (
              <div
                key={ep.id}
                className="rounded-2xl border border-white/10 bg-[#0f1620] p-6"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-2 py-1 text-[11px] font-bold text-emerald-200">
                    {ep.method}
                  </span>
                  <span className="font-mono text-[13px] text-white/90">{ep.path}</span>
                  <span className="text-[12px] text-white/55">• {ep.title}</span>
                </div>

                {/* Query table */}
                {ep.query?.length ? (
                  <div className="mt-4">
                    <div className="text-[12px] font-semibold text-white/70">Query params</div>
                    <div className="mt-2 overflow-hidden rounded-xl border border-white/10">
                      <div className="grid grid-cols-[140px_90px_1fr] bg-white/[0.04] px-3 py-2 text-[11px] font-semibold text-white/70">
                        <div>name</div><div>required</div><div>example / notes</div>
                      </div>
                      {ep.query.map((q) => (
                        <div
                          key={q.name}
                          className="grid grid-cols-[140px_90px_1fr] gap-2 border-t border-white/10 px-3 py-2 text-[12px]"
                        >
                          <div className="font-mono text-white/90">{q.name}</div>
                          <div className={q.required ? "text-rose-300" : "text-white/50"}>
                            {q.required ? "yes" : "no"}
                          </div>
                          <div className="min-w-0 text-white/70">
                            {q.example ? (
                              <span className="mr-2 font-mono text-white/80">{q.example}</span>
                            ) : null}
                            {q.notes ? <span className="text-white/55">— {q.notes}</span> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Examples */}
                {ep.examples?.length ? (
                  <div className="mt-4">
                    <div className="text-[12px] font-semibold text-white/70">Examples</div>
                    {ep.examples.map((ex) => (
                      <div key={ex.title} className="mt-2">
                        <div className="text-[12px] text-white/60">{ex.title}</div>
                        <CodeBlock code={ex.code} />
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Responses */}
                {ep.responses?.length ? (
                  <div className="mt-4">
                    <div className="text-[12px] font-semibold text-white/70">Responses</div>
                    <div className="mt-2 grid gap-2">
                      {ep.responses.map((r) => (
                        <div
                          key={`${ep.id}-${r.status}`}
                          className="rounded-xl border border-white/10 bg-black/20 p-3"
                        >
                          <div className="text-[12px] text-white/80">
                            <span className="font-bold">{r.status}</span> — {r.description}
                          </div>
                          {"example" in r && r.example ? <CodeBlock code={r.example} /> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-[11px] text-white/40">
          updated: {d.updatedAt}
        </div>
      </div>
    </div>
  );
}