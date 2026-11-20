import { TestBed } from '@angular/core/testing';
import { MotionService } from '../../shared/motion';
import { fakeMotionService } from '../../shared/motion/testing/fake-motion';
import { WhatWeDo } from './what-we-do';

describe('WhatWeDo', () => {
  function render(): HTMLElement {
    TestBed.configureTestingModule({
      providers: [{ provide: MotionService, useValue: fakeMotionService(null, { reduced: true }) }],
    });
    const fixture = TestBed.createComponent(WhatWeDo);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const text = (el: Element | null) => el?.textContent?.replace(/\s+/g, ' ').trim();
  const all = (host: HTMLElement, selector: string) => Array.from(host.querySelectorAll(selector));

  it('is the what-we-do anchor', () => {
    expect(render().querySelector('section#what-we-do')).not.toBeNull();
  });

  it('titles the section', () => {
    const host = render();

    expect(text(host.querySelector('h2'))).toBe('From bold ideas to products people use');
    expect(text(host.querySelector('.section-head .lead'))).toBe(
      'Every product at Meoz Labs starts as an experiment and grows into a solution that runs in production.',
    );
  });

  it('draws the process', () => {
    expect(all(render(), '.process .step-label').map(text)).toEqual(['Idea', 'Prototype', 'Build', 'Ship', 'Run']);
  });

  it('shows the four pillars', () => {
    const pillars = all(render(), '.pillar');

    expect(pillars.map((p) => text(p.querySelector('h3')))).toEqual([
      'Crafting digital solutions',
      'Exploring bold ideas',
      'Pushing web development',
      'Engineering for production',
    ]);
    expect(pillars.map((p) => text(p.querySelector('p')))).toEqual([
      'We design and build end-to-end products, from scalable backend services to modern web interfaces.',
      'Ideas start as small experiments: we prototype fast, learn from real use and keep what works.',
      'Modern frameworks, thoughtful UX and fast, accessible experiences on every screen.',
      'Clean architecture, automated delivery and our own infrastructure keep every product running.',
    ]);
    expect(pillars.every((p) => p.hasAttribute('appspotlight'))).toBe(true);
  });

  it('lists what Meoz Labs has built', () => {
    const host = render();
    const products = all(host, '.product');

    expect(text(host.querySelector('.built-by h3'))).toBe('Built by Meoz Labs');
    expect(products.map((p) => text(p.querySelector('.name')))).toEqual(['PracticeCSharp', 'Easup Agri']);

    const [practice, agri] = products;
    expect(text(practice.querySelector('.status'))).toBe('Live');
    expect(practice.querySelector('a')?.getAttribute('href')).toBe('https://practice.meozlabs.com');
    expect(practice.querySelector('a')?.getAttribute('rel')).toContain('noopener');
    expect(text(agri.querySelector('.status'))).toBe('In development');
    expect(agri.querySelector('a')).toBeNull();
  });

  it('never mentions Easup Charity Fund', () => {
    expect(render().textContent).not.toMatch(/charity/i);
  });

  it('names no internal service', () => {
    expect(render().textContent).not.toMatch(/vault|grafana|immich|seafile|dozzle|couchdb|192\.168|:\d{2,5}/i);
  });
});
