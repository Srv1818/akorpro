"use client";

import { memo, useCallback, useRef, type KeyboardEvent as ReactKeyboardEvent } from "react";
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

  const groupRef = useRef<SVGSVGElement>(null);
  const activeCoIdx = CO5_PITCH_CLASSES.findIndex((p) => p === tonalCenter);

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<SVGSVGElement>) => {
      let next = activeCoIdx;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        next = (activeCoIdx + 1) % 12;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        next = (activeCoIdx + 11) % 12;
      } else if (e.key === "Home") {
        e.preventDefault();
        next = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        next = 11;
      } else {
        return;
      }
      setTonal(CO5_PITCH_CLASSES[next]);
    },
    [activeCoIdx, setTonal],
  );

  return (
    <div className={className}>
      <p className="mb-2 text-xs text-muted" id="co5-desc">
        5&apos;li çember — tıklayınca veya ok tuşlarıyla tonal merkez güncellenir; fretboard aynı state&apos;i okur.
      </p>
      <svg
        ref={groupRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="mx-auto max-w-full text-foreground"
        role="radiogroup"
        aria-label="Beşli çember — tonal merkez seçimi"
        aria-describedby="co5-desc"
        tabIndex={0}
        onKeyDown={handleKeyDown}
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
          aria-live="polite"
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
            <g
              key={pc}
              role="radio"
              aria-checked={active}
              aria-label={CO5_LABELS[i]}
              className="cursor-pointer"
              onClick={() => setTonal(pc)}
            >
              <circle
                cx={x}
                cy={y}
                r={rHit}
                fill={active ? "var(--accent)" : "var(--surface)"}
                stroke="var(--border)"
                strokeWidth={active ? 2.5 : 1.5}
                className="transition hover:opacity-90"
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
