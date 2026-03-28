import type { Metadata } from "next";
import { AdminArtistsClient } from "@/components/admin/admin-artists-client";

export const metadata: Metadata = { title: "Sanatçı yönetimi — Admin" };
export const dynamic = "force-dynamic";

export default function AdminArtistsPage() {
  return (
    <>
      <h1 className="text-xl font-bold text-foreground">Sanatçı yönetimi</h1>
      <div className="mt-6">
        <AdminArtistsClient />
      </div>
    </>
  );
}
