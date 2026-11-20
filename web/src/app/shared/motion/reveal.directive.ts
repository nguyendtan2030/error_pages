import { Directive, ElementRef, inject, input } from '@angular/core';
import { useGsap } from './gsap-scope';
import { MotionService } from './motion.service';

/**
 * Fades and lifts the host's `[data-reveal]` descendants (or the host itself)
 * into place, staggered, the first time the host scrolls into view.
 */
@Directive({ selector: '[appReveal]' })
export class RevealDirective {
  readonly revealStagger = input(0.06);
  readonly revealY = input(24);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly motion = inject(MotionService);

  constructor() {
    useGsap(
      () => this.host,
      ({ gsap }) => {
        const marked = Array.from(this.host.querySelectorAll<HTMLElement>('[data-reveal]'));
        let targets = marked.length ? marked : [this.host];
        if (this.motion.loadedLate()) {
          // The fallback already showed these; only animate what is still below the fold
          targets = targets.filter((el) => el.getBoundingClientRect().top >= window.innerHeight);
        }
        if (!targets.length) {
          return;
        }
        // Cards and chips have CSS transitions on transform for hover. Left on, they
        // lag behind every GSAP frame and leave items out of line mid-reveal.
        const restore = () =>
          targets.forEach((el) => {
            el.style.transition = '';
            el.style.transform = '';
          });
        targets.forEach((el) => (el.style.transition = 'none'));
        gsap.from(targets, {
          autoAlpha: 0,
          y: this.revealY(),
          duration: 0.8,
          ease: 'power3.out',
          stagger: this.revealStagger(),
          scrollTrigger: { trigger: this.host, start: 'top 85%', once: true },
          onComplete: restore,
        });
        return restore;
      },
    );
  }
}
