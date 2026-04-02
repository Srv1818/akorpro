import type { Metadata } from "next";
import Link from "next/link";
import { getAllSongsCount, getPendingSongsCount } from "@/lib/firestore/admin-songs";
import { getAllArtistsCount } from "@/lib/firestore/admin-artists";
import { getPendingContributionsCount } from "@/lib/firestore/contributions";

export const metadata: Metadata = { title: "Admin pano" };

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [allSongsRes, pendingSongsRes, artistsRes, pendingContribsRes] = await Promise.allSettled([
    getAllSongsCount(),
    getPendingSongsCount(),
    getAllArtistsCount(),
    getPendingContributionsCount(),
  ]);

  const allSongsCount = allSongsRes.status === "fulfilled" ? allSongsRes.value : 0;
  const pendingSongsCount = pendingSongsRes.status === "fulfilled" ? pendingSongsRes.value : 0;
  const artistsCount = artistsRes.status === "fulfilled" ? artistsRes.value : 0;
  const pendingContribsCount = pendingContribsRes.status === "fulfilled" ? pendingContribsRes.value : 0;
  const hasLoadError =
    allSongsRes.status === "rejected" ||
    pendingSongsRes.status === "rejected" ||
    artistsRes.status === "rejected" ||
    pendingContribsRes.status === "rejected";

  const stats = [
    { label: "Toplam şarkı", value: allSongsCount, href: "/admin/sarkilar" },
    { label: "Sanatçı", value: artistsCount, href: "/admin/sanatcilar" },
    { label: "Bekleyen şarkı", value: pendingSongsCount, href: "/admin/moderasyon" },
    { label: "Bekleyen katkı", value: pendingContribsCount, href: "/admin/moderasyon" },
  ];

  return (
    <>
      <h1 className="text-xl font-bold text-foreground">Admin panosu</h1>
      {hasLoadError ? (
        <p className="mt-3 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-sm text-foreground">
          Bazı pano verileri yüklenemedi, fakat panel açıldı. Firestore indeks/erişim ayarlarını kontrol edin.
        </p>
      ) : null}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-2xl border border-border bg-surface p-5 transition hover:border-accent/30"
          >
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/admin/sarkilar?action=new" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-muted">
          Yeni şarkı
        </Link>
        <Link href="/admin/sanatcilar?action=new" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-muted">
          Yeni sanatçı
        </Link>
        <Link href="/admin/import" className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-bg">
          Toplu içe aktar
        </Link>
      </div>
    </>
  );
}
