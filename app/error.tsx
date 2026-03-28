"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-lg font-semibold text-foreground">Bir şeyler ters gitti</h1>
      <p className="text-sm text-muted">
        Sayfa yüklenirken hata oluştu. Tekrar deneyebilir veya ana sayfaya dönebilirsiniz.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-muted"
      >
        Yeniden dene
      </button>
    </div>
  );
}
