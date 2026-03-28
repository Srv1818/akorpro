"use client";

type AdSlotProps = {
  slotId: string;
  format?: "horizontal" | "vertical" | "rectangle";
  className?: string;
};

const MIN_HEIGHTS: Record<string, string> = {
  horizontal: "min-h-[90px]",
  vertical: "min-h-[600px]",
  rectangle: "min-h-[250px]",
};

/**
 * Reserved ad container with fixed min-height to prevent CLS.
 * Skeleton stays visible until a real ad fills the slot.
 * If adblock is active the skeleton gracefully remains as empty space
 * (no layout shift, no stuck spinner).
 */
export function AdSlot({ slotId, format = "rectangle", className }: AdSlotProps) {
  const height = MIN_HEIGHTS[format];

  return (
    <aside
      id={`ad-${slotId}`}
      aria-label="Reklam"
      className={`flex items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-surface/50 ${height} ${className ?? ""}`}
    >
      <span className="text-xs text-muted/40 select-none">Reklam alanı</span>
    </aside>
  );
}
