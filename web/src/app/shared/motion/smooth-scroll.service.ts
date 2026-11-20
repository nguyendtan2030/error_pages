import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { MotionService } from './motion.service';

/** Fallback clearance above a scroll target when the `--anchor-offset` CSS variable is missing. */
export const DEFAULT_ANCHOR_OFFSET_PX = 80;

/** The part of Lenis this service drives. */
export interface SmoothScroller {
  scrollTo(
    target: HTMLElement | number,
    options: {
      offset?: number;
      duration?: number;
      easing?: (t: number) => number;
      immediate?: boolean;
      onComplete?: () => void;
    },
  ): void;
}

const SCROLL_DURATION_S = 1.2;
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * In-page navigation that eases to a section instead of jumping, clears the
 * fixed nav, respects reduced motion and hands keyboard focus to the target.
 */
@Injectable({ providedIn: 'root' })
export class SmoothScrollService {
  private readonly document = inject(DOCUMENT);
  private readonly motion = inject(MotionService);
  private scroller: SmoothScroller | null = null;

  /** Called by the app shell once Lenis exists (and with null when it goes away). */
  register(scroller: SmoothScroller | null): void {
    this.scroller = scroller;
  }

  /** Clearance above a target: the `--anchor-offset` CSS variable, the one place it is set. */
  anchorOffset(): number {
    const view = this.document.defaultView;
    const raw = view?.getComputedStyle(this.document.documentElement).getPropertyValue('--anchor-offset');
    const value = parseFloat(raw ?? '');
    return Number.isFinite(value) ? value : DEFAULT_ANCHOR_OFFSET_PX;
  }

  /** Scrolls to `target`; resolves once it has arrived and holds focus. */
  scrollToElement(target: HTMLElement): Promise<void> {
    const offset = this.anchorOffset();
    const immediate = this.motion.reducedMotion();
    const arrive = () => target.focus({ preventScroll: true });

    if (this.scroller) {
      // Lenis already subtracts the target's scroll-margin-top; only add what it lacks
      const view = this.document.defaultView;
      const margin = parseFloat(view?.getComputedStyle(target).scrollMarginTop ?? '') || 0;
      return new Promise((resolve) => {
        this.scroller!.scrollTo(target, {
          offset: margin - offset,
          duration: SCROLL_DURATION_S,
          easing: easeOutExpo,
          immediate,
          onComplete: () => {
            arrive();
            resolve();
          },
        });
      });
    }

    const view = this.document.defaultView;
    const top = target.getBoundingClientRect().top + (view?.scrollY ?? 0) - offset;
    view?.scrollTo({ top, behavior: immediate ? 'auto' : 'smooth' });
    arrive();
    return Promise.resolve();
  }
}
