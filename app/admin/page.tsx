import type { Metadata } from "next";
import Link from "next/link";
import { getAllSongsAdmin, getPendingSongs } from "@/lib/firestore/admin-songs";
import { getAllArtistsAdmin } from "@/lib/firestore/admin-artists";
import { getPendingContributions } from "@/lib/firestore/contributions";

export const metadata: Metadata = { title: "Admin pano" };

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [allSongs, pendingSongs, artists, pendingContribs] = await Promise.all([
    getAllSongsAdmin(),
    getPendingSongs(),
    getAllArtistsAdmin(),
    getPendingContributions(),
  ]);

  const stats = [
    { label: "Toplam şarkı", value: allSongs.length, href: "/admin/sarkilar" },
    { label: "Sanatçı", value: artists.length, href: "/admin/sanatcilar" },
    { label: "Bekleyen şarkı", value: pendingSongs.length, href: "/admin/moderasyon" },
    { label: "Bekleyen katkı", value: pendingContribs.length, href: "/admin/moderasyon" },
  ];

  return (
    <>
      <h1 className="text-xl font-bold text-foreground">Admin panosu</h1>
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
