"use client";

import { memo } from "react";
import { CO5_LABELS, CO5_PITCH_CLASSES } from "@/lib/music/note-utils";
import { usePreviewToolsStore } from "@/lib/stores/preview-tools-store";

type Props = {
  variant?: "widget" | "full";
  className?: string;
};

function CircleOfFifthsInner({ variant = "widget", className = "" }: Props) {
  const tonalCenter = usePreviewToolsStore((s) => s.tonalCenterIndex);
  const setTonal = usePreviewToolsStore((s) => s.setTonalCenterIndex);

  const size = variant === "full" ? 340 : 220;
  const cx = size / 2;
  const cy = size / 2;
  const rRing = size * 0.36;
  const rHit = variant === "full" ? 26 : 20;

  const centerLabelIdx = CO5_PITCH_CLASSES.findIndex((p) => p === tonalCenter);
  const centerLabel = centerLabelIdx >= 0 ? CO5_LABELS[centerLabelIdx] : "?";

  return (
    <div className={className}>
      <p className="mb-2 text-xs text-muted">
        5&apos;li çember — tıklayınca tonal merkez güncellenir (Preview store); fretboard aynı state&apos;i okur.
      </p>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="mx-auto max-w-full text-foreground"
        role="img"
        aria-label="Beşli çember — tonal merkez seçimi"
      >
        <title>Beşli çember</title>
        <circle cx={cx} cy={cy} r={rRing + rHit + 8} fill="var(--bg)" stroke="var(--border)" strokeWidth={1} />
        <circle cx={cx} cy={cy} r={rRing * 0.45} fill="var(--surface)" stroke="var(--border)" strokeWidth={1} />
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          className="fill-muted-foreground pointer-events-none select-none text-[10px] font-medium"
        >
          Merkez
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          className="pointer-events-none select-none text-sm font-semibold fill-current"
        >
          {centerLabel}
        </text>
        {CO5_PITCH_CLASSES.map((pc, i) => {
          const angleDeg = i * 30 - 90;
          const rad = (angleDeg * Math.PI) / 180;
          const x = cx + rRing * Math.cos(rad);
          const y = cy + rRing * Math.sin(rad);
          const active = tonalCenter === pc;
          return (
            <g key={pc}>
              <circle
                cx={x}
                cy={y}
                r={rHit}
                fill={active ? "var(--accent)" : "var(--surface)"}
                stroke="var(--border)"
                strokeWidth={1.5}
                className="cursor-pointer transition hover:opacity-90"
                onClick={() => setTonal(pc)}
                aria-pressed={active}
              />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className={`pointer-events-none select-none text-[11px] font-bold sm:text-xs ${active ? "fill-[var(--accent-foreground)]" : "fill-current"}`}
              >
                {CO5_LABELS[i]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export const CircleOfFifths = memo(CircleOfFifthsInner);
