import { DestroyRef, afterNextRender, inject } from '@angular/core';
import { MotionKit, MotionService, REDUCED_MOTION_QUERY } from './motion.service';

/**
 * Runs `setup` once in the browser after the first render, inside a GSAP
 * context scoped to `scope` and a matchMedia that skips it under reduced
 * motion. Everything it creates is reverted when the caller is destroyed.
 * Call from an injection context (constructor or field initializer).
 */
export function useGsap(scope: () => Element, setup: (kit: MotionKit) => void): void {
  const motion = inject(MotionService);
  let destroyed = false;
  let ctx: { revert(): void } | null = null;

  inject(DestroyRef).onDestroy(() => {
    destroyed = true;
    ctx?.revert();
  });

  afterNextRender(() => {
    void motion.load().then((kit) => {
      if (!kit || destroyed) {
        return;
      }
      ctx = kit.gsap.context(() => {
        kit.gsap.matchMedia().add(REDUCED_MOTION_QUERY, () => setup(kit));
      }, scope());
    });
  });
}
