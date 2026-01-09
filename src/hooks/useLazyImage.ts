import { useState, useEffect, useRef, useCallback } from "react";

interface UseLazyImageOptions {
  rootMargin?: string;
  threshold?: number;
  unloadDelay?: number;
}

interface UseLazyImageReturn {
  ref: React.RefObject<HTMLDivElement>;
  isVisible: boolean;
  hasLoaded: boolean;
  isIntersecting: boolean;
}

/**
 * Custom hook for lazy loading images using IntersectionObserver.
 * Images are loaded when they enter the viewport and can be unloaded
 * when they leave to save memory.
 */
export const useLazyImage = (options: UseLazyImageOptions = {}): UseLazyImageReturn => {
  const { 
    rootMargin = "200px 0px", // Start loading 200px before visible
    threshold = 0.01,
    unloadDelay = 5000 // Wait 5s after leaving viewport before unloading
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const unloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const isCurrentlyIntersecting = entry.isIntersecting;
        
        setIsIntersecting(isCurrentlyIntersecting);

        if (isCurrentlyIntersecting) {
          // Clear any pending unload
          if (unloadTimeoutRef.current) {
            clearTimeout(unloadTimeoutRef.current);
            unloadTimeoutRef.current = null;
          }
          
          // Element is in viewport, load the image
          setIsVisible(true);
          setHasLoaded(true);
        } else if (hasLoaded) {
          // Element left viewport, schedule unload
          unloadTimeoutRef.current = setTimeout(() => {
            setIsVisible(false);
          }, unloadDelay);
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (unloadTimeoutRef.current) {
        clearTimeout(unloadTimeoutRef.current);
      }
    };
  }, [rootMargin, threshold, unloadDelay, hasLoaded]);

  return { ref, isVisible, hasLoaded, isIntersecting };
};

/**
 * Simple intersection observer hook for detecting visibility
 */
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLDivElement>, boolean] => {
  const ref = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setIsIntersecting(entries[0]?.isIntersecting ?? false);
      },
      { rootMargin: "100px", threshold: 0.01, ...options }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [options.rootMargin, options.threshold]);

  return [ref, isIntersecting];
};
