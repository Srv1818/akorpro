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

export function MetronomeButton({
  active,
  onActiveChange,
  bpm,
  onBpmChange,
  timeSignature,
  onTimeSignatureChange,
  showToggle = true,
  showControls = true,
}: {
  active: boolean;
  onActiveChange: (next: boolean) => void;
  bpm: number;
  onBpmChange: (next: number) => void;
  timeSignature: string;
  onTimeSignatureChange: (next: string) => void;
  showToggle?: boolean;
  showControls?: boolean;
}) {
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const beatInBarRef = useRef(0);

  const clampBpm = useCallback((n: number) => Math.max(40, Math.min(240, n)), []);

  // Keep a local text buffer so typing (including temporarily empty/partial values)
  // is not blocked by min/max clamping.
  const [bpmText, setBpmText] = useState(String(bpm));
  useEffect(() => {
    setBpmText(String(bpm));
  }, [bpm]);

  const parseTimeSignature = useCallback((value: string): { numerator: number; denominator: number } | null => {
    const m = value.match(/^\s*(\d+)\s*\/\s*(\d+)\s*$/);
    if (!m) return null;
    const numerator = Number(m[1]);
    const denominator = Number(m[2]);
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || numerator < 1 || denominator < 1) return null;
    return { numerator, denominator };
  }, []);

  const tsParsed = parseTimeSignature(timeSignature);
  const beatsPerBar = tsParsed?.numerator ?? 4;

  const tick = useCallback((strongBeat: boolean) => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    const ctx = ctxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = strongBeat ? 1200 : 800;
    gain.gain.value = strongBeat ? 0.1 : 0.065;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  }, []);

  useEffect(() => {
    if (!active) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    beatInBarRef.current = 0;
    tick(true);
    intervalRef.current = setInterval(() => {
      const strong = beatInBarRef.current === 0;
      tick(strong);
      beatInBarRef.current = (beatInBarRef.current + 1) % Math.max(1, beatsPerBar);
    }, 60_000 / Math.max(1, bpm));
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active, bpm, tick, beatsPerBar]);

  const timeSignatureOptions = (() => {
    const base = ["2/4", "3/4", "4/4", "5/4", "6/4", "6/8", "7/8", "9/8", "12/8"] as const;
    const initial = timeSignature || "4/4";
    // Ensure the currently selected/initial value is always present.
    const set = new Set<string>([...base]);
    set.add(initial);
    return Array.from(set);
  })();

  return (
    <div className="flex items-center gap-1.5">
      {showToggle ? (
        <button
          type="button"
          onClick={() => onActiveChange(!active)}
          aria-pressed={active}
          aria-label={active ? "Metronom durdur" : "Metronom başlat"}
          className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
            active
              ? "border-accent bg-accent text-accent-foreground"
              : "border-border bg-bg text-foreground hover:border-accent/50"
          }`}
        >
          {active ? "■ Met" : "J Met"}
        </button>
      ) : null}

      {showControls ? (
        <>
          <label className={`flex items-center gap-1 text-xs ${active ? "text-muted" : "text-muted/80"}`}>
            <input
              type="number"
              min={40}
              max={240}
              step={5}
              value={bpmText}
              onChange={(e) => {
                const nextText = e.target.value;
                setBpmText(nextText);
                if (!nextText.trim()) return;
                const n = Number(nextText);
                if (!Number.isFinite(n)) return;
                // Only apply to the metronome when within a valid range.
                // This prevents clamping from blocking "partial" typing (e.g. 6 → 60).
                if (n < 40 || n > 240) return;
                onBpmChange(clampBpm(n));
              }}
              onBlur={() => {
                const n = Number(bpmText);
                if (!Number.isFinite(n)) return;
                onBpmChange(clampBpm(n));
              }}
              className="w-14 rounded border border-border bg-bg px-1.5 py-1 text-xs text-foreground outline-none"
              aria-label="BPM"
            />
            BPM
          </label>
          <label className={`flex items-center gap-1 text-xs ${active ? "text-muted" : "text-muted/80"}`}>
            <select
              value={timeSignature}
              onChange={(e) => onTimeSignatureChange(e.target.value)}
              className="rounded border border-border bg-bg px-1.5 py-1 text-xs text-foreground outline-none"
              aria-label="Ölçü"
            >
              {timeSignatureOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            Ölçü
          </label>
        </>
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
