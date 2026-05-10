'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface LazyVideoProps {
  src: string;
  className?: string;
  poster?: string;
  /** Distance (px) before viewport at which we start mounting the <video>. */
  rootMargin?: string;
  /** Plays/pauses based on visibility to save CPU. */
  pauseWhenOffscreen?: boolean;
}

/**
 * Renders a muted/looped autoplay <video> only when the element is about to enter the
 * viewport. Before that it's a lightweight placeholder, so the network/CPU cost of
 * having multiple videos on a page is paid lazily, not on first paint.
 */
export function LazyVideo({
  src,
  className,
  poster,
  rootMargin = '300px',
  pauseWhenOffscreen = true,
}: LazyVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            obs.disconnect();
          }
        });
      },
      { rootMargin },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);

  // Pause the video when it leaves the viewport to save CPU/battery on long pages.
  useEffect(() => {
    if (!shouldLoad || !pauseWhenOffscreen) return;
    const video = videoRef.current;
    if (!video) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            void video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.25 },
    );
    obs.observe(video);
    return () => obs.disconnect();
  }, [shouldLoad, pauseWhenOffscreen]);

  return (
    <div ref={containerRef} className={cn('w-full h-full', className)}>
      {shouldLoad ? (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className={cn('w-full h-full object-cover', className)}
        />
      ) : (
        <div
          className={cn('w-full h-full bg-slate-100', className)}
          style={poster ? { backgroundImage: `url(${poster})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
          aria-hidden
        />
      )}
    </div>
  );
}
