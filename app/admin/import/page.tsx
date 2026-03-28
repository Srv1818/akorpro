import type { Metadata } from "next";
import { AdminImportClient } from "@/components/admin/admin-import-client";

export const metadata: Metadata = { title: "Toplu içe aktarma — Admin" };

export default function AdminImportPage() {
  return (
    <>
      <h1 className="text-xl font-bold text-foreground">Toplu içe aktarma</h1>
      <p className="mt-1 text-sm text-muted">
        JSON dosyası yükleyin. Doğrulama → önizleme → içe aktar. Max 500 satır.
      </p>
      <div className="mt-6">
        <AdminImportClient />
      </div>
    </>
  );
}
