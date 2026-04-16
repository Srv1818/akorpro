import type { Metadata } from "next";
import { AdminSongStudioClient } from "@/components/admin/admin-song-studio-client";

export const metadata: Metadata = { title: "Yeni şarkı — Admin" };
export const dynamic = "force-dynamic";

export default function AdminNewSongPage({
  searchParams,
}: {
  searchParams?: { id?: string };
}) {
  const id = typeof searchParams?.id === "string" ? searchParams.id : undefined;
  return (
    <>
      <h1 className="text-xl font-bold text-foreground">{id ? "Şarkı düzenle" : "Yeni şarkı"}</h1>
      <div className="mt-6">
        <AdminSongStudioClient initialSongId={id} />
      </div>
    </>
  );
}

