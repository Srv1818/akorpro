import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/content/page-header";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { getAllMetodlar } from "@/lib/firestore/admin-metodlar";

export const metadata: Metadata = {
  title: "Metod",
  description: "Gitar eğitim metodları.",
  alternates: { canonical: "/metod" },
};

export default async function MetodPage() {
  const metodlar = await getAllMetodlar();

  return (
    <>
      <Breadcrumbs
        visuallyHidden
        items={[
          { label: "Ana Sayfa", href: "/" },
          { label: "Metod", href: "/metod" },
        ]}
      />
      <PageHeader
        title="Metod"
        description="Seviyene ve tarzına göre bir gitar metodu seç."
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {metodlar.length === 0 ? (
          <p className="text-sm text-muted">Henüz metod eklenmedi.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {metodlar.map((metod) => (
              <article
                key={metod.slug}
                className="relative rounded-xl border border-border bg-surface p-5 shadow-sm transition hover:border-accent/40 hover:shadow-md"
              >
                <Link
                  href={`/metod/${metod.slug}`}
                  className="absolute inset-0 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  aria-label={metod.title}
                />
                <h2 className="text-base font-semibold text-display">{metod.title}</h2>
                <p className="mt-1.5 text-sm text-muted">{metod.description}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
