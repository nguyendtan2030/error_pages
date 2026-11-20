import { Directive, ElementRef, inject } from '@angular/core';
import { useGsap } from './gsap-scope';

const MAX_SHIFT_PX = 6;

/** Pulls the host slightly toward the pointer on devices with a fine pointer. */
@Directive({ selector: '[appMagnetic]' })
export class MagneticDirective {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    useGsap(
      () => this.host,
      ({ gsap }) => {
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
          return;
        }
        const toX = gsap.quickTo(this.host, 'x', { duration: 0.4, ease: 'power3.out' });
        const toY = gsap.quickTo(this.host, 'y', { duration: 0.4, ease: 'power3.out' });

        const move = (event: PointerEvent) => {
          const rect = this.host.getBoundingClientRect();
          const dx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
          const dy = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
          toX(gsap.utils.clamp(-1, 1, dx) * MAX_SHIFT_PX);
          toY(gsap.utils.clamp(-1, 1, dy) * MAX_SHIFT_PX);
        };
        const leave = () => gsap.to(this.host, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });

        this.host.addEventListener('pointermove', move);
        this.host.addEventListener('pointerleave', leave);
        return () => {
          this.host.removeEventListener('pointermove', move);
          this.host.removeEventListener('pointerleave', leave);
        };
      },
    );
  }
}
