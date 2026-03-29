import type { Metadata } from "next";
import { AdminChordLibraryClient } from "@/components/admin/admin-chord-library-client";

export const metadata: Metadata = { title: "Akorlar — Admin" };
export const dynamic = "force-dynamic";

export default function AdminChordLibraryPage() {
  return (
    <>
      <h1 className="text-xl font-bold text-foreground">Akorlar yönetimi</h1>
      <p className="mt-1 text-sm text-muted">
        Sadece admin yazabilir — Claims + Rules.
      </p>
      <div className="mt-6">
        <AdminChordLibraryClient />
      </div>
    </>
  );
}
