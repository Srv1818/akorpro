"use client";

import type { ReactNode } from "react";
import type { GuitarChordPosition } from "@/lib/chords-db/guitar";
import { parseFretChar } from "@/lib/chords-db/guitar";

const STRING_COUNT = 6;

function parseFretLine(frets: string): Array<"open" | "mute" | number> {
  return Array.from({ length: STRING_COUNT }, (_, i) => parseFretChar(frets[i] ?? "x"));
}

function barreStringSpan(
  fretsParsed: Array<"open" | "mute" | number>,
  barreFret: number,
): { from: number; to: number } | null {
  const hit = fretsParsed.map((v, i) => (v === barreFret ? i : -1)).filter((i) => i >= 0);
  if (hit.length === 0) return null;
  return { from: Math.min(...hit), to: Math.max(...hit) };
}

function getFretWindow(fretsParsed: Array<"open" | "mute" | number>): { startFret: number; numRows: number } {
  const nums = fretsParsed.filter((v): v is number => typeof v === "number");
  const numRows = 4;
  if (nums.length === 0) return { startFret: 1, numRows };
  const minF = Math.min(...nums);
  const maxF = Math.max(...nums);
  const span = maxF - minF + 1;
  if (maxF <= numRows) return { startFret: 1, numRows };
  if (span <= numRows) return { startFret: minF, numRows };
  return { startFret: Math.max(1, maxF - numRows + 1), numRows };
}

type Props = {
  position: GuitarChordPosition;
  title: string;
  className?: string;
  /** Başlık satırı solu (ör. varyasyon geri); yükseklik başlıkla hizalanır. */
  headerStart?: ReactNode;
  /** Başlık satırı sağı (ör. varyasyon ileri). */
  headerEnd?: ReactNode;
};

/**
 * Klasik akor kutusu: teller dikey (sol = kalın E), perdeler aşağı.
 * Renkler tema / fretboard ile uyumlu (bg, surface, border, accent).
 */
