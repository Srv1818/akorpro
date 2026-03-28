import type { ScaleDoc } from "@/lib/types/chord-library";
import scalesData from "@/data/scales.json";

/**
 * Scales data source — loaded from static JSON.
 * Can be swapped to Firestore `scales` collection in the future.
 */
export const scales: ScaleDoc[] = scalesData as ScaleDoc[];

/** Backward compatibility alias */
export const mockScales = scales.map((s) => ({
  id: s.id,
  name: s.name,
  notesC: s.notesC,
}));
