import type { Metadata } from "next";
import { AdminSongsClient } from "@/components/admin/admin-songs-client";

export const metadata: Metadata = { title: "Şarkı yönetimi — Admin" };
export const dynamic = "force-dynamic";

export default function AdminSongsPage() {
  return (
    <>
      <h1 className="text-xl font-bold text-foreground">Şarkı yönetimi</h1>
      <div className="mt-6">
        <AdminSongsClient />
      </div>
    </>
  );
}
