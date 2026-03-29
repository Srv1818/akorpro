import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function ChordReturnLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-6 inline-flex items-center gap-2 py-1 text-sm font-normal text-accent transition hover:text-accent-muted focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
      {label}
    </Link>
  );
}
