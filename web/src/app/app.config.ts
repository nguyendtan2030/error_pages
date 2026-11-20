import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';

// One page, no router: in-page anchors are plain links (Lenis handles them when it runs).
// No withEventReplay(): it injects an inline script, which the CSP (script-src 'self') blocks.
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideClientHydration(),
  ],
};
