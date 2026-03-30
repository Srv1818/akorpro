/**
 * Env tabanlı feature flags — riskli özellikleri açıp kapatmak için.
 *
 * Kullanım:
 *   import { isFeatureEnabled } from "@/lib/feature-flags";
 *   if (isFeatureEnabled("experimental")) { ... }
 */

const FLAGS = {
  experimental: "NEXT_PUBLIC_ENABLE_EXPERIMENTAL_FEATURES",
  newEditor: "NEXT_PUBLIC_ENABLE_NEW_EDITOR",
  aiSuggestions: "NEXT_PUBLIC_ENABLE_AI_SUGGESTIONS",
} as const;

export type FeatureFlag = keyof typeof FLAGS;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const envKey = FLAGS[flag];
  return process.env[envKey] === "true" || process.env[envKey] === "1";
}
