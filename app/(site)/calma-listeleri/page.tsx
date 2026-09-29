import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PlaylistsManager } from "@/components/playlists/playlists-manager";
import { PageHeader } from "@/components/content/page-header";
import { getServerSessionUser } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "Çalma listeleri",
  description: "Giriş yapan her kullanıcı kendi çalma listelerini oluşturur, düzenler ve şarkı ekler.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/calma-listeleri" },
};

export default async function CalmaListeleriPage() {
  const user = await getServerSessionUser();

  return (
    <>
      <PageHeader
        title="Çalma listeleri"
        description="Listeler yalnızca size aittir: yeni liste açın, adını değiştirin, sitedeki şarkıları arayıp ekleyin, sırayı düzenleyin veya silin."
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {user ? (
          <Suspense fallback={<p className="text-center text-sm text-muted">Listeler yükleniyor…</p>}>
            <PlaylistsManager serverUid={user.uid} />
          </Suspense>
        ) : (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center">
            <p className="text-sm text-muted">
              Çalma listeleri için giriş yapmanız gerekir.{" "}
              <Link href="/giris?returnTo=/calma-listeleri" className="text-accent underline-offset-2 hover:underline">
                Giriş yap
              </Link>
            </p>
          </div>
        )}
      </div>
    </>
  );
}
