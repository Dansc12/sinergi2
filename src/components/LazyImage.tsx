import { useState, useEffect, memo } from "react";
import { useLazyImage } from "@/hooks/useLazyImage";
import { getOptimizedImageUrl, getPlaceholderUrl } from "@/lib/imageUpload";
import { cn } from "@/lib/utils";

interface LazyImageProps {
  src: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  width?: number;
  quality?: number;
  unloadWhenHidden?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * LazyImage component that only loads images when they're about to enter the viewport.
 * Features:
 * - Skeleton placeholder while loading
 * - Progressive loading with blur effect
 * - Unloads image from DOM when scrolled far away (optional)
 * - Uses Supabase image transformations for optimization
 */
export const LazyImage = memo(function LazyImage({
  src,
  alt = "Image",
  className,
  containerClassName,
  width = 800,
  quality = 80,
  unloadWhenHidden = true,
  onLoad,
  onError,
}: LazyImageProps) {
  const { ref, isVisible, hasLoaded } = useLazyImage({
    rootMargin: "300px 0px", // Start loading 300px before visible
    unloadDelay: unloadWhenHidden ? 3000 : Infinity, // Unload 3s after leaving viewport
  });

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reset states when src changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [src]);

  const optimizedUrl = getOptimizedImageUrl(src, width, quality);
  const placeholderUrl = getPlaceholderUrl(src);

  const handleLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  // Determine what to render
  const shouldRenderImage = isVisible || (hasLoaded && !unloadWhenHidden);
  const showSkeleton = !imageLoaded && !imageError;

  return (
    <div 
      ref={ref} 
      className={cn("relative w-full h-full bg-muted overflow-hidden", containerClassName)}
    >
      {/* Skeleton placeholder */}
      {showSkeleton && (
        <div className="absolute inset-0 bg-muted animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted-foreground/5 to-transparent skeleton-shimmer" />
        </div>
      )}

      {/* Blurred placeholder - only for Supabase storage images */}
      {shouldRenderImage && placeholderUrl && !imageLoaded && !imageError && (
        <img
          src={placeholderUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-lg scale-105"
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      {shouldRenderImage && !imageError && (
        <img
          src={optimizedUrl}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            imageLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={(e) => {
            // Try original URL as fallback
            if (e.currentTarget.src !== src) {
              e.currentTarget.src = src;
            } else {
              handleError();
            }
          }}
        />
      )}

      {/* Error state */}
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-muted-foreground text-sm">Failed to load</span>
        </div>
      )}
    </div>
  );
});

export default LazyImage;
