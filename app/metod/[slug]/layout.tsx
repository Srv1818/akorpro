"use client";

import { usePathname } from "next/navigation";

export default function MetodDetayLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div
      key={pathname}
      className="fixed inset-0 z-[100] overflow-auto bg-bg [animation:page-open_0.35s_cubic-bezier(0.22,1,0.36,1)_both]"
    >
      {children}
    </div>
  );
}
