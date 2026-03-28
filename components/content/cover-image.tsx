import Image from "next/image";

type CoverImageProps = {
  src: string | undefined | null;
  alt: string;
  /** Mark as LCP element on detail pages */
  priority?: boolean;
  /** Tailwind size classes — defaults to 96x96 */
  className?: string;
  width?: number;
  height?: number;
};

const PLACEHOLDER_GRADIENT =
  "bg-gradient-to-br from-accent/20 to-accent/5";

/**
 * Optimised cover image using next/image.
 * Falls back to a gradient placeholder when no src is provided.
 */
export function CoverImage({
  src,
  alt,
  priority = false,
  className = "h-24 w-24",
  width = 384,
  height = 384,
}: CoverImageProps) {
  if (!src) {
    return (
      <div
        className={`shrink-0 rounded-xl ${PLACEHOLDER_GRADIENT} ${className}`}
        role="img"
        aria-label={alt}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={`shrink-0 rounded-xl object-cover ${className}`}
      sizes="(max-width: 640px) 96px, 128px"
    />
  );
}
