import { Directive } from '@angular/core';

/** Writes the pointer position into `--mx`/`--my` so `.spotlight` can draw a glow under it. */
@Directive({
  selector: '[appSpotlight]',
  host: {
    class: 'spotlight',
    '(pointermove)': 'track($event)',
  },
})
export class SpotlightDirective {
  protected track(event: PointerEvent): void {
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    el.style.setProperty('--my', `${event.clientY - rect.top}px`);
  }
}
