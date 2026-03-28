"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Auto-scroll                                                        */
/* ------------------------------------------------------------------ */

export function AutoScrollButton() {
  const [active, setActive] = useState(false);
  const [speed, setSpeed] = useState(1);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    let last = performance.now();
    function tick(now: number) {
      const dt = now - last;
      last = now;
      window.scrollBy(0, (speed * dt) / 60);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, speed]);

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => setActive((a) => !a)}
        aria-pressed={active}
        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
          active
            ? "border-accent bg-accent text-accent-foreground"
            : "border-border bg-surface text-foreground hover:border-accent/50"
        }`}
      >
        {active ? "Durdur" : "Kaydır"}
      </button>
      {active ? (
        <select
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          aria-label="Kaydırma hızı"
          className="rounded border border-border bg-bg px-1.5 py-1 text-xs text-foreground outline-none"
        >
          <option value={0.5}>Yavaş</option>
          <option value={1}>Normal</option>
          <option value={2}>Hızlı</option>
        </select>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Metronome                                                          */
/* ------------------------------------------------------------------ */

export function MetronomeButton({ bpm: initialBpm }: { bpm?: number }) {
  const [active, setActive] = useState(false);
  const [bpm, setBpm] = useState(initialBpm ?? 120);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  const tick = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    const ctx = ctxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 1000;
    gain.gain.value = 0.08;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  }, []);

  useEffect(() => {
    if (!active) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    tick();
    intervalRef.current = setInterval(tick, 60_000 / bpm);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active, bpm, tick]);

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => setActive((a) => !a)}
        aria-pressed={active}
        aria-label={active ? "Metronom durdur" : "Metronom başlat"}
        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
          active
            ? "border-accent bg-accent text-accent-foreground"
            : "border-border bg-surface text-foreground hover:border-accent/50"
        }`}
      >
        {active ? "■ Met" : "♩ Met"}
      </button>
      {active ? (
        <label className="flex items-center gap-1 text-xs text-muted">
          <input
            type="number"
            min={40}
            max={240}
            step={5}
            value={bpm}
            onChange={(e) => setBpm(Math.max(40, Math.min(240, Number(e.target.value))))}
            className="w-14 rounded border border-border bg-bg px-1.5 py-1 text-xs text-foreground outline-none"
            aria-label="BPM"
          />
          BPM
        </label>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Copy + Print                                                       */
/* ------------------------------------------------------------------ */

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked */ }
  }, [text]);

  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label="Akor metnini kopyala"
      className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-accent/50"
    >
      {copied ? "Kopyalandı ✓" : "Kopyala"}
    </button>
  );
}

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      aria-label="Sayfayı yazdır"
      className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-accent/50"
    >
      Yazdır
    </button>
  );
}
