import type { Metadata } from "next";
import { DiscoverBlock } from "@/components/content/discover-block";
import { PageHeader } from "@/components/content/page-header";
import { getDiscoverFeatured, getDiscoverNew, getDiscoverPopular } from "@/data/mock/discover";

export const metadata: Metadata = {
  title: "Keşfet",
  description: "Popüler, yeni ve öne çıkan şarkılar — mock veri ile üç ayrı sunucu bölümü.",
};

export default function KesfetPage() {
  const popular = getDiscoverPopular();
  const yeni = getDiscoverNew();
  const featured = getDiscoverFeatured();

  return (
    <>
      <PageHeader
        title="Keşfet"
        description="Üç blok için ayrı mock veri kaynakları (ARCHITECTURE Faz 2). İleride her blok bağımsız Firestore sorgusu ve ISR etiketleri ile beslenecek."
      />
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
        <DiscoverBlock id="discover-popular" title="Popüler" songs={popular} />
        <DiscoverBlock id="discover-new" title="Yeni eklenenler" songs={yeni} />
        <DiscoverBlock id="discover-featured" title="Editör seçimi" songs={featured} />
      </div>
    </>
  );
}
