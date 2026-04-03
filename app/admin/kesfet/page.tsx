import type { Metadata } from "next";
import { AdminDiscoverClient } from "@/components/admin/admin-discover-client";

export const metadata: Metadata = { title: "Keşfet listeleri — Admin" };

export const dynamic = "force-dynamic";

export default function AdminDiscoverPage() {
  return (
    <>
      <h1 className="text-xl font-bold text-foreground">Keşfet listeleri</h1>
      <p className="mt-2 text-sm text-muted">
        Ana sayfadaki Popüler, Yeni eklenenler (kürasyon) ve Editör seçimi Firestore <code className="text-foreground">discover/</code>{" "}
        dokümanlarından okunur.
      </p>
      <div className="mt-8">
        <AdminDiscoverClient />
      </div>
    </>
  );
}
