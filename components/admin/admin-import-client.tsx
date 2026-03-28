"use client";

import { useState, type ChangeEvent } from "react";

type ValidationError = { row: number; field: string; message: string };

export function AdminImportClient() {
  const [jsonText, setJsonText] = useState("");
  const [validCount, setValidCount] = useState(0);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [status, setStatus] = useState<"idle" | "validated" | "importing" | "done">("idle");
  const [result, setResult] = useState("");

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setJsonText(reader.result as string);
      setStatus("idle");
    };
    reader.readAsText(file);
  }

  async function onValidate() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      setResult("JSON ayrıştırılamadı.");
      return;
    }

    const songs = Array.isArray(parsed) ? parsed : (parsed as Record<string, unknown>).songs;
    if (!Array.isArray(songs)) {
      setResult("JSON dizisi veya { songs: [...] } formatında olmalı.");
      return;
    }

    const res = await fetch("/api/admin/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ songs, dryRun: true }),
    });

    const data = await res.json();
    setValidCount(data.validCount ?? 0);
    setErrors(data.errors ?? []);
    setStatus("validated");
    setResult(`Doğrulama: ${data.validCount} geçerli, ${data.errorCount} hatalı.`);
  }

  async function onImport() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return;
    }
    const songs = Array.isArray(parsed) ? parsed : (parsed as Record<string, unknown>).songs;

    setStatus("importing");
    const res = await fetch("/api/admin/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ songs }),
    });

    const data = await res.json();
    setStatus("done");
    if (res.ok) {
      setResult(`İçe aktarma tamamlandı: ${data.imported} şarkı eklendi.${data.errorCount > 0 ? ` ${data.errorCount} hatalı satır atlandı.` : ""}`);
    } else {
      setResult(data.error ?? "Hata oluştu.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground cursor-pointer hover:bg-bg">
          JSON dosyası seç
          <input type="file" accept=".json" onChange={onFileChange} className="sr-only" />
        </label>
        <span className="text-xs text-muted">veya aşağıya yapıştırın</span>
      </div>

      <textarea
        value={jsonText}
        onChange={(e) => { setJsonText(e.target.value); setStatus("idle"); }}
        rows={12}
        placeholder='[{"title": "...", "slug": "...", "artistName": "...", ...}]'
        className="w-full rounded-lg border border-border bg-bg p-3 font-mono text-xs text-foreground"
      />

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onValidate}
          disabled={!jsonText.trim()}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-bg disabled:opacity-50"
        >
          Doğrula (dry run)
        </button>
        <button
          type="button"
          onClick={onImport}
          disabled={status !== "validated" || validCount === 0}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-muted disabled:opacity-50"
        >
          {status === "importing" ? "İçe aktarılıyor…" : `İçe aktar (${validCount} şarkı)`}
        </button>
      </div>

      {result ? <p className="rounded-lg bg-surface p-3 text-sm text-foreground">{result}</p> : null}

      {errors.length > 0 ? (
        <details className="rounded-lg border border-border bg-surface p-4">
          <summary className="cursor-pointer text-sm font-medium text-foreground">
            Hatalar ({errors.length})
          </summary>
          <ul className="mt-2 space-y-1 text-xs text-muted">
            {errors.map((e, i) => (
              <li key={i}>Satır {e.row}: [{e.field}] {e.message}</li>
            ))}
          </ul>
        </details>
      ) : null}

      <details className="rounded-lg border border-border bg-surface p-4">
        <summary className="cursor-pointer text-sm font-medium text-foreground">
          JSON şeması
        </summary>
        <pre className="mt-2 overflow-auto text-xs text-muted">{`{
  "songs": [
    {
      "title": "Şarkı Adı",       // zorunlu
      "slug": "sarki-adi",         // zorunlu
      "artistName": "Sanatçı",     // zorunlu
      "artistSlug": "sanatci",     // zorunlu
      "chordBody": "[Verse]\\nAm F",// zorunlu
      "originalKey": "Am",         // zorunlu
      "difficulty": "kolay|orta|zor", // zorunlu
      "genre": "Rock",             // zorunlu
      "tempo": 120,                // opsiyonel
      "timeSignature": "4/4",      // opsiyonel
      "tuning": "Standard",        // opsiyonel
      "capo": 0,                   // opsiyonel
      "copyrightSource": "...",    // opsiyonel
      "popularity": 50             // opsiyonel
    }
  ]
}`}</pre>
      </details>
    </div>
  );
}
