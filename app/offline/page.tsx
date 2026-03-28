import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Çevrimdışı",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="text-6xl" aria-hidden="true">
        🎸
      </div>
      <h1 className="mt-6 text-2xl font-bold text-foreground">
        Çevrimdışısınız
      </h1>
      <p className="mt-3 max-w-md text-muted">
        İnternet bağlantınızı kontrol edin. Bağlantı sağlandığında sayfayı
        yenileyebilirsiniz.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-accent-foreground shadow-sm hover:bg-accent-muted"
      >
        Ana sayfaya dön
      </Link>
    </div>
  );
}
