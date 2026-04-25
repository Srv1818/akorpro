"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, ChevronUp, ImageUp, Plus, Trash2, X } from "lucide-react";
import type { BolumDoc, DersDoc, IcerikBlok, IcerikBlokTip } from "@/lib/types/firestore";
import { videoEmbedUrl } from "@/lib/video";

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const MAX_FILE_BYTES = 8_000_000; // 8 MB
const IZIN_VERILEN_FORMATLAR = ["image/jpeg", "image/png", "image/webp", "image/gif"];

async function cloudinaryYukle(file: File): Promise<string> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error("Cloudinary yapılandırması eksik (.env.local).");
  }
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: fd },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Cloudinary yükleme başarısız (${res.status}): ${text}`);
  }
  const data = (await res.json()) as { secure_url?: string };
  if (!data.secure_url) throw new Error("Cloudinary yanıtı geçersiz.");
  return data.secure_url;
}

let _id = 0;
const uid = () => `local-${++_id}-${Date.now()}`;

const bosBolum = (): BolumDoc => ({ id: uid(), baslik: "", sira: 0, dersler: [] });
const bosDers = (sira: number): DersDoc => ({ id: uid(), baslik: "", altBaslik: "", sira, icerikBloklar: [] });
const bosBlok = (tip: IcerikBlokTip): IcerikBlok => ({ tip, icerik: "" });

type Secim = { bolumId: string; dersId: string } | null;

const BLOK_ETIKET: Record<IcerikBlokTip, string> = {
  metin: "Metin",
  video: "Video",
  resim: "Resim",
  alphatab: "AlphaTab",
};

export function AdminMetodEditor({
  metodId,
  baslangicBolumler,
}: {
  metodId: string;
  baslangicBolumler: BolumDoc[];
}) {
  const [bolumler, setBolumler] = useState<BolumDoc[]>(baslangicBolumler);
  const [secim, setSecim] = useState<Secim>(null);
  const [yuklenenler, setYuklenenler] = useState<Record<number, boolean>>({});
  const [acikBolumler, setAcikBolumler] = useState<Set<string>>(
    () => new Set(baslangicBolumler.map((b) => b.id)),
  );
  const [kayit, setKayit] = useState<"idle" | "saving" | "ok" | "error">("idle");

  /* ── yardımcılar ── */
  const aktifBolum = secim ? bolumler.find((b) => b.id === secim.bolumId) ?? null : null;
  const aktifDers = aktifBolum?.dersler.find((d) => d.id === secim?.dersId) ?? null;

  function guncelle(yeni: BolumDoc[]) { setBolumler(yeni); setKayit("idle"); }

  /* ── bölüm işlemleri ── */
  function bolumEkle() {
    const b = bosBolum();
    guncelle([...bolumler, b]);
    setAcikBolumler((s) => new Set([...s, b.id]));
  }

  function bolumSil(bid: string) {
    if (!confirm("Bölümü ve tüm derslerini silmek istiyor musunuz?")) return;
    guncelle(bolumler.filter((b) => b.id !== bid));
    if (secim?.bolumId === bid) setSecim(null);
  }

  function bolumTasi(bid: string, yon: -1 | 1) {
    const idx = bolumler.findIndex((b) => b.id === bid);
    const hedef = idx + yon;
    if (hedef < 0 || hedef >= bolumler.length) return;
    const yeni = [...bolumler];
    [yeni[idx], yeni[hedef]] = [yeni[hedef], yeni[idx]];
    guncelle(yeni);
  }

  function bolumBaslikGuncelle(bid: string, baslik: string) {
    guncelle(bolumler.map((b) => (b.id === bid ? { ...b, baslik } : b)));
  }

  function bolumToggle(bid: string) {
    setAcikBolumler((s) => {
      const yeni = new Set(s);
      yeni.has(bid) ? yeni.delete(bid) : yeni.add(bid);
      return yeni;
    });
  }

  /* ── ders işlemleri ── */
  function dersEkle(bid: string) {
    const bolum = bolumler.find((b) => b.id === bid)!;
    const ders = bosDers(bolum.dersler.length);
    guncelle(bolumler.map((b) => b.id === bid ? { ...b, dersler: [...b.dersler, ders] } : b));
    setSecim({ bolumId: bid, dersId: ders.id });
    setAcikBolumler((s) => new Set([...s, bid]));
  }

  function dersSil(bid: string, did: string) {
    if (!confirm("Dersi silmek istiyor musunuz?")) return;
    guncelle(bolumler.map((b) => b.id === bid ? { ...b, dersler: b.dersler.filter((d) => d.id !== did) } : b));
    if (secim?.dersId === did) setSecim(null);
  }

  function dersTasi(bid: string, did: string, yon: -1 | 1) {
    const bolum = bolumler.find((b) => b.id === bid)!;
    const idx = bolum.dersler.findIndex((d) => d.id === did);
    const hedef = idx + yon;
    if (hedef < 0 || hedef >= bolum.dersler.length) return;
    const yeniDersler = [...bolum.dersler];
    [yeniDersler[idx], yeniDersler[hedef]] = [yeniDersler[hedef], yeniDersler[idx]];
    guncelle(bolumler.map((b) => b.id === bid ? { ...b, dersler: yeniDersler } : b));
  }

  function dersGuncelle(bid: string, did: string, patch: Partial<DersDoc>) {
    guncelle(bolumler.map((b) =>
      b.id === bid
        ? { ...b, dersler: b.dersler.map((d) => (d.id === did ? { ...d, ...patch } : d)) }
        : b,
    ));
  }

  /* ── blok işlemleri ── */
  function blokEkle(tip: IcerikBlokTip) {
    if (!secim || !aktifDers) return;
    dersGuncelle(secim.bolumId, secim.dersId, {
      icerikBloklar: [...aktifDers.icerikBloklar, bosBlok(tip)],
    });
  }

  function blokGuncelle(idx: number, icerik: string) {
    if (!secim || !aktifDers) return;
    const yeni = aktifDers.icerikBloklar.map((b, i) => (i === idx ? { ...b, icerik } : b));
    dersGuncelle(secim.bolumId, secim.dersId, { icerikBloklar: yeni });
  }

  async function resimYukle(idx: number, file: File) {
    if (!IZIN_VERILEN_FORMATLAR.includes(file.type)) {
      alert("Sadece JPG, PNG, WEBP veya GIF dosyaları yüklenebilir.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      const mb = Math.round((file.size / 1024 / 1024) * 10) / 10;
      alert(`Dosya çok büyük (${mb} MB). Maksimum 8 MB.`);
      return;
    }
    setYuklenenler((p) => ({ ...p, [idx]: true }));
    try {
      const url = await cloudinaryYukle(file);
      blokGuncelle(idx, url);
    } catch (e) {
      console.error("[resimYukle]", e);
      alert("Resim yüklenemedi: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setYuklenenler((p) => ({ ...p, [idx]: false }));
    }
  }

  function blokSil(idx: number) {
    if (!secim || !aktifDers) return;
    dersGuncelle(secim.bolumId, secim.dersId, {
      icerikBloklar: aktifDers.icerikBloklar.filter((_, i) => i !== idx),
    });
  }

  /* ── kaydet ── */
  async function kaydet() {
    setKayit("saving");
    try {
      const res = await fetch(`/api/admin/metodlar/${metodId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bolumler }),
      });
      setKayit(res.ok ? "ok" : "error");
    } catch {
      setKayit("error");
    }
  }

  /* ── render ── */
  return (
    <div className="flex h-full">

      {/* ── Sol: ağaç ── */}
      <aside className="flex w-64 shrink-0 flex-col overflow-hidden border-r border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted">Müfredat</span>
          <button
            onClick={bolumEkle}
            className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-muted hover:border-accent/40 hover:text-accent"
          >
            <Plus className="size-3" /> Bölüm
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto p-2 space-y-1">
          {bolumler.map((bolum, bi) => {
            const acik = acikBolumler.has(bolum.id);
            return (
              <li key={bolum.id}>
                {/* Bölüm satırı */}
                <div className="group flex items-center gap-1 rounded-lg border border-border bg-bg px-2 py-1.5">
                  <button onClick={() => bolumToggle(bolum.id)} className="shrink-0 text-muted">
                    {acik ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                  </button>
                  <input
                    value={bolum.baslik}
                    onChange={(e) => bolumBaslikGuncelle(bolum.id, e.target.value)}
                    placeholder={`Bölüm ${bi + 1}`}
                    className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-foreground placeholder:text-muted/50 focus:outline-none"
                  />
                  <div className="hidden items-center gap-0.5 group-hover:flex">
                    <button onClick={() => bolumTasi(bolum.id, -1)} disabled={bi === 0} className="rounded p-0.5 text-muted hover:text-foreground disabled:opacity-30">
                      <ChevronUp className="size-3" />
                    </button>
                    <button onClick={() => bolumTasi(bolum.id, 1)} disabled={bi === bolumler.length - 1} className="rounded p-0.5 text-muted hover:text-foreground disabled:opacity-30">
                      <ChevronDown className="size-3" />
                    </button>
                    <button onClick={() => dersEkle(bolum.id)} className="rounded p-0.5 text-muted hover:text-accent" title="Ders ekle">
                      <Plus className="size-3" />
                    </button>
                    <button onClick={() => bolumSil(bolum.id)} className="rounded p-0.5 text-muted hover:text-red-500">
                      <X className="size-3" />
                    </button>
                  </div>
                </div>

                {/* Dersler */}
                {acik && (
                  <ul className="mt-1 ml-4 space-y-1">
                    {bolum.dersler.map((ders, di) => {
                      const aktif = secim?.dersId === ders.id;
                      return (
                        <li key={ders.id} className="group flex items-center gap-1">
                          <button
                            onClick={() => setSecim({ bolumId: bolum.id, dersId: ders.id })}
                            className={[
                              "min-w-0 flex-1 rounded-lg border px-2 py-1.5 text-left text-xs font-medium transition",
                              aktif
                                ? "border-accent/50 bg-accent/10 text-accent"
                                : "border-border bg-bg text-foreground hover:border-accent/30",
                            ].join(" ")}
                          >
                            <span className="truncate block">
                              {ders.baslik || <span className="italic text-muted">Başlıksız ders</span>}
                            </span>
                            {ders.altBaslik && (
                              <span className="truncate block text-[10px] text-muted">{ders.altBaslik}</span>
                            )}
                          </button>
                          <div className="hidden flex-col gap-0.5 group-hover:flex">
                            <button onClick={() => dersTasi(bolum.id, ders.id, -1)} disabled={di === 0} className="rounded p-0.5 text-muted hover:text-foreground disabled:opacity-30">
                              <ChevronUp className="size-3" />
                            </button>
                            <button onClick={() => dersTasi(bolum.id, ders.id, 1)} disabled={di === bolum.dersler.length - 1} className="rounded p-0.5 text-muted hover:text-foreground disabled:opacity-30">
                              <ChevronDown className="size-3" />
                            </button>
                            <button onClick={() => dersSil(bolum.id, ders.id)} className="rounded p-0.5 text-muted hover:text-red-500">
                              <X className="size-3" />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                    <li>
                      <button
                        onClick={() => dersEkle(bolum.id)}
                        className="flex w-full items-center gap-1 rounded-lg border border-dashed border-border px-2 py-1 text-xs text-muted hover:border-accent/40 hover:text-accent"
                      >
                        <Plus className="size-3" /> Ders ekle
                      </button>
                    </li>
                  </ul>
                )}
              </li>
            );
          })}

          {bolumler.length === 0 && (
            <li className="py-8 text-center text-xs text-muted">
              Henüz bölüm yok.<br />Üstten "Bölüm" ekle.
            </li>
          )}
        </ul>

        <div className="border-t border-border p-3">
          <button
            onClick={kaydet}
            disabled={kayit === "saving"}
            className="w-full rounded-lg bg-accent py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
          >
            {kayit === "saving" ? "Kaydediliyor…" : "Kaydet"}
          </button>
          {kayit === "ok" && <p className="mt-1.5 text-center text-xs text-green-500">Kaydedildi.</p>}
          {kayit === "error" && <p className="mt-1.5 text-center text-xs text-red-500">Hata oluştu.</p>}
        </div>
      </aside>

      {/* ── Sağ: ders editörü ── */}
      <main className="flex-1 overflow-y-auto">
        {!aktifDers ? (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            Sol taraftan bir ders seç veya yeni ekle.
          </div>
        ) : (
          <div key={aktifDers.id} className="mx-auto max-w-2xl p-6">
            {/* Başlık + alt başlık */}
            <input
              autoFocus
              value={aktifDers.baslik}
              onChange={(e) => dersGuncelle(secim!.bolumId, secim!.dersId, { baslik: e.target.value })}
              placeholder="Ders başlığı"
              className="mb-2 w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-lg font-semibold focus:border-accent/50 focus:outline-none"
            />
            <input
              value={aktifDers.altBaslik}
              onChange={(e) => dersGuncelle(secim!.bolumId, secim!.dersId, { altBaslik: e.target.value })}
              placeholder="Alt başlık (isteğe bağlı)"
              className="mb-6 w-full rounded-xl border border-border bg-bg px-4 py-2 text-sm text-muted focus:border-accent/50 focus:outline-none"
            />

            {/* İçerik blokları */}
            <div className="space-y-4">
              {aktifDers.icerikBloklar.map((blok, idx) => (
                <div key={idx} className="group rounded-xl border border-border bg-surface p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                      {BLOK_ETIKET[blok.tip]}
                    </span>
                    <button onClick={() => blokSil(idx)} className="rounded p-1 text-muted opacity-0 hover:text-red-500 group-hover:opacity-100">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  {blok.tip === "metin" && (
                    <textarea
                      rows={6}
                      value={blok.icerik}
                      onChange={(e) => blokGuncelle(idx, e.target.value)}
                      placeholder="Metin içeriği…"
                      className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm leading-relaxed focus:border-accent/50 focus:outline-none"
                    />
                  )}

                  {blok.tip === "video" && (
                    <div>
                      <input
                        type="url"
                        value={blok.icerik}
                        onChange={(e) => blokGuncelle(idx, e.target.value)}
                        placeholder="YouTube veya Vimeo URL"
                        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-accent/50 focus:outline-none"
                      />
                      {blok.icerik && (
                        <div className="mt-3 overflow-hidden rounded-lg border border-border">
                          <iframe
                            src={videoEmbedUrl(blok.icerik)}
                            className="aspect-video w-full"
                            allowFullScreen
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {blok.tip === "resim" && (
                    <div>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={blok.icerik}
                          onChange={(e) => blokGuncelle(idx, e.target.value)}
                          placeholder="Resim URL (ya da dosya yükle →)"
                          className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-accent/50 focus:outline-none"
                        />
                        <label className={[
                          "flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm transition",
                          yuklenenler[idx] ? "opacity-50 pointer-events-none" : "hover:border-accent/40 hover:text-accent text-muted",
                        ].join(" ")}>
                          <ImageUp className="size-4" />
                          {yuklenenler[idx] ? "Yükleniyor…" : "Yükle"}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="sr-only"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) resimYukle(idx, f);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>
                      {blok.icerik && (
                        <img src={blok.icerik} alt="" className="mt-3 max-h-64 rounded-lg border border-border object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      )}
                    </div>
                  )}

                  {blok.tip === "alphatab" && (
                    <textarea
                      rows={4}
                      value={blok.icerik}
                      onChange={(e) => blokGuncelle(idx, e.target.value)}
                      placeholder="AlphaTab / GuitarPro içerik URL ya da veri…"
                      className="w-full rounded-lg border border-border bg-bg px-3 py-2 font-mono text-xs focus:border-accent/50 focus:outline-none"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Blok ekle */}
            <div className="mt-4 flex flex-wrap gap-2">
              {(["metin", "video", "resim", "alphatab"] as IcerikBlokTip[]).map((tip) => (
                <button
                  key={tip}
                  onClick={() => blokEkle(tip)}
                  className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted hover:border-accent/40 hover:text-accent"
                >
                  <Plus className="size-3" /> {BLOK_ETIKET[tip]}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
