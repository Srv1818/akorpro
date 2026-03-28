"use client";

import type { ReactNode } from "react";
import { PreviewToolsProvider } from "@/lib/stores/preview-tools-store";

export function PreviewShell({
  instanceKey,
  initialTranspose,
  initialScaleId = null,
  children,
}: {
  instanceKey: string;
  initialTranspose: number;
  initialScaleId?: string | null;
  children: ReactNode;
}) {
  return (
    <PreviewToolsProvider
      instanceKey={instanceKey}
      initialTranspose={initialTranspose}
      initialScaleId={initialScaleId}
    >
      {children}
    </PreviewToolsProvider>
  );
}
