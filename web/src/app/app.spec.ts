import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
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
