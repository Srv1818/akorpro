import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/content/page-header";
import { getAllChordShapes } from "@/lib/firestore/chord-library";
import { mockChordShapes } from "@/data/mock/chord-library";
import { chordPath } from "@/lib/paths";

export const metadata: Metadata = {
  title: "Akor kütüphanesi",
  description: "Gitar akor pozisyonları, parmak dizilimleri ve varyasyonlar — açık, barre ve gelişmiş akor şekilleri.",
};

export default async function AkorKutuphanesiPage() {
  let shapes: { id: string; name: string; root: string; quality: string; fingering: string }[];
  try {
    const fsShapes = await getAllChordShapes();
    shapes = fsShapes.length > 0
      ? fsShapes.map((s) => ({ id: s.id, name: s.name, root: s.root, quality: s.quality, fingering: s.fingering }))
      : mockChordShapes;
  } catch {
    shapes = mockChordShapes;
  }

  const grouped = new Map<string, typeof shapes>();
  for (const s of shapes) {
    const key = s.root;
    const arr = grouped.get(key) ?? [];
    arr.push(s);
    grouped.set(key, arr);
  }

  return (
    <>
      <PageHeader
        title="Akor kütüphanesi"
        description="Tüm akor şekilleri ve pozisyonları. Admin panelinden yeni akor ekleyebilirsiniz."
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {[...grouped.entries()].map(([root, items]) => (
          <section key={root} className="mb-8">
            <h2 className="mb-3 text-lg font-bold text-foreground">{root}</h2>
            <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead className="border-b border-border bg-bg text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Akor</th>
                    <th className="px-4 py-3 font-medium">Kalite</th>
                    <th className="px-4 py-3 font-medium">Parmak / tel</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                      <td className="px-4 py-3 capitalize text-muted">{c.quality}</td>
                      <td className="px-4 py-3 font-mono text-sm text-foreground">{c.fingering}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
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
