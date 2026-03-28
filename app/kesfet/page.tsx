import type { Metadata } from "next";
import { DiscoverBlock } from "@/components/content/discover-block";
import { PageHeader } from "@/components/content/page-header";
import { getDiscoverFeatured, getDiscoverNew, getDiscoverPopular } from "@/lib/firestore/discover";

/** ISR: 5 minutes (see lib/cache/tags.ts TTL.DISCOVER) */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Keşfet",
  description: "Popüler, yeni ve öne çıkan şarkılar.",
};

export default async function KesfetPage() {
  const [popular, yeni, featured] = await Promise.all([
    getDiscoverPopular(),
    getDiscoverNew(),
    getDiscoverFeatured(),
  ]);

  return (
    <>
      <PageHeader
        title="Keşfet"
        description="Her blok bağımsız Firestore sorgusu ile beslenir."
      />
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
        <DiscoverBlock id="discover-popular" title="Popüler" songs={popular} />
        <DiscoverBlock id="discover-new" title="Yeni eklenenler" songs={yeni} />
        <DiscoverBlock id="discover-featured" title="Editör seçimi" songs={featured} />
      </div>
    </>
  );
}
