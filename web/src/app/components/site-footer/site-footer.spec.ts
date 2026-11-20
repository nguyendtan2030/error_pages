import { TestBed } from '@angular/core/testing';
import { SiteFooter } from './site-footer';

describe('SiteFooter', () => {
  it('credits the stack', () => {
    const fixture = TestBed.createComponent(SiteFooter);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent?.replace(/\s+/g, ' ') ?? '';

    expect(text).toContain(`© ${new Date().getFullYear()} MeozLabs · Built with Angular & GSAP`);
  });
});
