import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  provideClientHydration,
  withNoHttpTransferCache,
  withNoIncrementalHydration,
} from '@angular/platform-browser';

// One page, no router: in-page anchors are plain links (Lenis handles them when it runs).
// Incremental hydration and event replay inject an inline event-contract script, which the CSP
// (script-src 'self') blocks; the page makes no HTTP calls, so the transfer cache goes too.
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideClientHydration(withNoIncrementalHydration(), withNoHttpTransferCache()),
  ],
};
