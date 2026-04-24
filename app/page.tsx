import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { DiscoverBlock, type DiscoverAccent } from "@/components/content/discover-block";
import { DiscoverTabs } from "@/components/content/discover-tabs";
import { PageHeader } from "@/components/content/page-header";
import { getDiscoverFeatured, getDiscoverNew, getDiscoverPopular } from "@/lib/firestore/discover";

/** ISR: ana sayfa iskeleti; popüler bloğu ayrıca ~23s TTL (lib/cache/tags.ts TTL.DISCOVER_POPULAR). */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Keşfet",
  description:
    "Türkçe ve yabancı şarkıların gitar akorlarını keşfet. Popüler, yeni ve editör seçimi şarkılar — AkorPro'da ücretsiz.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Keşfet",
    description:
      "Türkçe ve yabancı şarkıların gitar akorlarını keşfet. Popüler, yeni ve editör seçimi şarkılar — AkorPro'da ücretsiz.",
    url: "/",
  },
};

export default async function HomePage() {
  return (
    <>
      <PageHeader
        title="Keşfet"
        description="Popüler, yeni ve öne çıkan şarkılar."
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <DiscoverTabs
          tabs={[
            {
              id: "popular",
              label: "Popüler",
              icon: <FlameIcon />,
              accent: "rose",
              panel: (
                <Suspense
                  fallback={
                    <DiscoverBlockSkeleton
                      id="discover-popular"
                      title="Popüler"
                      accent="rose"
                      icon={<FlameIcon />}
                    />
                  }
                >
                  <PopularSection />
                </Suspense>
              ),
            },
            {
              id: "new",
              label: "Yeni",
              icon: <SparklesIcon />,
              accent: "emerald",
              panel: (
                <Suspense
                  fallback={
                    <DiscoverBlockSkeleton
                      id="discover-new"
                      title="Yeni eklenenler"
                      accent="emerald"
                      icon={<SparklesIcon />}
                    />
                  }
                >
                  <NewSection />
                </Suspense>
              ),
            },
            {
              id: "featured",
              label: "Editör",
              icon: <StarIcon />,
              accent: "amber",
              panel: (
                <Suspense
                  fallback={
                    <DiscoverBlockSkeleton
                      id="discover-featured"
                      title="Editör seçimi"
                      accent="amber"
                      icon={<StarIcon />}
                    />
                  }
                >
                  <FeaturedSection />
                </Suspense>
              ),
            },
          ]}
        />
      </div>
    </>
  );
}

async function PopularSection() {
  const songs = await getDiscoverPopular();
  return (
    <DiscoverBlock
      id="discover-popular"
      title="Popüler"
      songs={songs}
      accent="rose"
      icon={<FlameIcon />}
    />
  );
}

async function NewSection() {
  const songs = await getDiscoverNew();
  return (
    <DiscoverBlock
      id="discover-new"
      title="Yeni eklenenler"
      songs={songs}
      accent="emerald"
      icon={<SparklesIcon />}
    />
  );
}

async function FeaturedSection() {
  const songs = await getDiscoverFeatured();
  return (
    <DiscoverBlock
      id="discover-featured"
      title="Editör seçimi"
      songs={songs}
      accent="amber"
      icon={<StarIcon />}
    />
  );
}

const ACCENT_SKELETON: Record<DiscoverAccent, string> = {
  rose: "from-rose-500/10 via-rose-500/5 to-transparent",
  emerald: "from-emerald-500/10 via-emerald-500/5 to-transparent",
  amber: "from-amber-500/10 via-amber-500/5 to-transparent",
};

const ACCENT_RING: Record<DiscoverAccent, string> = {
  rose: "bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/20",
  emerald: "bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20",
  amber: "bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20",
};


function DiscoverBlockSkeleton({
  id,
  title,
  accent,
  icon,
}: {
  id: string;
  title: string;
  accent: DiscoverAccent;
  icon: ReactNode;
}) {
  return (
    <section
      className="relative px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4 lg:overflow-hidden lg:rounded-2xl lg:border lg:border-border lg:bg-surface lg:p-5"
      aria-labelledby={id}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${ACCENT_SKELETON[accent]}`}
        aria-hidden="true"
      />
      <header className="relative mb-3 hidden items-center gap-2.5 lg:flex">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${ACCENT_RING[accent]}`}>
          {icon}
        </span>
        <h2 id={id} className="text-base font-bold text-display sm:text-lg">
          {title}
        </h2>
      </header>
      <ul className="relative flex flex-col gap-0.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 px-2 py-2">
            <div className="h-7 w-7 shrink-0 animate-pulse rounded-md bg-bg" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-3/4 animate-pulse rounded bg-bg" />
              <div className="h-2.5 w-1/2 animate-pulse rounded bg-bg" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FlameIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M12 2.5l2.9 6.2 6.8.6-5.1 4.5 1.5 6.7L12 17.3l-6.1 3.2 1.5-6.7L2.3 9.3l6.8-.6z" />
    </svg>
  );
}
