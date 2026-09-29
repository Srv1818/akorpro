export default function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-border border-t-accent"
          role="status"
          aria-label="Yükleniyor"
        />
        <p className="text-sm text-muted">Yükleniyor…</p>
      </div>
    </div>
  );
}
