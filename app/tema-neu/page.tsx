import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tema örneği — Neumorphism",
  description:
    "AkorPro için referans soft UI paleti: #E0E5EC yüzey, A3B1C6 gölge, mor ve turkuaz vurgular.",
  alternates: { canonical: "/tema-neu" },
  robots: { index: false, follow: false },
};

/**
 * Referans palet (Smart Home / soft UI):
 * - Yüzey = zemin: #E0E5EC
 * - Gölge koyu: rgb(163,177,198) sağ-alt · açık: beyaz sol-üst
 * - Metin: #44475A · Mor: #6D5DFC · Turkuaz (açık): #2DD4BF
 */

/** Kabarık — çift gölge: koyu modda sol-üst açık vurgu + sağ-alt gölge (derinlik) */
function neuRaised(className?: string) {
  return [
    "rounded-[30px]",
    "bg-[#E0E5EC] text-[#44475A]",
    "shadow-[9px_9px_16px_rgb(163_177_198_/_0.6),-9px_-9px_16px_rgb(255_255_255_/_0.5)]",
    "ring-1 ring-black/[0.03] dark:ring-white/10",
    /* Koyu: yüzey zeminden bir tık açık + belirgin çift gölge */
    "dark:bg-[#2f3342] dark:text-zinc-200",
    "dark:shadow-[14px_14px_28px_rgb(0_0_0_/_0.58),-10px_-10px_24px_rgb(255_255_255_/_0.12)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Çökük / inset — koyu modda hem üst-sol koyu hem alt-sağ açık (oyuk hissi) */
function neuInset(className?: string) {
  return [
    "rounded-[24px]",
    "bg-[#E0E5EC] text-[#44475A]",
    "shadow-[inset_9px_9px_16px_rgb(163_177_198_/_0.6),inset_-9px_-9px_16px_rgb(255_255_255_/_0.5)]",
    "dark:bg-[#16181f] dark:text-zinc-300",
    "dark:shadow-[inset_11px_11px_22px_rgb(0_0_0_/_0.62),inset_-9px_-9px_20px_rgb(255_255_255_/_0.1)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Küçük kabarık (düğüm / thumb) */
function neuRaisedSm(className?: string) {
  return [
    "rounded-xl",
    "bg-[#E0E5EC]",
    "shadow-[6px_6px_12px_rgb(163_177_198_/_0.55),-4px_-4px_10px_rgb(255_255_255_/_0.55)]",
    "ring-1 ring-black/[0.04] dark:ring-white/12",
    "dark:bg-[#363a4a]",
    "dark:shadow-[9px_9px_18px_rgb(0_0_0_/_0.52),-7px_-7px_16px_rgb(255_255_255_/_0.11)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

function NeuCircleButton({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      className={[
        "relative flex h-14 w-14 items-center justify-center rounded-full text-sm font-semibold",
        "bg-[#E0E5EC] text-[#44475A]",
        "border border-[#6D5DFC]/35 dark:border-[#8B7BFF]/55",
        "shadow-[6px_6px_14px_rgb(163_177_198_/_0.55),-5px_-5px_12px_rgb(255_255_255_/_0.55)]",
        "ring-1 ring-black/[0.04] dark:ring-white/12",
        "transition hover:brightness-[1.02] active:shadow-[inset_4px_4px_10px_rgb(163_177_198_/_0.45)]",
        "dark:bg-[#363a4a] dark:text-zinc-100",
        "dark:shadow-[9px_9px_18px_rgb(0_0_0_/_0.52),-7px_-7px_16px_rgb(255_255_255_/_0.11)]",
        "dark:active:shadow-[inset_5px_5px_12px_rgb(0_0_0_/_0.5),inset_-4px_-4px_10px_rgb(255_255_255_/_0.06)]",
        active ? "ring-2 ring-[#6D5DFC]/80" : "",
      ].join(" ")}
      aria-label={label}
      aria-pressed={active}
    >
      <span className="select-none" aria-hidden>
        ♪
      </span>
      {active ? (
        <span
          className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-[#6D5DFC]"
          aria-hidden
        />
      ) : null}
    </button>
  );
}

/** Statik neu toggle örnekleri (mor + turkuaz aksan) */
function NeuToggleDemo({ on }: { on: boolean }) {
  return (
    <div
      className={[
        "flex h-12 w-[5.5rem] items-center rounded-full p-1.5",
        neuInset("!rounded-full border border-[#6D5DFC]/25 dark:border-[#8B7BFF]/40"),
      ].join(" ")}
    >
      <div className={`flex w-full ${on ? "justify-end" : "justify-start"}`}>
        <span
          className={[
            "flex h-9 w-9 items-center justify-center rounded-full",
            neuRaisedSm("!rounded-full border border-[#2DD4BF]/40 dark:border-[#2DD4BF]/60"),
          ].join(" ")}
          aria-hidden
        >
          {on ? (
            <span className="h-3 w-3 rounded-full bg-[#2DD4BF]" />
          ) : (
            <span className="h-3 w-3 rounded-full bg-slate-400/90" />
          )}
        </span>
      </div>
    </div>
  );
}

/** Dikey ekolayzer — çökük kanal + kabarık tutamak */
function NeuEqualizerBar({ heightPct }: { heightPct: number }) {
  return (
    <div
      className={[
        "flex h-36 w-10 items-end justify-center rounded-2xl pb-2 pt-3",
        neuInset("!rounded-2xl"),
      ].join(" ")}
    >
      <div
        style={{ height: `${heightPct}%` }}
        className={[
          "w-6 min-h-[18%] rounded-md",
          neuRaisedSm("!rounded-md"),
          "border-2 border-[#6D5DFC]/30",
        ].join(" ")}
        aria-hidden
      />
    </div>
  );
}

export default function NeumorphismDemoPage() {
  return (
    <div
      className={[
        "min-h-[calc(100dvh-8rem)]",
        /* Zemin = yüzey rengi (referans tek ton) */
        "bg-[#E0E5EC] text-[#44475A]",
        "dark:bg-[#1a1d26] dark:text-zinc-300",
      ].join(" ")}
    >
      <div className="mx-auto max-w-4xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
        <header className={neuRaised("p-8 sm:p-10")}>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#44475A]/70 dark:text-zinc-500">
            Görsel deneme
          </p>
          <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight text-[#44475A] dark:text-zinc-50 sm:text-4xl">
            Neumorphism — referans palet
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-[#44475A]/95 dark:text-zinc-400 sm:text-base">
            Yüzey ve kartlar aynı{" "}
            <span className="font-medium text-[#44475A] dark:text-zinc-200">#E0E5EC</span> tonu;
            derinlik{" "}
            <span className="whitespace-nowrap font-mono text-xs text-[#6D5DFC] dark:text-violet-400">
              rgb(163,177,198)
            </span>{" "}
            + beyaz çift gölge ile. Aktif vurgu{" "}
            <span className="text-[#6D5DFC] dark:text-violet-400">mor</span>, açık durum{" "}
            <span className="text-teal-500 dark:text-teal-400">turkuaz</span>.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className={[
                "inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold",
                "bg-[#E0E5EC] text-[#44475A]",
                "shadow-[6px_6px_14px_rgb(163_177_198_/_0.55),-4px_-4px_12px_rgb(255_255_255_/_0.55)]",
                "ring-2 ring-[#6D5DFC]/40 transition hover:brightness-[1.03] active:shadow-[inset_3px_3px_8px_rgb(163_177_198_/_0.45)]",
                "dark:bg-[#2f3342] dark:text-zinc-100 dark:ring-violet-500/50",
                "dark:shadow-[12px_12px_24px_rgb(0_0_0_/_0.55),-8px_-8px_18px_rgb(255_255_255_/_0.1)]",
              ].join(" ")}
            >
              Ana sayfa
            </Link>
            <Link
              href="/tema-glass"
              className="inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-medium text-[#6D5DFC] underline-offset-4 hover:underline dark:text-violet-400"
            >
              Glassmorphism örneği
            </Link>
          </div>
        </header>

        <div className="grid gap-6 sm:grid-cols-2">
          <section className={neuRaised("p-6 sm:p-8")}>
            <h2 className="text-lg font-bold text-[#44475A] dark:text-zinc-50">
              Kabartmalı kontroller
            </h2>
            <p className="mt-2 text-sm text-[#44475A]/85 dark:text-zinc-400">
              Mor halka ve nokta aktif durumu; tıklanınca gölge içe gömülür.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <NeuCircleButton label="Kanal 1" />
              <NeuCircleButton label="Kanal 2 — aktif" active />
              <NeuCircleButton label="Kanal 3" />
            </div>
          </section>

          <section className={neuRaised("flex flex-col justify-between gap-6 p-6 sm:p-8")}>
            <div>
              <h2 className="text-lg font-bold text-[#44475A] dark:text-zinc-50">
                Akıllı ev — toggle
              </h2>
              <p className="mt-2 text-sm text-[#44475A]/85 dark:text-zinc-400">
                Çökük kanal; açık durumda turkuaz, kapalıda nötr gri nokta.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-8">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-[#44475A]/70 dark:text-zinc-500">
                  Salon
                </span>
                <NeuToggleDemo on />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-[#44475A]/70 dark:text-zinc-500">
                  Mutfak
                </span>
                <NeuToggleDemo on={false} />
              </div>
            </div>
          </section>
        </div>

        <section className={neuRaised("p-6 sm:p-8")}>
          <h2 className="text-lg font-bold text-[#44475A] dark:text-zinc-50">
            Ekolayzer (çökük kanal)
          </h2>
          <p className="mt-2 text-sm text-[#44475A]/85 dark:text-zinc-400">
            Dikey inset iz, kabarık tutamak; mor çerçeve ipucu.
          </p>
          <div className="mt-6 flex items-end justify-center gap-4">
            <NeuEqualizerBar heightPct={55} />
            <NeuEqualizerBar heightPct={85} />
            <NeuEqualizerBar heightPct={40} />
            <NeuEqualizerBar heightPct={70} />
          </div>
        </section>

        <section className={neuRaised("p-6 sm:p-8")}>
          <h2 className="text-lg font-bold text-[#44475A] dark:text-zinc-50">
            Kart ızgarası
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {["Popüler", "Yeni", "Editör"].map((label) => (
              <div
                key={label}
                className={neuInset("px-3 py-4 text-center text-sm font-semibold")}
              >
                {label}
              </div>
            ))}
          </div>
        </section>

        <section className={neuRaised("p-6 sm:p-8")}>
          <h2 className="text-lg font-bold text-[#44475A] dark:text-zinc-50">
            Çökük alan
          </h2>
          <p className="mt-2 text-sm text-[#44475A]/85 dark:text-zinc-400">
            Arama veya metin — tam inset gölge.
          </p>
          <div className={neuInset("mt-5 px-4 py-3.5")}>
            <span className="text-sm text-[#44475A]/60 dark:text-zinc-500">
              Örnek placeholder…
            </span>
          </div>
        </section>

        <footer
          className={[
            neuInset("p-5 text-center text-xs"),
            "text-[#44475A]/65 dark:text-zinc-500",
          ].join(" ")}
        >
          Deneme sayfası — dizine eklenmez. Karşılaştırma:{" "}
          <Link href="/tema-glass" className="font-medium text-[#6D5DFC] underline dark:text-violet-400">
            /tema-glass
          </Link>
        </footer>
      </div>
    </div>
  );
}
