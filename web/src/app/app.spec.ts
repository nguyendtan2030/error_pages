import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { MotionService } from './shared/motion';
import { SmoothScrollService } from './shared/motion/smooth-scroll.service';
import { fakeMotionService } from './shared/motion/testing/fake-motion';

describe('App', () => {
  // Reduced motion keeps Lenis (which needs ResizeObserver, absent in jsdom) out of these tests.
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MotionService, useValue: fakeMotionService(null, { reduced: true }) }],
    });
  });

  it('eases in-page links to their section instead of jumping', () => {
    const scrollToElement = vi.fn(() => Promise.resolve());
    TestBed.configureTestingModule({
      providers: [{ provide: SmoothScrollService, useValue: { scrollToElement, register: () => {}, anchorOffset: () => 80 } }],
    });
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    document.body.appendChild(host);

    const link = host.querySelector<HTMLAnchorElement>('a[href="#main"]')!;
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(scrollToElement).toHaveBeenCalledWith(host.querySelector('#main'));
    host.remove();
  });

  it('renders the main landmark', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('main#main')).not.toBeNull();
  });

  it('offers a skip link to the main content', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const skip = fixture.nativeElement.querySelector('a.skip-link') as HTMLAnchorElement | null;
    expect(skip?.getAttribute('href')).toBe('#main');
  });
});
