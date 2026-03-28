import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/content/page-header";

export const metadata: Metadata = {
  title: "Çalma listeleri",
  description: "Kişisel listeler — oturum gerektirir (Faz 3).",
  robots: { index: false, follow: true },
};

export default function CalmaListeleriPage() {
  return (
    <>
      <PageHeader
        title="Çalma listeleri"
        description="Playlist CRUD ve drag-drop (isteğe bağlı) Firebase ile gelecek. Şimdilik yalnızca rota ve kullanıcı mesajı."
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted">
            Listeleri görmek için giriş yapmanız gerekir. Bu sayfa şimdilik{" "}
            <span className="font-medium text-foreground">noindex</span> (kişisel içerik).
          </p>
          <Link
            href="/giris"
            className="mt-4 inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-muted"
          >
            Girişe git
          </Link>
        </div>
      </div>
    </>
  );
}
