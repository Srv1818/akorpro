"use client";

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
};

/**
 * Klasik akor kutusu: teller dikey (sol = kalın E), perdeler aşağı.
 * Renkler tema / fretboard ile uyumlu (bg, surface, border, accent).
 */
export function GuitarChordDiagramClassic({ position, title, className = "" }: Props) {
  const fretsParsed = parseFretLine(position.frets);
  const { startFret, numRows } = getFretWindow(fretsParsed);
  const fingers = position.fingers.padEnd(STRING_COUNT, "0").slice(0, STRING_COUNT);

  const barreSpan =
    position.barres != null ? barreStringSpan(fretsParsed, position.barres) : null;

  const strW = 34;
  const topH = 22;
  const nutH = 10;
  const rowH = 26;
  const padX = 10;
  const padY = 8;

  const gridW = STRING_COUNT * strW;
  const gridH = topH + nutH + numRows * rowH;
  const w = padX * 2 + gridW;
  const h = padY * 2 + gridH;

  const baseY = padY;

  let barreRect: { x: number; y: number; width: number; height: number; ry: number } | null = null;
  if (position.barres != null && barreSpan) {
    const fretRow = position.barres - startFret;
    if (fretRow >= 0 && fretRow < numRows) {
      const cy = baseY + topH + nutH + fretRow * rowH + rowH / 2;
      const x = padX + barreSpan.from * strW + strW * 0.12;
      const width = (barreSpan.to - barreSpan.from + 1) * strW - strW * 0.24;
      barreRect = { x, y: cy - 5, width, height: 10, ry: 5 };
    }
  }

  return (
    <div
      className={`inline-flex flex-col items-stretch rounded-xl border border-border bg-bg ${className}`}
      role="img"
      aria-label={`${title} gitar akoru`}
    >
      <p className="border-b border-border bg-surface/80 px-2 py-1.5 text-center text-sm font-semibold text-foreground">
        {title}
      </p>
      <div className="flex justify-center p-2">
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          className="block max-w-full text-foreground"
          focusable="false"
        >
          <title>{title}</title>

          {/* Sustur / açık */}
          {Array.from({ length: STRING_COUNT }, (_, s) => {
            const v = fretsParsed[s] ?? "mute";
            const cx = padX + s * strW + strW / 2;
            const cy = baseY + topH / 2;
            if (v === "mute") {
              return (
                <text
                  key={`top-${s}`}
                  x={cx}
                  y={cy + 5}
                  textAnchor="middle"
                  className="fill-muted text-[15px] font-bold"
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
                  r={6}
                  className="fill-none stroke-foreground"
                  strokeWidth={1.75}
                />
              );
            }
            return null;
          })}

          {/* Nut */}
          <rect
            x={padX}
            y={baseY + topH}
            width={gridW}
            height={nutH}
            className="fill-[rgb(var(--color-surface))] stroke-[rgb(var(--color-border))]"
            strokeWidth={2}
            rx={1}
          />

          {/* Perde aralıkları (iç yatay çizgiler) */}
          {Array.from({ length: numRows }, (_, r) => {
            const y = baseY + topH + nutH + (r + 1) * rowH;
            return (
              <line
                key={`h-${r}`}
                x1={padX}
                x2={padX + gridW}
                y1={y}
                y2={y}
                className="stroke-[rgb(var(--color-border))]"
                strokeWidth={1}
                opacity={0.9}
              />
            );
          })}

          {/* Tel çizgileri */}
          {Array.from({ length: STRING_COUNT + 1 }, (_, c) => {
            const x = padX + c * strW;
            const y0 = baseY + topH + nutH;
            const y1 = y0 + numRows * rowH;
            return (
              <line
                key={`v-${c}`}
                x1={x}
                x2={x}
                y1={y0}
                y2={y1}
                className="stroke-[rgb(var(--color-border))]"
                strokeWidth={1}
                opacity={0.85}
              />
            );
          })}

          {startFret > 1 ? (
            <text
              x={6}
              y={baseY + topH + nutH + rowH / 2 + 4}
              className="fill-muted text-[11px] font-semibold tabular-nums"
            >
              {startFret}
            </text>
          ) : null}

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

            const cx = padX + s * strW + strW / 2;
            const cy = baseY + topH + nutH + fretRow * rowH + rowH / 2;
            const fg = fingers[s] ?? "0";
            const showFinger = fg && fg !== "0";

            return (
              <g key={`dot-${s}`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={11}
                  className="fill-[rgb(var(--color-accent))] stroke-[rgb(var(--color-accent-muted))]"
                  strokeWidth={1}
                />
                {showFinger ? (
                  <text
                    x={cx}
                    y={cy + 4}
                    textAnchor="middle"
                    className="fill-[rgb(var(--color-accent-foreground))] text-[12px] font-bold tabular-nums"
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
