import type { Metadata } from "next";
import Link from "next/link";
import { PlaylistsManager } from "@/components/playlists/playlists-manager";
import { PageHeader } from "@/components/content/page-header";
import { getServerSessionUser } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "Çalma listeleri",
  description: "Kişisel listeler — oturum gerektirir.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/calma-listeleri" },
};

export default async function CalmaListeleriPage() {
  const user = await getServerSessionUser();

  return (
    <>
      <PageHeader
        title="Çalma listeleri"
        description="Firestore: kullanıcıya özel listeler ve şarkı öğeleri; kurallar yalnızca sahip (ve admin claim) için açık."
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {user ? (
          <div className="space-y-6">
            <p className="text-center text-sm text-muted">
              Oturum:{" "}
              <span className="font-medium text-foreground">{user.email ?? user.uid}</span>
            </p>
            <PlaylistsManager serverUid={user.uid} />
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center">
            <p className="text-sm text-muted">
              Oturum doğrulanamadı. Çerez oluşturmak için sunucuda{" "}
              <code className="text-foreground">FIREBASE_SERVICE_ACCOUNT_KEY</code> gerekir; ardından{" "}
              <Link href="/giris" className="text-accent underline-offset-2 hover:underline">
                giriş
              </Link>{" "}
              yapın.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
