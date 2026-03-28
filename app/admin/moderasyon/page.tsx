import type { Metadata } from "next";
import { ModerationClient } from "@/components/admin/moderation-client";

export const metadata: Metadata = { title: "Moderasyon — Admin" };
export const dynamic = "force-dynamic";

export default function ModerationPage() {
  return (
    <>
      <h1 className="text-xl font-bold text-foreground">Moderasyon kuyruğu</h1>
      <p className="mt-1 text-sm text-muted">
        Bekleyen şarkılar ve topluluk katkıları. Onay → ISR revalidate tetikler.
      </p>
      <div className="mt-6">
        <ModerationClient />
      </div>
    </>
  );
}
