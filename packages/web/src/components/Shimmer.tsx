interface StatusShimmerProps {
  children: string;
  className?: string;
}

export function StatusShimmer({ children, className = "" }: StatusShimmerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2 rounded-full border border-zinc-800/70 bg-zinc-900/50 px-3 py-1.5 text-[12.5px] text-zinc-400 shadow-inset-hair ${className}`}
    >
      <span className="relative flex size-2">
        <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/60" />
        <span className="relative size-2 rounded-full bg-emerald-400" />
      </span>
      <span className="shimmer-text">{children}</span>
    </div>
  );
}
