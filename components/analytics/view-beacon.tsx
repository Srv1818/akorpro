"use client";

import { useEffect } from "react";

/**
 * Şarkı sayfası açıldığında görüntülenme işareti gönderir.
 *
 * Aynı sekmede aynı şarkıya tekrar dönüldüğünde saymaz (`sessionStorage`);
 * yoksa ileri-geri gezinmek sayacı şişirirdi.
 *
 * İstemci tarafında olması bilinçli: sunucuda sayılsaydı arama motoru
 * botları da popülerliği belirlerdi.
 */
export function ViewBeacon({ songId }: { songId: string }) {
  useEffect(() => {
    if (!songId) return;

    const key = `viewed:${songId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Gizli sekmede sessionStorage kapalı olabilir; sayım yine de gönderilsin.
    }

    // keepalive: kullanıcı hemen başka sayfaya geçerse istek iptal olmasın.
    void fetch(`/api/songs/${encodeURIComponent(songId)}/view`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {
      // Sayaç kritik değil; sessizce geç.
    });
  }, [songId]);

  return null;
}
