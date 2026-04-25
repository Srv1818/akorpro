import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/auth/server-session";

const adminNav = [
  { href: "/admin", label: "Pano" },
  { href: "/admin/akor-kutuphanesi", label: "Akorlar" },
  { href: "/admin/metod", label: "Metodlar" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getServerSessionUser();
  if (!user?.admin) {
    redirect("/giris?returnTo=/admin");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-border pb-4">
        <span className="mr-3 rounded-md bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
          ADMIN
        </span>
        <nav className="flex flex-wrap gap-1" aria-label="Admin menü">
          {adminNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition hover:bg-surface hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto">
          <Link
            href="/admin/yeni-sarki"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-muted"
          >
            Yeni şarkı ekle
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}