export function GuitarChordDiagramClassic({
  position,
  title,
  className = "",
  headerStart,
  headerEnd,
}: Props) {
  const fretsParsed = parseFretLine(position.frets);
  const { startFret, numRows } = getFretWindow(fretsParsed);
  const fingers = position.fingers.padEnd(STRING_COUNT, "0").slice(0, STRING_COUNT);

  const barreSpan =
    position.barres != null ? barreStringSpan(fretsParsed, position.barres) : null;

  /** Tel aralığı < perde aralığı; üst sıkıştırıldığında alt boşluğu doldurmak için perdeler biraz büyük tutulur. */
  const strW = 25;
  const rowH = 35;
  /** Üst eşik (nut): ince çubuk; kalın dikdörtgen görünümünü azaltır. */
  const nutH = 6;
  /** × / ○ işaretleri (nut üstü); fazla boşluk vermemek için kısa tutulur. */
  const topH = 17;
  /** Sol dış boşluk + perde numarası sütunu (her satırda gerçek perde no). */
  const padXOuter = 4;
  const fretLabelW = 18;
  const gridLeft = padXOuter + fretLabelW;
  /** Sağ yatay boşluk. */
  const padXRight = 6;
  /** Üst: başlık ile ×/○ arası; alt: son perde altı (fazla boşluk bırakmadan). */
  const padYTop = 3;
  const padYBottom = 4;
  const cell = Math.min(strW, rowH);
  const dotR = Math.round(cell * 0.36);
  const openR = Math.max(4.5, Math.round(cell * 0.22));
  const barreH = Math.max(9, Math.round(rowH * 0.34));

  const gridW = STRING_COUNT * strW;
  const gridH = topH + nutH + numRows * rowH;
  const w = gridLeft + gridW + padXRight;
  const h = padYTop + gridH + padYBottom;

  const baseY = padYTop;

  let barreRect: { x: number; y: number; width: number; height: number; ry: number } | null = null;
  if (position.barres != null && barreSpan) {
    const fretRow = position.barres - startFret;
    if (fretRow >= 0 && fretRow < numRows) {
      const cy = baseY + topH + nutH + fretRow * rowH + rowH / 2;
      const x = gridLeft + barreSpan.from * strW + strW * 0.1;
      const width = (barreSpan.to - barreSpan.from + 1) * strW - strW * 0.2;
      barreRect = { x, y: cy - barreH / 2, width, height: barreH, ry: barreH / 2 };
    }
  }

  return (
    <div
      className={`inline-flex flex-col items-stretch rounded-xl border border-border bg-bg ${className}`}
      role="img"
      aria-label={`${title} gitar akoru`}
    >
      <div className="relative border-b border-border bg-surface/80">
        <p className="px-2 py-1 text-center text-sm font-semibold leading-none tabular-nums tracking-tight text-foreground">
          {title}
        </p>
        {headerStart ? (
          <div className="absolute inset-y-0 left-0 z-[1] flex items-center pl-0.5">{headerStart}</div>
        ) : null}
        {headerEnd ? (
          <div className="absolute inset-y-0 right-0 z-[1] flex items-center pr-0.5">{headerEnd}</div>
        ) : null}
      </div>
      <div className="flex justify-center px-1 pb-1.5 pt-0.5">
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          className="block max-w-full text-foreground"
          focusable="false"
        >
          <title>{title}</title>

          {/* Nut (perde alanının arkasında) */}
          <rect
            x={gridLeft}
            y={baseY + topH}
            width={gridW}
            height={nutH}
            className="fill-[rgb(var(--color-surface))] stroke-foreground"
            strokeWidth={1.25}
            rx={0.5}
          />

          {/* Perde çizgileri (yatay) */}
          {Array.from({ length: numRows }, (_, r) => {
            const y = baseY + topH + nutH + (r + 1) * rowH;
            return (
              <line
                key={`h-${r}`}
                x1={gridLeft}
                x2={gridLeft + gridW}
                y1={y}
                y2={y}
                className="stroke-[rgb(var(--color-border))]"
                strokeWidth={1}
                opacity={0.8}
              />
            );
          })}

          {/* Altı tel: her biri parmak dairesiyle aynı x (tel merkezi); kalın/ince E biraz daha belirgin. */}
          {Array.from({ length: STRING_COUNT }, (_, s) => {
            const x = gridLeft + s * strW + strW / 2;
            const yTop = baseY + 2;
            const yBot = baseY + topH + nutH + numRows * rowH;
            const thick = s === 0 || s === STRING_COUNT - 1;
            return (
              <line
                key={`str-${s}`}
                x1={x}
                x2={x}
                y1={yTop}
                y2={yBot}
                className="stroke-[rgb(var(--color-border))]"
                strokeWidth={thick ? 2.1 : 1.15}
                opacity={thick ? 0.95 : 0.88}
              />
            );
          })}

          {/* Sustur / açık (tellerin üstünde) */}
          {Array.from({ length: STRING_COUNT }, (_, s) => {
            const v = fretsParsed[s] ?? "mute";
            const cx = gridLeft + s * strW + strW / 2;
            const cy = baseY + topH / 2;
            if (v === "mute") {
              return (
                <text
                  key={`top-${s}`}
                  x={cx}
                  y={cy + 3}
                  textAnchor="middle"
                  className="fill-muted text-[12px] font-bold"
                >
                  ×
                </text>
              );
            }
            if (v === "open") {
              return (
                <circle
                  key={`top-${s}`}
                  cx={cx}
                  cy={cy}
                  r={openR}
                  className="fill-none stroke-foreground"
                  strokeWidth={1.5}
                />
              );
            }
            return null;
          })}

          {/* Perde numaraları: her yatay sıra = gerçek perde (startFret …). */}
          {Array.from({ length: numRows }, (_, r) => {
            const fretNum = startFret + r;
            const yMid = baseY + topH + nutH + r * rowH + rowH / 2;
            return (
              <text
                key={`fret-nr-${r}`}
                x={padXOuter + fretLabelW / 2}
                y={yMid}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-muted text-[10px] font-semibold tabular-nums"
              >
                {fretNum}
              </text>
            );
          })}

          {barreRect ? (
            <rect
              x={barreRect.x}
              y={barreRect.y}
              width={barreRect.width}
              height={barreRect.height}
              ry={barreRect.ry}
              className="fill-[rgb(var(--color-accent))] opacity-90 stroke-[rgb(var(--color-accent-muted))]"
              strokeWidth={1}
            />
          ) : null}

          {Array.from({ length: STRING_COUNT }, (_, s) => {
            const v = fretsParsed[s] ?? "mute";
            if (v === "mute" || v === "open") return null;
            const fretRow = v - startFret;
            if (fretRow < 0 || fretRow >= numRows) return null;

            const atBarre = position.barres != null && v === position.barres;
            if (atBarre) return null;

            const cx = gridLeft + s * strW + strW / 2;
            const cy = baseY + topH + nutH + fretRow * rowH + rowH / 2;
            const fg = fingers[s] ?? "0";
            const showFinger = fg && fg !== "0";

            return (
              <g key={`dot-${s}`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={dotR}
                  className="fill-[rgb(var(--color-accent))] stroke-[rgb(var(--color-accent-muted))]"
                  strokeWidth={1}
                />
                {showFinger ? (
                  <text
                    x={cx}
                    y={cy + Math.max(3, Math.round(dotR * 0.38))}
                    textAnchor="middle"
                    className="fill-[rgb(var(--color-accent-foreground))] text-[11px] font-bold tabular-nums"
                  >
                    {fg}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
