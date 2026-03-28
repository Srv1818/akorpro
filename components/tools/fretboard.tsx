"use client";

import { memo, useMemo } from "react";
import { scales } from "@/data/mock/scales";
import {
  majorTriadPitchClasses,
  OPEN_STRING_PC_TOP_FIRST,
  scalePitchClassesInKey,
  PC_TO_NAME,
} from "@/lib/music/note-utils";
import { usePreviewToolsStore } from "@/lib/stores/preview-tools-store";

type Props = {
  mode: "chord" | "scale";
  maxFret?: number;
  className?: string;
};

function pitchClassAtFret(stringIndex: number, fret: number): number {
  const open = OPEN_STRING_PC_TOP_FIRST[stringIndex];
  if (open === undefined) return 0;
  return (open + fret) % 12;
}

function FretboardInner({ mode, maxFret = 12, className = "" }: Props) {
  const tonal = usePreviewToolsStore((s) => s.tonalCenterIndex);
  const scaleId = usePreviewToolsStore((s) => s.selectedScaleId);

  const activePcs = useMemo(() => {
    if (mode === "chord") return majorTriadPitchClasses(tonal);
    const scale = scales.find((sc) => sc.id === scaleId) ?? scales[0];
    if (!scale) return new Set<number>();
    return scalePitchClassesInKey(scale.notesC, tonal);
  }, [mode, tonal, scaleId]);

  const strings = 6;
  const nutW = 10;
  const fretW = 26;
  const rowH = 20;
  const labelW = 24;
  const w = labelW + nutW + fretW * maxFret;
  const h = strings * rowH + 28;

  return (
    <div className={className}>
      <p className="mb-2 text-xs text-muted">
        Fretboard ({mode === "chord" ? "akor — majör üçlü" : "gam — seçilen dizin + tonal merkez"}) · tel 1 üstte
      </p>
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className="max-w-full text-foreground"
        role="img"
        aria-label={`Gitar perdeleri, ${mode} modu`}
        focusable="false"
      >
        <title>Fretboard</title>
        <text x={4} y={16} className="fill-muted text-[10px]">
          Tel
        </text>
        {Array.from({ length: strings }, (_, sIdx) => (
          <text key={`sl-${sIdx}`} x={4} y={28 + sIdx * rowH + rowH / 2} className="fill-muted text-[9px]" dominantBaseline="middle">
            {6 - sIdx}
          </text>
        ))}
        {Array.from({ length: strings }, (_, sIdx) => {
          const y = 28 + sIdx * rowH;
          return (
            <g key={`row-${sIdx}`}>
              <rect
                x={labelW}
                y={y}
                width={nutW}
                height={rowH - 1}
                fill="var(--surface)"
                stroke="var(--border)"
                strokeWidth={1}
              />
              {Array.from({ length: maxFret }, (_, f) => {
                const fret = f + 1;
                const x = labelW + nutW + f * fretW;
                const pc = pitchClassAtFret(sIdx, fret);
                const on = activePcs.has(pc);
                return (
                  <rect
                    key={`c-${sIdx}-${fret}`}
                    x={x}
                    y={y}
                    width={fretW}
                    height={rowH - 1}
                    fill={on ? "color-mix(in srgb, var(--accent) 35%, var(--surface))" : "var(--bg)"}
                    stroke="var(--border)"
                    strokeWidth={0.75}
                    rx={2}
                  />
                );
              })}
              {(() => {
                const pc0 = pitchClassAtFret(sIdx, 0);
                const on0 = activePcs.has(pc0);
                return (
                  <circle
                    cx={labelW + nutW / 2}
                    cy={y + (rowH - 1) / 2}
                    r={Math.min(nutW, rowH) / 2 - 4}
                    fill={on0 ? "var(--accent)" : "var(--surface)"}
                    stroke="var(--border)"
                    strokeWidth={1}
                  />
                );
              })()}
            </g>
          );
        })}
        <text x={labelW + nutW / 2} y={h - 6} textAnchor="middle" className="fill-muted text-[9px]">
          0
        </text>
        {Array.from({ length: maxFret }, (_, f) => (
          <text
            key={`fn-${f}`}
            x={labelW + nutW + f * fretW + fretW / 2}
            y={h - 6}
            textAnchor="middle"
            className="fill-muted text-[9px]"
          >
            {f + 1}
          </text>
        ))}
      </svg>
      {/* Screen-reader data table alternative */}
      <table className="sr-only">
        <caption>
          Fretboard — aktif notalar ({mode === "chord" ? "akor" : "gam"} modu)
        </caption>
        <thead>
          <tr>
            <th scope="col">Tel</th>
            {Array.from({ length: maxFret + 1 }, (_, f) => (
              <th key={f} scope="col">Perde {f}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: strings }, (_, sIdx) => (
            <tr key={sIdx}>
              <th scope="row">Tel {6 - sIdx}</th>
              {Array.from({ length: maxFret + 1 }, (_, f) => {
                const pc = pitchClassAtFret(sIdx, f);
                const on = activePcs.has(pc);
                return (
                  <td key={f}>{on ? PC_TO_NAME[pc] : "—"}</td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const Fretboard = memo(FretboardInner);
