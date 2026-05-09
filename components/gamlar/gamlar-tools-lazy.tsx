"use client";

import dynamic from "next/dynamic";

const GamlarToolsDynamic = dynamic(
  () => import("./gamlar-tools").then((m) => m.GamlarTools),
  { ssr: false },
);

export function GamlarToolsLazy() {
  return <GamlarToolsDynamic />;
}
