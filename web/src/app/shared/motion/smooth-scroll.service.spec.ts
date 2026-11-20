import { TestBed } from '@angular/core/testing';
import { MotionService } from './motion.service';
import { DEFAULT_ANCHOR_OFFSET_PX, SmoothScrollService, SmoothScroller } from './smooth-scroll.service';
import { fakeMotionService } from './testing/fake-motion';

describe('SmoothScrollService', () => {
  let target: HTMLElement;

  beforeEach(() => {
    target = document.createElement('section');
    target.tabIndex = -1;
    document.body.appendChild(target);
  });

  afterEach(() => target.remove());

  function setup(reduced = false) {
    TestBed.configureTestingModule({
      providers: [{ provide: MotionService, useValue: fakeMotionService(null, { reduced }) }],
    });
    return TestBed.inject(SmoothScrollService);
  }

  function fakeLenis() {
    return { scrollTo: vi.fn((_t: unknown, opts: { onComplete?: () => void }) => opts.onComplete?.()) };
  }

  it('eases to the section with Lenis, leaving room for the fixed nav', async () => {
    const service = setup();
    const lenis = fakeLenis();
    service.register(lenis as unknown as SmoothScroller);

    await service.scrollToElement(target);

    const [el, opts] = lenis.scrollTo.mock.calls[0];
    expect(el).toBe(target);
    expect(opts).toMatchObject({ offset: -DEFAULT_ANCHOR_OFFSET_PX, duration: 1.2, immediate: false });
    expect((opts as { easing: (t: number) => number }).easing(1)).toBeCloseTo(1);
  });

  it('scrolls anchors 80px above the target', async () => {
    const service = setup();
    const lenis = fakeLenis();
    service.register(lenis as unknown as SmoothScroller);
    target.id = 'what-we-do';

    await service.scrollToElement(target);

    expect(lenis.scrollTo.mock.calls[0][1]).toMatchObject({ offset: -80 });
  });

  it('does not count the clearance twice when the section already has scroll-margin-top', async () => {
    const service = setup();
    const lenis = fakeLenis();
    service.register(lenis as unknown as SmoothScroller);
    target.style.scrollMarginTop = `${DEFAULT_ANCHOR_OFFSET_PX}px`;

    await service.scrollToElement(target);

    // Lenis subtracts scroll-margin-top itself
    expect(lenis.scrollTo.mock.calls[0][1]).toMatchObject({ offset: 0 });
  });

  it('jumps straight there for visitors who prefer reduced motion', async () => {
    const service = setup(true);
    const lenis = fakeLenis();
    service.register(lenis as unknown as SmoothScroller);

    await service.scrollToElement(target);

    expect(lenis.scrollTo.mock.calls[0][1]).toMatchObject({ immediate: true });
  });

  it('falls back to native smooth scrolling without Lenis', async () => {
    const service = setup();
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    await service.scrollToElement(target);

    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }));
  });

  it('moves keyboard focus to the section once it arrives, without scrolling again', async () => {
    const service = setup();
    service.register(fakeLenis() as unknown as SmoothScroller);
    const focus = vi.spyOn(target, 'focus');

    await service.scrollToElement(target);

    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('reads the clearance from the --anchor-offset CSS variable', () => {
    const service = setup();
    document.documentElement.style.setProperty('--anchor-offset', '200px');
    try {
      expect(service.anchorOffset()).toBe(200);
    } finally {
      document.documentElement.style.removeProperty('--anchor-offset');
    }
  });
});
