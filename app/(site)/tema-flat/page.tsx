import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tema örneği — Flat",
  description:
    "AkorPro için düz renk, gölgesiz ve geometrik (flat) arayüz deneme sayfası.",
  alternates: { canonical: "/tema-flat" },
  robots: { index: false, follow: false },
};

/** Düz yüzey: gölge yok; sınır veya renk ayrımı ile katman */
function flatPanel(className?: string) {
  return [
    "rounded-xl border border-[#E7EAF0] bg-white",
    "dark:border-zinc-800 dark:bg-[#16181d]",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export default function FlatThemeDemoPage() {
  return (
    <div
      className={[
        "min-h-[calc(100dvh-8rem)]",
        "bg-[#F5F7FB] text-[#0F172A] dark:bg-[#0F1115] dark:text-zinc-100",
      ].join(" ")}
    >
      {/* Üst şerit: referans gibi soft flat palet */}
      <div className="flex h-2 w-full">
        <div className="flex-1 bg-[#7C3AED]" aria-hidden />
        <div className="flex-1 bg-[#A78BFA]" aria-hidden />
        <div className="flex-1 bg-[#FDBA74]" aria-hidden />
        <div className="flex-1 bg-[#F9A8D4]" aria-hidden />
      </div>

      <div className="mx-auto max-w-4xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
        <header className={flatPanel("border-l-4 border-l-[#7C3AED] p-8 sm:p-10")}>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
            Görsel deneme
          </p>
          <h1 className="mt-2 text-balance text-3xl font-black tracking-tight sm:text-4xl">
            Flat (düz) arayüz
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-slate-600 dark:text-zinc-400 sm:text-base">
            Gölgeler, cam bulanıklığı veya yumuşak kabartma yok. Derinlik yerine{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              düz renk alanları, net çizgiler ve tipografi hiyerarşisi
            </span>{" "}
            kullanılır. İkonlar ve kutular geometrik; vurgu genelde tek düz marka rengiyle
            yapılır.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md bg-[#7C3AED] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Ana sayfa
            </Link>
            <Link
              href="/tema-glass"
              className="inline-flex items-center justify-center rounded-md border border-[#D7DEEA] bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-[#EEF2F8] dark:border-zinc-700 dark:bg-[#1A1D24] dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Glass
            </Link>
            <Link
              href="/tema-neu"
              className="inline-flex items-center justify-center rounded-md border border-[#D7DEEA] bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-[#EEF2F8] dark:border-zinc-700 dark:bg-[#1A1D24] dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Neumorphism
            </Link>
          </div>
        </header>

        {/* Metro tarzı karo ızgarası — tam düz dolgu */}
        <section aria-labelledby="flat-tiles-heading">
          <h2 id="flat-tiles-heading" className="sr-only">
            Renk karoları
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Keşfet", bg: "bg-[#7C3AED]", fg: "text-white" },
              { label: "Yeni", bg: "bg-[#C4B5FD]", fg: "text-[#3B2A67]" },
              { label: "Listeler", bg: "bg-[#FDBA74]", fg: "text-[#6A3414]" },
              { label: "Profil", bg: "bg-[#F9A8D4]", fg: "text-[#831843]" },
            ].map((tile) => (
              <div
                key={tile.label}
                className={[
                  "flex min-h-[5.5rem] items-end rounded-xl p-4 text-sm font-bold",
                  tile.bg,
                  tile.fg,
                ].join(" ")}
              >
                {tile.label}
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-6 sm:grid-cols-2">
          <section className={flatPanel("p-6 sm:p-8")}>
            <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-50">
              Düz liste
            </h2>
            <ul className="mt-4 space-y-0 divide-y divide-[#E7EAF0] dark:divide-zinc-700">
              {["Örnek şarkı A", "Örnek şarkı B", "Örnek şarkı C"].map((row, i) => (
                <li
                  key={row}
                  className="flex items-center gap-3 py-3 text-sm font-medium text-slate-700 dark:text-zinc-200"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#F1F4F9] text-xs font-bold text-slate-600 dark:bg-zinc-800 dark:text-zinc-300"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  {row}
                </li>
              ))}
            </ul>
          </section>

          <section className={flatPanel("flex flex-col justify-between p-6 sm:p-8")}>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-50">
                İstatistik kutuları
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
                Kartlar birbirinden yalnızca çerçeve ve arka plan rengiyle ayrılır.
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#E7EAF0] bg-[#FBFCFE] px-3 py-4 text-center dark:border-zinc-700 dark:bg-zinc-800/50">
                <div className="text-2xl font-black tabular-nums text-slate-900 dark:text-white">
                  320
                </div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  akor
                </div>
              </div>
              <div className="rounded-xl border border-[#E7EAF0] bg-white px-3 py-4 text-center dark:border-zinc-700 dark:bg-zinc-900">
                <div className="text-2xl font-black tabular-nums text-[#7C3AED]">12</div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  liste
                </div>
              </div>
            </div>
          </section>
        </div>

        <footer
          className={[
            flatPanel("p-5 text-center text-xs"),
            "text-slate-500 dark:text-zinc-500",
          ].join(" ")}
        >
          <p>
            Deneme sayfası — dizine eklenmez. Diğer örnekler:{" "}
            <Link href="/tema-glass" className="font-medium text-slate-700 underline dark:text-zinc-300">
              /tema-glass
            </Link>
            ,{" "}
            <Link href="/tema-neu" className="font-medium text-[#7C3AED] underline dark:text-violet-400">
              /tema-neu
            </Link>
            .
          </p>
        </footer>
      </div>
    </div>
  );
}
