import { signal } from '@angular/core';
import { MotionService } from '../motion.service';

type Cleanup = void | (() => void);

/**
 * A stand-in for GSAP that records tweens and lets a test drive matchMedia:
 * `revertMedia()` behaves like the visitor switching on reduced motion.
 */
export function createFakeKit() {
  // jsdom has no matchMedia; directives query it for pointer type inside their setup
  if (typeof window.matchMedia !== 'function') {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
  }
  const cleanups: (() => void)[] = [];
  const revertMedia = () => cleanups.splice(0).forEach((cleanup) => cleanup());

  const gsap = {
    context: (fn: () => void) => {
      fn();
      return { revert: revertMedia };
    },
    matchMedia: () => ({
      add: (_query: string, fn: () => Cleanup) => {
        const cleanup = fn();
        if (cleanup) cleanups.push(cleanup);
      },
    }),
    from: vi.fn(),
    to: vi.fn(),
    fromTo: vi.fn(),
    quickTo: vi.fn(() => vi.fn()),
    utils: { toArray: () => [], clamp: (min: number, max: number, v: number) => Math.min(max, Math.max(min, v)) },
  };
  const split = { chars: [], lines: [], revert: vi.fn() };
  const kit = { gsap, SplitText: { create: vi.fn(() => split) }, ScrollTrigger: {}, Flip: {} };

  return { kit, gsap, split, revertMedia };
}

/** A MotionService double whose `load()` resolves to `kit`. */
export function fakeMotionService(kit: unknown, options: { reduced?: boolean; late?: boolean } = {}) {
  return {
    reducedMotion: signal(options.reduced ?? false),
    loadedLate: signal(options.late ?? false),
    load: () => Promise.resolve(kit),
  } as unknown as MotionService & {
    reducedMotion: ReturnType<typeof signal<boolean>>;
    loadedLate: ReturnType<typeof signal<boolean>>;
  };
}
