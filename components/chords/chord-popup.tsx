"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { GuitarChordDiagramClassic } from "@/components/chords/guitar-chord-diagram-classic";
import { resolveChordTokenToFingering } from "@/lib/music/chord-fingering";

type Props = {
  token: string;
  anchor: DOMRect | null;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

const GAP = 8;
const POPUP_W = 210;

export function ChordPopup({ token, anchor, onClose, onMouseEnter, onMouseLeave }: Props) {
  const [posIdx, setPosIdx] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: "hidden" });
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setPosIdx(0); }, [token]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useLayoutEffect(() => {
    if (!mounted || !popupRef.current) return;
    const popupH = popupRef.current.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top: number;
    let left: number;

    if (anchor) {
      // Center horizontally on anchor, flip if needed
      left = anchor.left + anchor.width / 2 - POPUP_W / 2;
      left = Math.max(8, Math.min(left, vw - POPUP_W - 8));

      // Open below anchor; if not enough room, open above
      if (anchor.bottom + GAP + popupH <= vh) {
        top = anchor.bottom + GAP;
      } else {
        top = anchor.top - GAP - popupH;
      }
      top = Math.max(8, top);
    } else {
      // Fallback: center
      top = Math.max(8, (vh - popupH) / 2);
      left = Math.max(8, (vw - POPUP_W) / 2);
    }

    setStyle({ position: "fixed", top, left, width: POPUP_W });
  }, [mounted, anchor, posIdx]);

  const guitarResolved = resolveChordTokenToFingering(token);
  const guitarPositions = guitarResolved.chord?.positions ?? [];

  const guitarPos = guitarPositions[posIdx] ?? guitarPositions[0] ?? null;

  const positions = guitarPositions;
  const total = positions.length;

  const navBtn = useCallback((dir: "prev" | "next") => {
    setPosIdx((i) => dir === "prev" ? (i - 1 + total) % total : (i + 1) % total);
  }, [total]);

  if (!mounted) return null;

  const navStart = total > 1 ? (
    <button type="button" onClick={() => navBtn("prev")} aria-label="Önceki pozisyon"
      className="flex size-6 items-center justify-center rounded text-muted transition hover:bg-white/10 hover:text-foreground">
      <ChevronLeft className="size-4" strokeWidth={2} />
    </button>
  ) : null;

  const navEnd = total > 1 ? (
    <div className="flex items-center gap-0.5 pr-0.5">
      <span className="text-[10px] font-semibold tabular-nums text-muted">{Math.min(posIdx + 1, total)}/{total}</span>
      <button type="button" onClick={() => navBtn("next")} aria-label="Sonraki pozisyon"
        className="flex size-6 items-center justify-center rounded text-muted transition hover:bg-white/10 hover:text-foreground">
        <ChevronRight className="size-4" strokeWidth={2} />
      </button>
    </div>
  ) : null;

  return createPortal(
    <div
      ref={popupRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${token} akoru`}
      style={style}
      className="z-[200] rounded-2xl border border-border bg-surface shadow-2xl shadow-black/60"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
          <span className="text-sm font-bold text-foreground">{token}</span>
          <button type="button" onClick={onClose} aria-label="Kapat"
            className="flex size-6 items-center justify-center rounded-lg text-muted transition hover:bg-white/10 hover:text-foreground">
            <X className="size-3.5" strokeWidth={2} />
          </button>
        </div>

        {/* Diagram */}
        <div className="flex items-center justify-center p-3">
          {guitarPos
            ? <GuitarChordDiagramClassic position={guitarPos} title={token} headerStart={navStart} headerEnd={navEnd} />
            : <p className="py-6 text-center text-xs text-muted">Akor bulunamadı</p>
          }
        </div>
    </div>,
    document.body,
  );
}
