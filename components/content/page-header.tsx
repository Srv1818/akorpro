import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: ReactNode;
}) {
  return (
    <header className="border-b border-border bg-surface/50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description ? (
          <div className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{description}</div>
        ) : null}
      </div>
    </header>
  );
}
