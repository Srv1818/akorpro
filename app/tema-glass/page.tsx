import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tema örneği — Glassmorphism",
  description:
    "AkorPro için neon arka plan ve buzlu cam panelli görsel deneme (koyu zemin + pembe/mor/turuncu/teal lekeler).",
  alternates: { canonical: "/tema-glass" },
  robots: { index: false, follow: false },
};

/** Referans glass: blur(20px) hissi, %8–15 opaklık, 1px açık kenar, yumuşak gölge */
function glassPanel(className?: string) {
  return [
    "rounded-2xl border shadow-xl",
    "border-white/50 bg-white/40 backdrop-blur-xl",
    "shadow-[0_8px_32px_rgb(15_23_42_/_0.12)]",
    "dark:border-white/20 dark:bg-white/[0.08] dark:shadow-[0_12px_48px_rgb(0_0_0_/_0.45)]",
    "supports-[backdrop-filter]:backdrop-blur-[20px]",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

function glassInset(className?: string) {
  return [
    "rounded-xl border",
    "border-white/40 bg-white/25 backdrop-blur-md",
    "dark:border-white/10 dark:bg-black/15 dark:backdrop-blur-md",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export default function GlassThemeDemoPage() {
  return (
    <div
      className={[
        "relative isolate min-h-[calc(100dvh-8rem)] overflow-hidden",
        /* Zemin: kömür + neon lekeler (açık modda pastel aynı aile) */
        "bg-[#eef0f7] text-slate-900",
        "dark:bg-[#06060d] dark:text-zinc-100",
      ].join(" ")}
    >
      {/* Büyük yumuşak neon blob’lar — görseldeki pembe / mor / turuncu / teal */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-20 top-[-10%] h-[22rem] w-[22rem] rounded-full bg-fuchsia-400/35 blur-[100px] dark:bg-fuchsia-600/40" />
        <div className="absolute right-[-15%] top-[5%] h-[26rem] w-[26rem] rounded-full bg-orange-400/30 blur-[100px] dark:bg-orange-500/30" />
        <div className="absolute bottom-[-5%] left-[15%] h-[20rem] w-[20rem] rounded-full bg-cyan-400/25 blur-[90px] dark:bg-teal-400/25" />
        <div className="absolute right-[20%] top-[40%] h-[18rem] w-[18rem] rounded-full bg-violet-400/30 blur-[90px] dark:bg-violet-600/35" />
        <div className="absolute left-1/3 top-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-pink-300/25 blur-3xl dark:bg-pink-500/20" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        {/* Pembe → turuncu şerit (referans sol görseldeki gradient banner) */}
        <div
          aria-hidden
          className="h-1.5 w-full rounded-full bg-gradient-to-r from-fuchsia-500 via-orange-400 to-amber-400 opacity-90 dark:from-fuchsia-500 dark:via-orange-500 dark:to-pink-500"
        />

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Dar cam “yan panel” */}
          <aside
            className={[
              glassPanel("w-full shrink-0 p-4 lg:w-52"),
              "flex flex-row gap-2 lg:flex-col lg:gap-3",
            ].join(" ")}
          >
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
              Menü
            </span>
            {["Keşfet", "Listeler", "Beğenilenler"].map((label) => (
              <span
                key={label}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-800 dark:text-zinc-200"
              >
                {label}
              </span>
            ))}
          </aside>

          <div className="min-w-0 flex-1 space-y-8">
            <header className={glassPanel("p-8 sm:p-10")}>
              <p className="text-xs font-semibold uppercase tracking-widest text-fuchsia-700 dark:text-fuchsia-300/90">
                Görsel deneme
              </p>
              <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Glassmorphism — neon palet
              </h1>
              <p className="mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-slate-700 dark:text-zinc-300 sm:text-base">
                Koyu kömür zemin üzerinde{" "}
                <span className="font-medium text-slate-900 dark:text-white">
                  pembe, mor, turuncu ve teal
                </span>{" "}
                yumuşak lekeler; paneller{" "}
                <code className="rounded bg-black/5 px-1 font-mono text-xs dark:bg-white/10">
                  backdrop-blur
                </code>{" "}
                ve ince{" "}
                <span className="whitespace-nowrap text-cyan-600 dark:text-cyan-300">
                  rgba(255,255,255,0.2)
                </span>{" "}
                kenarlık ile üst üste biniyor.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-fuchsia-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/25 transition hover:opacity-95 dark:from-fuchsia-600 dark:to-orange-500 dark:shadow-fuchsia-900/40"
                >
                  Ana sayfaya dön
                </Link>
                <span
                  className="inline-flex items-center rounded-xl border border-white/30 bg-white/20 px-4 py-2.5 text-sm text-slate-700 backdrop-blur-md dark:border-white/15 dark:bg-white/5 dark:text-zinc-300"
                  role="note"
                >
                  Tema: üst menü anahtarı
                </span>
              </div>
            </header>

            <div className="grid gap-6 sm:grid-cols-2">
              <section className={glassPanel("flex flex-col p-6 sm:p-8")}>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-50">
                  Çalma sırası
                </h2>
                <ul className="mt-4 space-y-3 text-sm">
                  {[
                    { title: "Örnek şarkı bir", meta: "Sanatçı A · Maj" },
                    { title: "Örnek şarkı iki", meta: "Sanatçı B · Min" },
                    { title: "Örnek şarkı üç", meta: "Sanatçı C · 7" },
                  ].map((row) => (
                    <li key={row.title} className={glassInset("flex items-center justify-between gap-3 px-3 py-2.5")}>
                      <span className="truncate font-medium text-slate-900 dark:text-zinc-100">
                        {row.title}
                      </span>
                      <span className="shrink-0 text-xs text-slate-600 dark:text-zinc-400">
                        {row.meta}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className={glassPanel("flex flex-col justify-between p-6 sm:p-8")}>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-50">
                    Küçük kartlar
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-zinc-300">
                    Mobil örnekteki gibi pastel vurgu: cam üstünde düşük opaklık renk.
                  </p>
                </div>
                <div className="mt-6 flex gap-3">
                  <div
                    className={[
                      "flex flex-1 flex-col justify-center rounded-xl border border-lime-300/50 bg-lime-400/20 px-3 py-3 text-center backdrop-blur-md",
                      "dark:border-lime-400/30 dark:bg-lime-400/15",
                    ].join(" ")}
                  >
                    <div className="text-2xl font-semibold tabular-nums text-lime-900 dark:text-lime-100">
                      1.2k
                    </div>
                    <div className="text-xs text-lime-800/80 dark:text-lime-200/80">dinlenme</div>
                  </div>
                  <div
                    className={[
                      "flex flex-1 flex-col justify-center rounded-xl border border-pink-300/50 bg-pink-400/20 px-3 py-3 text-center backdrop-blur-md",
                      "dark:border-pink-400/30 dark:bg-pink-500/15",
                    ].join(" ")}
                  >
                    <div className="text-2xl font-semibold tabular-nums text-pink-900 dark:text-pink-100">
                      48
                    </div>
                    <div className="text-xs text-pink-900/80 dark:text-pink-200/80">liste</div>
                  </div>
                </div>
              </section>
            </div>

            {/* Cam “oynatıcı çubuğu” — dock hissi */}
            <div
              className={[
                "flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/40 bg-white/35 px-4 py-3 backdrop-blur-2xl",
                "dark:border-white/15 dark:bg-white/[0.06] dark:shadow-[0_-4px_40px_rgb(0_0_0_/_0.35)]",
                "shadow-[0_8px_40px_rgb(15_23_42_/_0.15)]",
              ].join(" ")}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-zinc-100">
                  Şimdi çalıyor (örnek)
                </p>
                <p className="truncate text-xs text-slate-600 dark:text-zinc-400">
                  Sanatçı · Albüm
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/30 text-slate-800 backdrop-blur-md dark:border-white/10 dark:bg-white/10 dark:text-zinc-200"
                  aria-label="Geri"
                >
                  <span aria-hidden className="text-lg">
                    ‹
                  </span>
                </button>
                <button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400 text-slate-900 shadow-lg shadow-cyan-500/30 dark:bg-cyan-400 dark:text-zinc-950 dark:shadow-cyan-500/20"
                  aria-label="Oynat"
                >
                  <span aria-hidden className="ml-0.5 text-lg">
                    ▶
                  </span>
                </button>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/30 text-slate-800 backdrop-blur-md dark:border-white/10 dark:bg-white/10 dark:text-zinc-200"
                  aria-label="İleri"
                >
                  <span aria-hidden className="text-lg">
                    ›
                  </span>
                </button>
                <button
                  type="button"
                  className="hidden h-10 w-10 items-center justify-center rounded-full border border-fuchsia-400/50 bg-fuchsia-500/20 text-fuchsia-800 backdrop-blur-md sm:flex dark:border-fuchsia-400/40 dark:bg-fuchsia-600/25 dark:text-fuchsia-100"
                  aria-label="Beğen"
                >
                  <span aria-hidden className="text-sm">
                    ♥
                  </span>
                </button>
              </div>
            </div>

            <footer
              className={[
                glassPanel("p-5 text-center text-xs"),
                "text-slate-600 dark:text-zinc-500",
              ].join(" ")}
            >
              Tasarım denemesi; dizine eklenmez. Neon palet referans görsellere göre ayarlandı.
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
