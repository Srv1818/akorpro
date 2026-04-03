import type { Metadata } from "next";
import { AdminDiscoverClient } from "@/components/admin/admin-discover-client";

export const metadata: Metadata = { title: "Editör seçimi (keşfet) — Admin" };

export const dynamic = "force-dynamic";

export default function AdminDiscoverPage() {
  return (
    <>
      <h1 className="text-xl font-bold text-foreground">Keşfet — editör seçimi</h1>
      <p className="mt-2 text-sm text-muted">
        Popüler ve yeni eklenenler otomatiktir. Yalnızca{" "}
        <span className="font-medium text-foreground">editör seçimi</span> buradan
        yönetilir (<code className="text-foreground">discover/featured</code>).
      </p>
      <div className="mt-8">
        <AdminDiscoverClient />
      </div>
    </>
  );
}
