import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, Signal, inject, signal } from '@angular/core';

export type Gsap = typeof import('gsap').gsap;

export interface MotionKit {
  gsap: Gsap;
  ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger;
  SplitText: typeof import('gsap/SplitText').SplitText;
  Flip: typeof import('gsap/Flip').Flip;
}

/** Media query under which decorative motion is allowed; use with `gsap.matchMedia().add`. */
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: no-preference)';

/** Class on <html> that lifts the CSS gate hiding `[data-reveal]` elements. */
export const MOTION_READY_CLASS = 'motion-ready';

const FALLBACK_REVEAL_MS = 1500;

/**
 * Loads GSAP and its plugins lazily, in the browser only, so they stay out of
 * the initial bundle and out of prerendering.
 */
@Injectable({ providedIn: 'root' })
export class MotionService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly reduced = signal(false);
  private readonly late = signal(false);
  private kit: Promise<MotionKit | null> | null = null;

  /** True when the visitor asked the system for reduced motion. */
  readonly reducedMotion: Signal<boolean> = this.reduced.asReadonly();

  /**
   * True when GSAP arrived after the fallback timer had already revealed the
   * content: entrance animations would then hide and replay what is on screen.
   */
  readonly loadedLate: Signal<boolean> = this.late.asReadonly();

  constructor() {
    const media = this.isBrowser ? this.document.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)') : null;
    if (media) {
      this.reduced.set(media.matches);
      media.addEventListener?.('change', (event) => this.reduced.set(event.matches));
    }
  }

  load(): Promise<MotionKit | null> {
    if (!this.isBrowser) {
      return Promise.resolve(null);
    }
    if (!this.kit) {
      let fallbackFired = false;
      const fallback = setTimeout(() => {
        fallbackFired = true;
        this.markReady();
      }, FALLBACK_REVEAL_MS);
      this.kit = this.importKit()
        .then((kit) => {
          kit.gsap.registerPlugin(kit.ScrollTrigger, kit.SplitText, kit.Flip);
          this.late.set(fallbackFired);
          return kit;
        })
        .catch(() => null)
        .then((kit) => {
          clearTimeout(fallback);
          this.markReady();
          return kit;
        });
    }
    return this.kit;
  }

  private async importKit(): Promise<MotionKit> {
    const [{ gsap }, { ScrollTrigger }, { SplitText }, { Flip }] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
      import('gsap/SplitText'),
      import('gsap/Flip'),
    ]);
    return { gsap, ScrollTrigger, SplitText, Flip };
  }

  private markReady(): void {
    this.document.documentElement.classList.add(MOTION_READY_CLASS);
  }
}
