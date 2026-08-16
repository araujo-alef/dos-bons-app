import { useState, useEffect } from 'react';
import { preloadImages, areHomeImagesReady, markHomeImagesReady } from '@/lib/preloadImages';

interface PreloadState {
  ready:    boolean;
  progress: number; // 0–1
}

/**
 * Downloads and decodes `sources` before the caller renders.
 *
 * If they were already preloaded once this session, starts ready — going
 * back to a screen must never replay its loading state.
 */
export function useImagePreload(sources: string[]): PreloadState {
  const alreadyDone = areHomeImagesReady();
  const [state, setState] = useState<PreloadState>(
    alreadyDone ? { ready: true, progress: 1 } : { ready: false, progress: 0 }
  );

  useEffect(() => {
    if (alreadyDone) return;
    let cancelled = false;

    preloadImages(sources, fraction => {
      if (!cancelled) setState(s => ({ ...s, progress: fraction }));
    }).then(() => {
      markHomeImagesReady();
      if (!cancelled) setState({ ready: true, progress: 1 });
    });

    return () => { cancelled = true; };
    // sources is a module-level constant array; intentionally not a dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
