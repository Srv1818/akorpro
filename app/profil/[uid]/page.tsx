import { getServerSessionUser } from "@/lib/auth/server-session";
import { redirect } from "next/navigation";
import { Mail } from "lucide-react";

export default async function ProfilPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const resolvedParams = await params;
  const sessionUser = await getServerSessionUser();

  // Güvenlik: Kullanıcı giriş yapmamışsa veya başkasının ID'sine bakmaya çalışıyorsa geri gönder
  if (!sessionUser || sessionUser.uid !== resolvedParams.uid) {
    redirect("/giris");
  }

  const email = sessionUser.email || "E-posta bulunamadı";
  const userInitial = email.charAt(0).toUpperCase();

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        
        {/* Üst Renkli Banner */}
        <div className="h-28 bg-accent/20"></div>
        
        {/* Profil İçeriği */}
        <div className="px-6 pb-8 sm:px-10">
          {/* Yuvarlak Avatar */}
          <div className="-mt-12 mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full border-4 border-surface bg-accent text-3xl font-bold text-accent-foreground shadow-sm">
            {userInitial}
          </div>
          
          <h1 className="mb-6 text-2xl font-bold text-foreground">Profil Bilgileri</h1>
          
          <div className="grid gap-4">
            
            {/* E-posta Kutusu */}
            <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-bg p-4 transition hover:bg-bg/80">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface">
                <Mail className="h-5 w-5 text-muted" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted">E-posta Adresi</p>
                <p className="truncate font-medium text-foreground" title={email}>{email}</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}