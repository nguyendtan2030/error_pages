import { Directive, ElementRef, inject } from '@angular/core';
import { useGsap } from './gsap-scope';
import { MotionService } from './motion.service';

/**
 * Splits a heading into masked lines and characters and slides the characters
 * up into view. Screen readers keep reading the original text.
 */
@Directive({ selector: '[appSplitText]' })
export class SplitTextDirective {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly motion = inject(MotionService);

  constructor() {
    useGsap(
      () => this.host,
      ({ gsap, SplitText }) => {
        if (this.motion.loadedLate()) {
          return undefined; // already shown by the fallback; replaying it would blink
        }
        const label = this.host.textContent?.trim() ?? '';
        this.host.setAttribute('aria-label', label);
        const split = SplitText.create(this.host, { type: 'lines,chars', mask: 'lines', aria: 'none' });
        split.lines.forEach((line) => line.setAttribute('aria-hidden', 'true'));
        // Put the plain text back once done: the line masks would clip descenders
        // and would not re-wrap on resize.
        const restore = () => {
          split.revert();
          this.host.removeAttribute('aria-label');
        };
        gsap.from(split.chars, {
          yPercent: 110,
          duration: 0.9,
          ease: 'expo.out',
          stagger: 0.025,
          onComplete: restore,
        });
        return restore;
      },
    );
  }
}
