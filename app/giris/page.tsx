import type { Metadata } from "next";
import { PageHeader } from "@/components/content/page-header";

export const metadata: Metadata = {
  title: "Giriş",
  description: "Oturum açma — Firebase Auth (Faz 3).",
  robots: { index: false, follow: true },
};

export default function GirisPage() {
  return (
    <>
      <PageHeader title="Giriş" description="E-posta / şifre veya sağlayıcı girişi Faz 3’te bağlanacak." />
      <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
        <form className="space-y-4 rounded-2xl border border-border bg-surface p-6" aria-disabled="true">
          <label className="block text-sm">
            <span className="text-muted">E-posta</span>
            <input
              type="email"
              disabled
              className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-foreground opacity-60"
              placeholder="ornek@akorpro.app"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">Şifre</span>
            <input
              type="password"
              disabled
              className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-foreground opacity-60"
            />
          </label>
          <button
            type="button"
            disabled
            className="w-full rounded-lg bg-accent/50 py-2 text-sm font-medium text-accent-foreground opacity-60"
          >
            Giriş (yakında)
          </button>
        </form>
      </div>
    </>
  );
}
