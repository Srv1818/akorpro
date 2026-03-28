import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-medium text-accent">404</p>
      <h1 className="mt-2 text-2xl font-bold text-foreground">Sayfa bulunamadı</h1>
      <p className="mt-3 text-sm text-muted">
        Aradığınız adres taşınmış, silinmiş veya hiç var olmamış olabilir. Kanonik şarkı yolları{" "}
        <code className="rounded bg-surface px-1 font-mono text-xs">/akor/…/…</code> biçimindedir.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-muted"
        >
          Ana sayfa
        </Link>
        <Link href="/gitar-akorlari" className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-surface">
          Tüm şarkılar
        </Link>
        <Link href="/kesfet" className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-surface">
          Keşfet
        </Link>
      </div>
    </div>
  );
}
