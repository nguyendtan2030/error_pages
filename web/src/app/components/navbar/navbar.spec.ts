import { TestBed } from '@angular/core/testing';
import { Navbar } from './navbar';

describe('Navbar', () => {
  function render(): HTMLElement {
    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('links to what we do, the founder and contact', () => {
    const links = Array.from(render().querySelectorAll<HTMLAnchorElement>('nav a:not(.brand)')).map((a) => [
      a.textContent?.trim(),
      a.getAttribute('href'),
    ]);

    expect(links).toEqual([
      ['What we do', '#what-we-do'],
      ['Founder', 'https://duytan.meozlabs.com/'],
      ['Get in touch', '#contact'],
    ]);
  });

  it('leads with the MeozLabs brand linking to the top', () => {
    const brand = render().querySelector<HTMLAnchorElement>('nav a.brand');

    expect(brand?.getAttribute('href')).toBe('#top');
    expect(brand?.textContent?.trim()).toBe('MeozLabs');
  });
});
