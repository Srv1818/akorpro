import Link from "next/link";

const cards = [
  {
    href: "/kesfet",
    title: "Keşfet",
    description: "Popüler, yeni ve öne çıkan şarkılar — keşfet akışıyla çalışmaya başlayın.",
    swatch: "from-emerald-500/20 to-emerald-600/5",
  },
  {
    href: "/akor-kutuphanesi",
    title: "Akor kütüphanesi",
    description: "Pozisyonlar ve varyasyonlarla akorları inceleyin; ileride fretboard ile derinleşecek.",
    swatch: "from-zinc-400/20 to-zinc-500/5",
  },
  {
    href: "/gamlar",
    title: "Gamlar",
    description: "Ton merkezi ve gam notaları — teori ve pratiği bir arada tutan yapı taşları.",
    swatch: "from-sky-500/15 to-sky-600/5",
  },
  {
    href: "/besli-cember",
    title: "5'li çember",
    description: "İlişkileri görselleştirin; ton merkezi ve modlar için ortak bir harita.",
    swatch: "from-violet-500/15 to-violet-600/5",
  },
] as const;

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgb(var(--color-accent)_/_0.12),transparent)]"
        aria-hidden
      />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-accent">Faz 3 · Firestore</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            AkorPro&apos;ya hoş geldiniz
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">
            Şarkılar, sanatçılar ve keşfet akışı Firestore&apos;dan besleniyor. Auth, çalma listeleri ve songOverrides hazır.
          </p>
        </div>

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:gap-6">
          {cards.map((c) => (
            <li key={c.href}>
              <Link
                href={c.href}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-sm transition hover:border-accent/40 hover:shadow-md"
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${c.swatch} opacity-80 transition group-hover:opacity-100`}
                  aria-hidden
                />
                <div className="relative">
                  <h2 className="text-lg font-semibold text-foreground group-hover:text-accent">{c.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{c.description}</p>
                  <span className="mt-4 inline-flex items-center text-sm font-medium text-accent">
                    Git
                    <span className="ml-1 transition group-hover:translate-x-0.5" aria-hidden>
                      →
                    </span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-12 text-center text-sm text-muted">
          <Link href="/gitar-akorlari" className="font-medium text-accent underline-offset-4 hover:underline">
            Tüm şarkılar
          </Link>
          {" · "}
          <Link href="/arama" className="font-medium text-accent underline-offset-4 hover:underline">
            Arama
          </Link>
          {" · "}
          <Link href="/giris" className="font-medium text-accent underline-offset-4 hover:underline">
            Giriş
          </Link>{" "}
          Giriş
        </p>
      </div>
    </div>
  );
}
