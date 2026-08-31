"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Background/decorative video that only starts loading once it scrolls near
 * the viewport (IntersectionObserver), instead of every hero video fetching
 * eagerly on page load. `preload="none"` keeps the browser from fetching
 * anything until `src` is actually set.
 */
export default function LazyVideo({
  src,
  poster,
  className,
}: {
  src: string;
  poster?: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      autoPlay={inView}
      src={inView ? src : undefined}
    />
  );
}
