import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject } from '@angular/core';
import Lenis from 'lenis';
import { Backdrop } from './components/backdrop/backdrop';
import { Navbar } from './components/navbar/navbar';
import { SiteFooter } from './components/site-footer/site-footer';
import { Hero } from './sections/hero/hero';
import { WhatWeDo } from './sections/what-we-do/what-we-do';
import { MotionService } from './shared/motion';
import { SmoothScrollService } from './shared/motion/smooth-scroll.service';

@Component({
  selector: 'app-root',
  imports: [Backdrop, Navbar, SiteFooter, Hero, WhatWeDo],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(click)': 'onClick($event)' },
})
export class App {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly motion = inject(MotionService);
  private readonly smoothScroll = inject(SmoothScrollService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // Smooth scrolling exists only in the browser, never while prerendering, and not for reduced motion.
    afterNextRender(() => void this.initScrolling());
  }

  /** In-page links ease to their section (clearing the navbar) instead of jumping. */
  protected onClick(event: MouseEvent): void {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) {
      return;
    }
    const link = (event.target as Element | null)?.closest?.('a[href^="#"]');
    const id = link?.getAttribute('href')?.slice(1);
    const target = id ? this.host.nativeElement.ownerDocument.getElementById(id) : null;
    if (!target) {
      return;
    }
    event.preventDefault();
    void this.smoothScroll.scrollToElement(target);
  }

  private async initScrolling(): Promise<void> {
    if (this.motion.reducedMotion()) {
      return;
    }
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    this.smoothScroll.register(lenis);
    const cleanups: (() => void)[] = [() => this.smoothScroll.register(null), () => lenis.destroy()];
    let destroyed = false;
    this.destroyRef.onDestroy(() => {
      destroyed = true;
      cleanups.forEach((cleanup) => cleanup());
    });

    const kit = await this.motion.load();
    if (destroyed) {
      return;
    }
    if (!kit) {
      // GSAP unavailable: drive Lenis with a plain animation frame loop
      let frame = 0;
      const raf = (time: number) => {
        lenis.raf(time);
        frame = requestAnimationFrame(raf);
      };
      frame = requestAnimationFrame(raf);
      cleanups.push(() => cancelAnimationFrame(frame));
      return;
    }

    const { gsap, ScrollTrigger } = kit;
    const tick = (time: number) => lenis.raf(time * 1000);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    cleanups.push(() => gsap.ticker.remove(tick));
  }
}
