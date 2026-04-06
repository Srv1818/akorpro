import type { Metadata } from "next";
import { Suspense } from "react";
import { DiscoverBlock } from "@/components/content/discover-block";
import { PageHeader } from "@/components/content/page-header";
import { getDiscoverFeatured, getDiscoverNew, getDiscoverPopular } from "@/lib/firestore/discover";

/** ISR: ana sayfa iskeleti; popüler bloğu ayrıca ~23s TTL (lib/cache/tags.ts TTL.DISCOVER_POPULAR). */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Keşfet",
  description: "Popüler, yeni ve öne çıkan şarkılar.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Keşfet",
    description: "Popüler, yeni ve öne çıkan şarkılar.",
    url: "/",
  },
};

export default async function HomePage() {
  return (
    <>
      <PageHeader
        title="Keşfet"
        description="Her blok bağımsız Firestore sorgusu ile beslenir."
      />
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
        <Suspense fallback={<DiscoverBlockSkeleton id="discover-popular" title="Popüler" />}>
          <PopularSection />
        </Suspense>
        <Suspense fallback={<DiscoverBlockSkeleton id="discover-new" title="Yeni eklenenler" />}>
          <NewSection />
        </Suspense>
        <Suspense fallback={<DiscoverBlockSkeleton id="discover-featured" title="Editör seçimi" />}>
          <FeaturedSection />
        </Suspense>
      </div>
    </>
  );
}

async function PopularSection() {
  const songs = await getDiscoverPopular();
  return <DiscoverBlock id="discover-popular" title="Popüler" songs={songs} />;
}

async function NewSection() {
  const songs = await getDiscoverNew();
  return <DiscoverBlock id="discover-new" title="Yeni eklenenler" songs={songs} />;
}

async function FeaturedSection() {
  const songs = await getDiscoverFeatured();
  return <DiscoverBlock id="discover-featured" title="Editör seçimi" songs={songs} />;
}

function DiscoverBlockSkeleton({ id, title }: { id: string; title: string }) {
  return (
    <section className="space-y-4" aria-labelledby={id}>
      <h2 id={id} className="text-lg font-semibold text-display">
        {title}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="h-32 animate-pulse rounded-xl bg-surface" />
        ))}
      </ul>
    </section>
  );
}
