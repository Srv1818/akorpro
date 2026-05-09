"use client";

import dynamic from "next/dynamic";

const BesliCemberToolsDynamic = dynamic(
  () => import("./besli-cember-tools").then((m) => m.BesliCemberTools),
  { ssr: false },
);

export function BesliCemberToolsLazy() {
  return <BesliCemberToolsDynamic />;
}
