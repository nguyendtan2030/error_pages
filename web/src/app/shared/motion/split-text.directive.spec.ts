import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MotionService } from './motion.service';
import { SplitTextDirective } from './split-text.directive';
import { createFakeKit, fakeMotionService } from './testing/fake-motion';

@Component({
  imports: [SplitTextDirective],
  template: `<h1 appSplitText>Tan Nguyen</h1>`,
})
class Host {}

describe('SplitTextDirective', () => {
  it('restores the plain heading once the entrance finishes, so line masks never clip descenders', async () => {
    const split = { chars: [], lines: [], revert: vi.fn() };
    const from = vi.fn();
    const kit = {
      gsap: {
        context: (fn: () => void) => (fn(), { revert: () => {} }),
        matchMedia: () => ({ add: (_q: string, fn: () => void) => fn() }),
        from,
      },
      SplitText: { create: () => split },
      ScrollTrigger: {},
      Flip: {},
    };
    TestBed.configureTestingModule({
      providers: [{ provide: MotionService, useValue: { loadedLate: () => false, load: () => Promise.resolve(kit) } }],
    });

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();

    const vars = from.mock.calls[0][1];
    vars.onComplete();

    expect(split.revert).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('h1').hasAttribute('aria-label')).toBe(false);
  });

  it('does not re-split a heading the fallback already showed', async () => {
    const { kit } = createFakeKit();
    TestBed.configureTestingModule({
      providers: [{ provide: MotionService, useValue: fakeMotionService(kit, { late: true }) }],
    });

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(kit.SplitText.create).not.toHaveBeenCalled();
  });
});
