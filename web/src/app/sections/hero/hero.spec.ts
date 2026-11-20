import { TestBed } from '@angular/core/testing';
import { MotionService } from '../../shared/motion';
import { fakeMotionService } from '../../shared/motion/testing/fake-motion';
import { Hero } from './hero';

const LEAD =
  'We are a creative technology hub dedicated to crafting innovative digital solutions, exploring bold new ideas, and pushing the boundaries of web development and software engineering.';

describe('Hero', () => {
  function render(): HTMLElement {
    TestBed.configureTestingModule({
      providers: [{ provide: MotionService, useValue: fakeMotionService(null, { reduced: true }) }],
    });
    const fixture = TestBed.createComponent(Hero);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const text = (el: Element | null) => el?.textContent?.replace(/\s+/g, ' ').trim();

  it('introduces the hub', () => {
    const host = render();

    expect(text(host.querySelector('.badge'))).toBe('Innovation Hub');
    expect(text(host.querySelector('h1'))).toBe('Welcome to Meoz Labs');
    expect(text(host.querySelector('.lead'))).toBe(LEAD);
  });

  it('offers the two calls to action', () => {
    const ctas = Array.from(render().querySelectorAll<HTMLAnchorElement>('.ctas a')).map((a) => [
      text(a),
      a.getAttribute('href'),
    ]);

    expect(ctas).toEqual([
      ['Explore what we do', '#what-we-do'],
      ['Get in touch', '#contact'],
    ]);
  });

  it('credits the founder', () => {
    const founder = render().querySelector<HTMLAnchorElement>('a.founder');

    expect(text(founder)).toContain('Founded by Tan Nguyen');
    expect(text(founder)).toContain('Full-Stack & DevOps Engineer');
    expect(founder?.getAttribute('href')).toBe('https://duytan.meozlabs.com/');
  });

  it('orbits what the hub does', () => {
    const host = render();
    const orbit = host.querySelector('.orbit');
    const labels = Array.from(host.querySelectorAll('.orbit-badge .label')).map(text);

    expect(orbit?.getAttribute('aria-hidden')).toBe('true');
    expect(labels).toEqual(['Web Development', 'Software Engineering', 'Digital Solutions', 'Bold Ideas']);
  });

  it('loads the logo as WebP with a JPG fallback', () => {
    const host = render();
    const source = host.querySelector('picture source');
    const img = host.querySelector('picture img');

    expect(source?.getAttribute('type')).toBe('image/webp');
    expect(source?.getAttribute('srcset')).toBe('/images/meoz-lab-560.webp');
    expect(img?.getAttribute('src')).toBe('/images/meoz-lab-560.jpg');
    expect(img?.getAttribute('width')).toBe('560');
    expect(img?.getAttribute('height')).toBe('560');
    expect(img?.getAttribute('fetchpriority')).toBe('high');
    expect(img?.getAttribute('alt')).toBe('Meoz Labs logo');
  });

  it('is the top of the page', () => {
    expect(render().querySelector('section#top')).not.toBeNull();
  });
});
