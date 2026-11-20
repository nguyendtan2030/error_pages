import { ChangeDetectionStrategy, Component, ElementRef, inject } from '@angular/core';
import { MagneticDirective, MotionService, SplitTextDirective, useGsap } from '../../shared/motion';

type OrbitIcon = 'web' | 'software' | 'solutions' | 'ideas';

@Component({
  selector: 'app-hero',
  imports: [MagneticDirective, SplitTextDirective],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero {
  /** What Meoz Labs does, evenly spaced on one orbit around the logo. */
  protected readonly orbit: readonly { label: string; icon: OrbitIcon }[] = [
    { label: 'Web Development', icon: 'web' },
    { label: 'Software Engineering', icon: 'software' },
    { label: 'Digital Solutions', icon: 'solutions' },
    { label: 'Bold Ideas', icon: 'ideas' },
  ];

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly motion = inject(MotionService);

  constructor() {
    useGsap(
      () => this.host,
      ({ gsap }) => {
        if (this.motion.loadedLate()) {
          return; // already shown by the fallback; replaying it would blink
        }
        gsap.from('.hero-copy [data-intro]', {
          y: 24,
          opacity: 0,
          duration: 0.9,
          ease: 'expo.out',
          stagger: 0.08,
          delay: 0.15,
        });
        gsap.from('.logo-wrap', { scale: 0.9, opacity: 0, duration: 1.1, ease: 'expo.out' });
        // Badges pop onto their orbit one after another once the logo is in
        gsap.from('.orbit-badge', {
          scale: 0.6,
          opacity: 0,
          duration: 0.6,
          ease: 'back.out(1.7)',
          stagger: 0.12,
          delay: 0.6,
        });
      },
    );
  }
}
