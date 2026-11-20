import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MotionService } from './motion.service';
import { RevealDirective } from './reveal.directive';
import { createFakeKit, fakeMotionService } from './testing/fake-motion';

@Component({
  imports: [RevealDirective],
  template: `<section appReveal><p data-reveal>One</p><p data-reveal>Two</p></section>`,
})
class Host {}

function fakeKit(revert: () => void) {
  const gsap = {
    context: (fn: () => void) => {
      fn();
      return { revert };
    },
    matchMedia: () => ({ add: (_q: string, fn: () => void) => fn(), revert: () => {} }),
    from: vi.fn(),
  };
  return { gsap, ScrollTrigger: {}, SplitText: {}, Flip: {} };
}

describe('RevealDirective', () => {
  it('reverts its animations when destroyed', async () => {
    const revert = vi.fn();
    const motion = { loadedLate: () => false, load: () => Promise.resolve(fakeKit(revert)) };
    TestBed.configureTestingModule({ providers: [{ provide: MotionService, useValue: motion }] });

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.destroy();

    expect(revert).toHaveBeenCalledTimes(1);
  });

  it('animates the marked children', async () => {
    const kit = fakeKit(() => {});
    const motion = { loadedLate: () => false, load: () => Promise.resolve(kit) };
    TestBed.configureTestingModule({ providers: [{ provide: MotionService, useValue: motion }] });

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();

    const targets = kit.gsap.from.mock.calls[0][0] as Element[];
    expect(targets.length).toBe(2);
  });

  it('leaves on-screen content alone when GSAP arrives after the fallback showed it', async () => {
    const { kit, gsap } = createFakeKit();
    TestBed.configureTestingModule({
      providers: [{ provide: MotionService, useValue: fakeMotionService(kit, { late: true }) }],
    });

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();

    // jsdom lays everything out at the top of the viewport, so both paragraphs count as visible
    expect(gsap.from).not.toHaveBeenCalled();
  });

  it('switches off CSS transitions while it tweens, so hover transitions cannot drag items out of line', async () => {
    const { kit, gsap } = createFakeKit();
    TestBed.configureTestingModule({ providers: [{ provide: MotionService, useValue: fakeMotionService(kit) }] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    const [targets, vars] = gsap.from.mock.calls[0] as [HTMLElement[], { onComplete: () => void }];

    expect(targets.every((el) => el.style.transition === 'none')).toBe(true);

    targets.forEach((el) => (el.style.transform = 'translate(0px, 3px)'));
    vars.onComplete();

    expect(targets.every((el) => el.style.transition === '' && el.style.transform === '')).toBe(true);
  });
});
