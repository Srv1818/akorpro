import type { Metadata } from "next";
import { PageHeader } from "@/components/content/page-header";
import { mockScales } from "@/data/mock/scales";

export const metadata: Metadata = {
  title: "Gamlar",
  description: "Gam adları ve C merkezli nota eşlemesi (mock). Fretboard scale modu sonraki fazlarda.",
};

export default function GamlarPage() {
  return (
    <>
      <PageHeader
        title="Gamlar"
        description="Her gam için nota dizisi statik mock’tan gelir. İleride JSON veya Firestore koleksiyonu ile beslenir; fretboard ile vurgulama Faz 1 iskelesi üzerine kurulacak."
      />
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <ul className="grid gap-4 md:grid-cols-2">
          {mockScales.map((s) => (
            <li key={s.id} className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="font-semibold text-foreground">{s.name}</h2>
              <p className="mt-2 font-mono text-sm text-accent">{s.notesC.join(" — ")}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
