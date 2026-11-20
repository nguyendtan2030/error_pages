import { TestBed } from '@angular/core/testing';
import { MotionService } from '../../shared/motion';
import { fakeMotionService } from '../../shared/motion/testing/fake-motion';
import { Contact } from './contact';

describe('Contact', () => {
  function render(): HTMLElement {
    TestBed.configureTestingModule({
      providers: [{ provide: MotionService, useValue: fakeMotionService(null, { reduced: true }) }],
    });
    const fixture = TestBed.createComponent(Contact);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const text = (el: Element | null) => el?.textContent?.replace(/\s+/g, ' ').trim();

  it('is the contact anchor', () => {
    expect(render().querySelector('section#contact')).not.toBeNull();
  });

  it('invites the visitor and names the founder', () => {
    const host = render();

    expect(text(host.querySelector('.kicker'))).toBe('Get in touch');
    expect(text(host.querySelector('h2'))).toBe("Have an idea? Let's build it together.");
    expect(text(host.querySelector('.contact-copy .lead'))).toBe(
      'Meoz Labs is founded and run by Tan Nguyen, a Full-Stack & DevOps engineer in Ho Chi Minh City.',
    );
  });

  it('offers three ways to get in touch', () => {
    const links = Array.from(render().querySelectorAll<HTMLAnchorElement>('.contact-links a'));

    expect(links.map((a) => [text(a), a.getAttribute('href')])).toEqual([
      ['nguyendtan2030@gmail.com', 'mailto:nguyendtan2030@gmail.com'],
      ['GitHub', 'https://github.com/nguyendtan2030'],
      ["Founder's portfolio", 'https://duytan.meozlabs.com/'],
    ]);
    expect(links[1].getAttribute('rel')).toContain('noopener');
  });
});
