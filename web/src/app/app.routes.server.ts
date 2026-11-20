import { RenderMode, ServerRoute } from '@angular/ssr';

// The only page is prerendered to static HTML at build time.
export const serverRoutes: ServerRoute[] = [{ path: '**', renderMode: RenderMode.Prerender }];
