import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MotionService } from './motion.service';

describe('MotionService', () => {
  afterEach(() => document.documentElement.classList.remove('motion-ready'));

  it('never loads GSAP on the server', async () => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const service = TestBed.inject(MotionService);
    const importKit = vi.spyOn(service as any, 'importKit');

    expect(await service.load()).toBeNull();
    expect(importKit).not.toHaveBeenCalled();
  });

  it('reveals content when GSAP fails to load', async () => {
    const service = TestBed.inject(MotionService);
    vi.spyOn(service as any, 'importKit').mockRejectedValue(new Error('offline'));

    expect(await service.load()).toBeNull();
    expect(document.documentElement.classList.contains('motion-ready')).toBe(true);
  });

  it('reveals content after the fallback delay even while GSAP is still loading', async () => {
    vi.useFakeTimers();
    try {
      const service = TestBed.inject(MotionService);
      vi.spyOn(service as any, 'importKit').mockReturnValue(new Promise(() => {}));

      void service.load();
      vi.advanceTimersByTime(1500);

      expect(document.documentElement.classList.contains('motion-ready')).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('reports a late load when the fallback revealed content first', async () => {
    vi.useFakeTimers();
    try {
      const service = TestBed.inject(MotionService);
      let finish!: (kit: unknown) => void;
      vi.spyOn(service as any, 'importKit').mockReturnValue(new Promise((resolve) => (finish = resolve)));

      const loading = service.load();
      vi.advanceTimersByTime(1500);
      finish({ gsap: { registerPlugin: () => {} } });
      await loading;

      expect(service.loadedLate()).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('reports an on-time load when GSAP arrives before the fallback', async () => {
    const service = TestBed.inject(MotionService);
    vi.spyOn(service as any, 'importKit').mockResolvedValue({ gsap: { registerPlugin: () => {} } });

    await service.load();

    expect(service.loadedLate()).toBe(false);
  });
});
