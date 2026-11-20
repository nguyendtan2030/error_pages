import { ChangeDetectionStrategy, Component, ElementRef, inject } from '@angular/core';
import { RevealDirective, SpotlightDirective, useGsap } from '../../shared/motion';
import { PILLARS, PROCESS_STEPS, PRODUCTS } from './what-we-do.data';

@Component({
  selector: 'app-what-we-do',
  imports: [RevealDirective, SpotlightDirective],
  templateUrl: './what-we-do.html',
  styleUrl: './what-we-do.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhatWeDo {
  protected readonly steps = PROCESS_STEPS;
  protected readonly pillars = PILLARS;
  protected readonly products = PRODUCTS;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    // The process line draws itself, and its steps light up, as the diagram scrolls into view.
    useGsap(
      () => this.host,
      ({ gsap }) => {
        const timeline = gsap.timeline({
          scrollTrigger: { trigger: '.process', start: 'top 80%', once: true },
        });
        timeline
          .from('.process .track-fill', { scaleX: 0, scaleY: 0, duration: 1.4, ease: 'power2.inOut' })
          .from('.process .step', { y: 16, opacity: 0, duration: 0.6, ease: 'expo.out', stagger: 0.18 }, 0.1);
      },
    );
  }
}
