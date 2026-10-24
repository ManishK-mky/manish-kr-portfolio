import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { ImageRef } from '@/types/api';

interface CloudImageProps {
  image: ImageRef | null | undefined;
  /** Used for alt text when the image has none, and for the placeholder monogram. */
  label: string;
  sizes: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  /** Fill the parent box (which must be positioned and sized). */
  fill?: boolean;
}

/**
 * Cloudinary image with responsive sizing via the global loader. When no image
 * is set, renders a quiet typographic placeholder instead of a broken box.
 */
export function CloudImage({
  image,
  label,
  sizes,
  className,
  imgClassName,
  priority,
  fill = true,
}: CloudImageProps) {
  if (!image) {
    const initials = label
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('');
    return (
      <div
        className={cn(
          'flex size-full items-center justify-center bg-subtle text-muted-foreground',
          '[background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:14px_14px]',
          className,
        )}
        role="img"
        aria-label={label}
      >
        <span className="rounded-md bg-background/80 px-2 py-1 font-mono text-xs tracking-widest">
          {initials || '—'}
        </span>
      </div>
    );
  }
  const alt = image.alt || label;
  if (fill) {
    return (
      <div className={cn('relative size-full', className)}>
        <Image
          src={image.url}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn('object-cover', imgClassName)}
        />
      </div>
    );
  }
  return (
    <Image
      src={image.url}
      alt={alt}
      width={image.width ?? 1600}
      height={image.height ?? 900}
      sizes={sizes}
      priority={priority}
      className={cn('h-auto w-full', imgClassName, className)}
    />
  );
}
