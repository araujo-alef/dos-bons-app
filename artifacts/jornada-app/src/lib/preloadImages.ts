import chainImg      from '@/assets/chain-wide.webp';
import bookImg       from '@/assets/book-3d-v3.webp';
import labiaNovaImg  from '@/assets/labia-baralho-v2.webp';
import labiaImg      from '@/assets/labia-app-splash-v2.webp';
import instaImg      from '@/assets/codigo-insta-dominante-hq.webp';

/**
 * Every image the home screen paints on first render. Imported (not
 * hard-coded paths) so Vite's hashed build URLs are used and a renamed or
 * deleted asset breaks the build instead of silently skipping the preload.
 */
export const HOME_IMAGES: string[] = [
  chainImg,
  bookImg,       // JourneyCard
  labiaNovaImg,  // LabiaPremiumCard
  labiaImg,
  instaImg,
];

/**
 * Resolves once the image is downloaded AND decoded — decode() matters:
 * a merely-downloaded image still costs a decode on first paint, which is
 * exactly the hitch this preload exists to remove. Never rejects; a broken
 * or blocked image resolves too, so one bad asset can't hold the app hostage.
 */
// Preloaded images are kept referenced for the lifetime of the session.
// Without this the Image objects become garbage right after their promise
// settles, and browsers are free to drop the decoded bitmap with them —
// which would force a fresh decode the moment the real <img> paints,
// defeating the preload.
const retained: HTMLImageElement[] = [];

function loadOne(src: string): Promise<void> {
  return new Promise<void>(resolve => {
    const img = new Image();
    retained.push(img);
    img.onload = () => {
      // decode() is unsupported on some older Safari versions; onload alone
      // is an acceptable fallback there.
      img.decode?.().then(() => resolve(), () => resolve()) ?? resolve();
    };
    img.onerror = () => resolve();
    img.src = src;
  });
}

/**
 * Preloads `sources`, reporting progress as a 0–1 fraction.
 *
 * `timeoutMs` caps the wait: on a slow connection the app shows itself
 * anyway rather than trapping the user on a splash screen indefinitely.
 * Images still finish loading in the background after that.
 */
export function preloadImages(
  sources: string[],
  onProgress?: (fraction: number) => void,
  timeoutMs = 8000,
): Promise<void> {
  if (sources.length === 0) return Promise.resolve();

  let done = 0;
  const all = Promise.all(
    sources.map(src =>
      loadOne(src).then(() => {
        done += 1;
        onProgress?.(done / sources.length);
      })
    )
  ).then(() => undefined);

  const timeout = new Promise<void>(resolve => setTimeout(resolve, timeoutMs));
  return Promise.race([all, timeout]);
}

// Module-level so returning to the home screen later never replays the
// splash — the browser cache would make it instant anyway, but this avoids
// even a one-frame flash of the loading state.
let homeImagesReady = false;
export const areHomeImagesReady = () => homeImagesReady;
export const markHomeImagesReady = () => { homeImagesReady = true; };
