type Props = {
  displayName: string;
  approvedCount: number;
  verified: boolean;
  className?: string;
};

export function ContributorBadge({ displayName, approvedCount, verified, className = "" }: Props) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
      verified
        ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
        : "border-border bg-surface text-muted"
    } ${className}`}>
      {verified ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-label="Doğrulanmış katkıcı"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ) : null}
      <span>{displayName}</span>
      {approvedCount > 0 ? (
        <span className="text-[10px] opacity-70">({approvedCount} katkı)</span>
      ) : null}
    </span>
  );
}
