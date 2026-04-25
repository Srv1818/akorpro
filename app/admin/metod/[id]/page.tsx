import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getMetodById } from "@/lib/firestore/admin-metodlar";
import { AdminMetodEditor } from "@/components/admin/admin-metod-editor";

type Props = { params: Promise<{ id: string }> };

export default async function AdminMetodEditPage({ params }: Props) {
  const { id } = await params;
  const metod = await getMetodById(id);
  if (!metod) notFound();

  return (
    <div className="flex h-screen flex-col">
      {/* Üst bar */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        <Link
          href="/admin/metod"
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Geri
        </Link>
        <div className="h-4 w-px bg-border" />
        <div>
          <p className="text-xs text-muted">Metod düzenle</p>
          <h1 className="text-sm font-semibold text-display">{metod.title}</h1>
        </div>
      </header>

      {/* Editor */}
      <div className="min-h-0 flex-1">
        <AdminMetodEditor metodId={id} baslangicBolumler={metod.bolumler ?? []} />
      </div>
    </div>
  );
}
