import Link from "next/link";
import { footerNav } from "@/lib/nav";

export function SiteFooter() {
  const links = [...footerNav];

  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <Link href="/" className="inline-flex items-center gap-2 font-semibold text-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm text-accent-foreground">
                AP
              </span>
              AkorPro
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Gitar akorları, gamlar ve müzik teorisi araçları — okunabilir, erişilebilir ve topluluk odaklı bir
              deneyim için tasarlandı.
            </p>
          </div>
          <nav className="flex max-w-xl flex-wrap gap-x-6 gap-y-2" aria-label="Alt bağlantılar">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-muted transition hover:text-accent"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-10 border-t border-border pt-8 text-center text-xs text-muted">
          © {new Date().getFullYear()} AkorPro. Faz 2 — mock routing; auth ve içerik API&apos;si Faz 3.
        </p>
      </div>
    </footer>
  );
}
