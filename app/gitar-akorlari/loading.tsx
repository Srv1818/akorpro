export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="h-10 w-64 animate-pulse rounded-lg bg-surface" />
      <div className="h-20 animate-pulse rounded-xl bg-surface" />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <li key={i} className="h-36 animate-pulse rounded-xl bg-surface" />
        ))}
      </ul>
    </div>
  );
}
