"use client";

import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import type { BolumDoc, DersDoc } from "@/lib/types/firestore";

type Secim = { bolumId: string; dersId: string } | null;

export function MetodDetayClient({
  title,
  bolumler,
}: {
  title: string;
  bolumler: BolumDoc[];
}) {
  const [acik, setAcik] = useState(true);
  const [acikBolumler, setAcikBolumler] = useState<Set<string>>(
    () => new Set(bolumler.map((b) => b.id)),
  );
  const [secim, setSecim] = useState<Secim>(null);

  const aktifBolum = secim ? bolumler.find((b) => b.id === secim.bolumId) ?? null : null;
  const aktifDers = aktifBolum?.dersler.find((d) => d.id === secim?.dersId) ?? null;

  function bolumToggle(bid: string) {
    setAcikBolumler((s) => {
      const yeni = new Set(s);
      yeni.has(bid) ? yeni.delete(bid) : yeni.add(bid);
      return yeni;
    });
  }

  return (
    <div className="flex min-h-full">
      {/* Sidebar */}
      <aside
        className={[
          "sticky top-0 h-screen shrink-0 overflow-hidden border-r border-border bg-surface transition-all duration-300",
          acik ? "w-64" : "w-12",
        ].join(" ")}
      >
        <button
          onClick={() => setAcik((v) => !v)}
          className="flex h-12 w-full items-center justify-end border-b border-border px-3 text-muted transition-colors hover:text-foreground"
        >
          {acik ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
        </button>

        <div className={["h-[calc(100%-3rem)] overflow-y-auto transition-opacity duration-200", acik ? "opacity-100" : "pointer-events-none opacity-0"].join(" ")}>
          <div className="p-3 space-y-1">
            {bolumler.map((bolum) => (
              <div key={bolum.id}>
                <button
                  onClick={() => bolumToggle(bolum.id)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-muted hover:text-foreground"
                >
                  {acikBolumler.has(bolum.id)
                    ? <ChevronDown className="size-3 shrink-0" />
                    : <ChevronRight className="size-3 shrink-0" />}
                  <span className="truncate">{bolum.baslik || "Bölüm"}</span>
                </button>

                {acikBolumler.has(bolum.id) && (
                  <ul className="ml-4 mt-0.5 space-y-0.5">
                    {bolum.dersler.map((ders) => {
                      const aktif = secim?.dersId === ders.id;
                      return (
                        <li key={ders.id}>
                          <button
                            onClick={() => setSecim({ bolumId: bolum.id, dersId: ders.id })}
                            className={[
                              "flex w-full flex-col rounded-lg border px-3 py-2 text-left text-sm transition",
                              aktif
                                ? "border-accent/50 bg-accent/10 text-accent"
                                : "border-transparent text-foreground hover:border-border hover:bg-bg",
                            ].join(" ")}
                          >
                            <span className="font-medium leading-snug">{ders.baslik || "Ders"}</span>
                            {ders.altBaslik && (
                              <span className="mt-0.5 text-[11px] text-muted">{ders.altBaslik}</span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* İçerik */}
      <main className="flex-1 overflow-y-auto p-8">
        {!aktifDers ? (
          <div className="flex h-full flex-col justify-center">
            <h1 className="text-2xl font-bold text-display">{title}</h1>
            <p className="mt-2 text-sm text-muted">Sol taraftan bir ders seç.</p>
          </div>
        ) : (
          <article key={aktifDers.id} className="max-w-2xl">
            <h2 className="text-xl font-bold text-display">{aktifDers.baslik}</h2>
            {aktifDers.altBaslik && (
              <p className="mb-6 mt-1 text-sm text-muted">{aktifDers.altBaslik}</p>
            )}
            {!aktifDers.altBaslik && <div className="mb-6" />}

            <div className="space-y-6">
              {aktifDers.icerikBloklar.map((blok, i) => (
                <div key={i}>
                  {blok.tip === "metin" && (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{blok.icerik}</p>
                  )}
                  {blok.tip === "video" && blok.icerik && (
                    <div className="overflow-hidden rounded-xl border border-border">
                      <iframe
                        src={blok.icerik.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/")}
                        className="aspect-video w-full"
                        allowFullScreen
                      />
                    </div>
                  )}
                  {blok.tip === "resim" && blok.icerik && (
                    <img src={blok.icerik} alt="" className="rounded-xl border border-border" />
                  )}
                  {blok.tip === "alphatab" && blok.icerik && (
                    <div className="rounded-xl border border-border bg-surface p-4 font-mono text-xs text-muted">
                      {blok.icerik}
                    </div>
                  )}
                </div>
              ))}
              {aktifDers.icerikBloklar.length === 0 && (
                <p className="text-sm text-muted">Bu ders için henüz içerik eklenmedi.</p>
              )}
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
