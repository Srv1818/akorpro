import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/content/page-header";
import { mockChordShapes } from "@/data/mock/chord-library";
import { chordPath } from "@/lib/paths";

export const metadata: Metadata = {
  title: "Akor kütüphanesi",
  description: "Akor pozisyonları ve varyasyon şeması örneği — sunucu metni; interaktif fretboard Faz 1 bileşeni ile genişletilecek.",
};

export default function AkorKutuphanesiPage() {
  return (
    <>
      <PageHeader
        title="Akor kütüphanesi"
        description="Admin yazımlı kütüphane ve importer (Faz 3–6). Bu sayfada yalnızca mock tablo ve açıklayıcı metin sunucuda render edilir."
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="border-b border-border bg-bg text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Akor</th>
                <th className="px-4 py-3 font-medium">Kök</th>
                <th className="px-4 py-3 font-medium">Kalite</th>
                <th className="px-4 py-3 font-medium">Parmak / tel</th>
              </tr>
            </thead>
            <tbody>
              {mockChordShapes.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-chord-major">{c.root}</td>
                  <td className="px-4 py-3 capitalize text-muted">{c.quality}</td>
                  <td className="px-4 py-3 font-mono text-sm text-foreground">{c.fingering}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 text-sm text-muted">
          Örnek şarkı bağlamı için{" "}
          <Link href={chordPath("duman", "kufi")} className="font-medium text-accent hover:underline">
            Duman — Kufi
          </Link>{" "}
          sayfasına gidin.
        </p>
      </div>
    </>
  );
}
