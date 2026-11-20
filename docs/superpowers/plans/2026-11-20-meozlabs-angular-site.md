# meozlabs.com Angular & GSAP Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static `index.html` of www.meozlabs.com with a prerendered Angular 22 + GSAP site that runs in its own nginx container behind NPM proxy host #7.

**Architecture:** A new Angular app in `web/` of the `error_pages` repo, prerendered to static HTML and served by `nginx:1.27-alpine` in container `meozlabs_web` bound to `172.17.0.1:4300`. NPM proxy host #7 forwards to it; the static `404.html`, `50x.html`, `_meoz/` and `server_proxy.conf` stay where they are and keep serving every host's error pages.

**Tech Stack:** Angular 22 (standalone, signals, zoneless, `@angular/ssr` static output), Tailwind CSS 3, SCSS, GSAP 3 (ScrollTrigger, SplitText), Lenis, Vitest via `@angular/build:unit-test`, Docker Compose, nginx.

**Spec:** `docs/superpowers/specs/2026-11-20-meozlabs-angular-site-design.md`

**Reference implementation:** `D:\Pet_Projects\Portfolio` (read-only). Copy, do not import, from it.

## Global Constraints

- Exactly four page parts: navbar, hero, lab, contact (+ footer). No About or Projects section.
- Site copy is English. No internal service names (vault, grafana, npm, immich, seafile, dozzle, couchdb), no IPs, no ports in page content.
- Components use `templateUrl` + `styleUrl` with sibling `.html` and `.scss`; no inline `template:`/`styles:`.
- Code touching `window`, `document` or GSAP runs only in the browser (`afterNextRender` or `isPlatformBrowser`); tweens and ScrollTriggers are reverted on destroy (`gsap.context()` + `revert()`).
- Every animation goes through `gsap.matchMedia()` with `(prefers-reduced-motion: no-preference)`; with reduced motion there is no animation and no Lenis.
- Static CSS never hides content; only the `motion-ready` class on `<html>`, added by script, gates `[data-reveal]`.
- Brand colours: teal `#2dd4bf`, violet `#8b5cf6`. Fonts: Space Grotesk (display), Inter (body), JetBrains Mono (labels), Google Fonts with `display=swap`.
- Icons are inline SVG; no Font Awesome or other icon font.
- No inline executable script and no inline event handler in the built HTML (CSP `script-src 'self'`). `application/ld+json` and `ng-state` JSON blocks are allowed.
- Container port: `172.17.0.1:4300:80`. Container name `meozlabs_web`. Image `meozlabs-web:latest`.
- Budgets: initial bundle error at 300 kB raw; any component style warning 10 kB, error 15 kB. Hero image ≤ 70 kB.
- Email `nguyendtan2030@gmail.com`; GitHub `https://github.com/nguyendtan2030`; portfolio `https://duytan.meozlabs.com/`.

## Review Focus

1. **CSP vs. Angular output:** Angular's critical-CSS inlining adds `onload="this.media='all'"` and `withEventReplay()` adds an inline script; either breaks `script-src 'self'`. Expected: neither appears in `dist/web/browser/index.html` (test in Task 1, check again in Task 8).
2. **Narrow phones (320 px):** the hero orbit badges and the lab flow diagram are the widest elements. Expected: no horizontal scroll at 320 px (check in Tasks 4, 5 and 9).
3. **GSAP chunk fails or arrives late:** expected: content becomes visible after the 1500 ms fallback and is not hidden and replayed (copied `MotionService` tests in Task 2).
4. **Unexpected URLs:** `/?utm_source=x` must return the page, `/lab`, `/index.php`, `/wp-login.php` must return 404, `/index.html` must return 200 (smoke test in Task 8).
5. **Anchor links under the sticky navbar:** `#lab` and `#contact` must not land under the 64 px navbar, with and without Lenis (offset test in Task 2, visual check in Task 9).

---

### Task 1: Scaffold the Angular app in `web/`

**Skills:** `angular-developer`, `test-driven-development`

**Files:**
- Create: `web/package.json`, `web/angular.json`, `web/tsconfig.json`, `web/tsconfig.app.json`, `web/tsconfig.spec.json`, `web/tailwind.config.js`, `web/.postcssrc.json` (or the Portfolio equivalent), `web/.gitignore`, `web/.editorconfig`, `web/.prettierrc`
- Create: `web/src/main.ts`, `web/src/main.server.ts`, `web/src/index.html`, `web/src/styles.scss`
- Create: `web/src/app/app.ts|html|scss`, `web/src/app/app.config.ts`, `web/src/app/app.config.server.ts`, `web/src/app/app.routes.ts`, `web/src/app/app.routes.server.ts`
- Create: `web/scripts/check-dist.mjs`
- Test: `web/src/app/app.spec.ts`

**Interfaces:**
- Produces: root component `App` (selector `app-root`) rendering `<main id="main">` as the slot later tasks fill; Tailwind colour tokens `bg`, `surface`, `text`, `muted`, `teal` (`#2dd4bf`), `violet` (`#8b5cf6`), `violet-text` (`#a78bfa`); font families `display`, `sans`, `mono`; npm scripts `start`, `build`, `test`, `check:dist`.

- [ ] **Step 1:** Copy the toolchain files from Portfolio (`package.json`, `angular.json`, tsconfigs, `tailwind.config.js`, PostCSS config, `.editorconfig`, `.prettierrc`), renaming the package to `meozlabs-web`. Keep the same dependency versions, drop `@angular/forms` and the Font Awesome links.
- [ ] **Step 2:** In `angular.json` production config set budgets `initial` warning `250kB` / error `300kB`, `anyComponentStyle` `10kB` / `15kB`, keep `outputMode: "static"` and `outputHashing: "all"`, and set `"optimization": { "scripts": true, "styles": { "minify": true, "inlineCritical": false }, "fonts": true }`.
- [ ] **Step 3:** `app.config.ts`: `provideBrowserGlobalErrorListeners()`, `provideZonelessChangeDetection()`, `provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled' }))`, `provideClientHydration()` **without** `withEventReplay()`. `app.routes.ts` has one route `''` → `App` content (no lazy pages); `app.routes.server.ts` prerenders `'**'`.
- [ ] **Step 4:** `styles.scss`: Tailwind layers, `html { scroll-padding-top: 80px }`, the `[data-reveal]` gate only under `html.motion-ready` (copy the Portfolio rule), focus-visible outline in teal, `body` background `#0d0b13`.
- [ ] **Step 5: Write the failing test** `app.spec.ts`: `it('renders the main landmark')` → `fixture.nativeElement.querySelector('main#main')` is not null.
- [ ] **Step 6:** Run `cd web && npm ci && npm test -- --watch=false`. Expected: FAIL (no `main#main`).
- [ ] **Step 7:** Implement `App` template with a skip link (`<a class="skip-link" href="#main">Skip to content</a>`) and `<main id="main"></main>`.
- [ ] **Step 8:** Write `scripts/check-dist.mjs` (`npm run check:dist`): reads `dist/web/browser/index.html`, exits 1 if it contains `onload=`, any `on[a-z]+="` attribute, or a `<script>` without `src` whose `type` is not `application/ld+json` or `application/json`; prints `dist OK` otherwise.
- [ ] **Step 9:** Run `npm test -- --watch=false && npm run build && npm run check:dist`. Expected: tests PASS, build prerenders `/`, prints `dist OK`.
- [ ] **Step 10: Commit** `git add web && git commit -m "feat(web): scaffold the Angular app for meozlabs.com"`

### Task 2: Motion library

**Skills:** `angular-developer`, `test-driven-development`

**Files:**
- Create: `web/src/app/shared/motion/` — copy from Portfolio: `motion.service.ts`, `gsap-scope.ts`, `reveal.directive.ts`, `split-text.directive.ts`, `magnetic.directive.ts`, `spotlight.directive.ts`, `smooth-scroll.service.ts`, `index.ts`, `testing/fake-motion.ts`, and their `*.spec.ts`
- Do not copy: `count-up.directive.*`, `format-count.*`

**Interfaces:**
- Produces (exported from `shared/motion/index.ts`): `MotionService` (`load(): Promise<MotionKit | null>`, `reducedMotion: Signal<boolean>`, `loadedLate: Signal<boolean>`), `MotionKit`, `REDUCED_MOTION_QUERY`, `useGsap(scope: () => Element, setup: (kit: MotionKit) => void): void`, directives `[appReveal]` (inputs `revealStagger = 0.06`, `revealY = 24`; animates `[data-reveal]` children), `[appSplitText]`, `[appMagnetic]`, `[appSpotlight]`, `SmoothScrollService` with `DEFAULT_ANCHOR_OFFSET_PX`.

- [ ] **Step 1:** Copy the files and specs; remove `CountUpDirective` and `formatCount` from `index.ts`.
- [ ] **Step 2:** Set `DEFAULT_ANCHOR_OFFSET_PX = 80` (64 px navbar + 16 px gap).
- [ ] **Step 3: Write the failing test** in `smooth-scroll.service.spec.ts`: `it('scrolls anchors 80px above the target')` asserting the Lenis `scrollTo` fake receives `{ offset: -80 }` for `#lab` (adapt the existing anchor test).
- [ ] **Step 4:** Run `npm test -- --watch=false`. Expected: the new test FAILS until Step 2's value is used, every copied test PASSES.
- [ ] **Step 5:** Fix anything the copy broke (imports, Font Awesome references) until all tests pass, including the copied fallback-timer and reduced-motion tests in `motion.service.spec.ts`.
- [ ] **Step 6: Commit** `git commit -m "feat(web): motion directives and smooth scroll from the portfolio"`

### Task 3: Navbar, footer and page backdrop

**Skills:** `angular-developer`, `ui-ux-pro-max`, `test-driven-development`

**Files:**
- Create: `web/src/app/components/navbar/navbar.ts|html|scss|spec.ts`
- Create: `web/src/app/components/site-footer/site-footer.ts|html|scss|spec.ts`
- Create: `web/src/app/components/backdrop/backdrop.ts|html|scss` (fixed bg image + two orbs)
- Create: `web/public/images/` — copy `meoz-lab-560.webp`, `meoz-lab-560.jpg`, `meoz-lab-bg.webp`, `favicon-32.png`, `apple-touch-icon.png` from `../_meoz/`
- Modify: `web/src/app/app.html`, `web/src/app/app.ts`

**Interfaces:**
- Consumes: `SmoothScrollService` (Task 2).
- Produces: `<app-navbar>`, `<app-site-footer>`, `<app-backdrop>` used by `App`.

- [ ] **Step 1: Write the failing tests**
  - `navbar.spec.ts`: `it('links to the lab, the portfolio and contact')` → hrefs are exactly `['#lab', 'https://duytan.meozlabs.com/', '#contact']` in that order, plus a brand link `#top` whose text is `MeozLabs`.
  - `site-footer.spec.ts`: `it('credits the stack')` → text contains `MeozLabs · Built with Angular & GSAP` and the current year.
- [ ] **Step 2:** Run `npm test -- --watch=false`. Expected: FAIL.
- [ ] **Step 3:** Implement the navbar: sticky, height 64 px, glass background, brand = 32 px favicon + gradient "MeozLabs"; links at ≥ 600 px, only the Contact button below 600 px; tap targets ≥ 40 px.
- [ ] **Step 4:** Implement the footer (`© {year} MeozLabs · Built with Angular & GSAP` and "Self-hosted with care in Ho Chi Minh City") and the backdrop (bg image opacity 0.12 + static `blur(12px)`; orbs are radial gradients animated with `transform` only; `aria-hidden="true"`).
- [ ] **Step 5:** Run `npm test -- --watch=false`. Expected: PASS.
- [ ] **Step 6: Commit** `git commit -m "feat(web): navbar, footer and backdrop"`

### Task 4: Hero section

**Skills:** `angular-developer`, `ui-ux-pro-max`, `test-driven-development`

**Files:**
- Create: `web/src/app/sections/hero/hero.ts|html|scss|spec.ts`
- Modify: `web/src/app/app.html`

**Interfaces:**
- Consumes: `SplitTextDirective`, `MagneticDirective`, `useGsap` (Task 2).
- Produces: `<app-hero>` with `id="top"`.

- [ ] **Step 1: Write the failing test** `hero.spec.ts`:
  - `it('introduces the lab and its owner')` → badge text `The personal lab of Tan Nguyen`; `h1` text `Meoz Labs`; role text `Full-Stack & DevOps Engineer · Ho Chi Minh City`.
  - `it('offers the two calls to action')` → links `Explore the lab` → `#lab` and `About me` → `https://duytan.meozlabs.com/`.
  - `it('orbits the lab stack')` → orbit badge labels are exactly `['Docker', 'Nginx', 'Cloudflare', 'GitHub Actions']`, container `aria-hidden="true"`.
  - `it('loads the logo as WebP with a JPG fallback')` → `<source type="image/webp" srcset="/images/meoz-lab-560.webp">`, `<img src="/images/meoz-lab-560.jpg" width="560" height="560" fetchpriority="high" alt="Meoz Labs logo">`.
- [ ] **Step 2:** Run tests. Expected: FAIL.
- [ ] **Step 3:** Implement: copy text from the current static `index.html`; logo in rings (the `<picture>` uses `display: contents` and `source { display: none }` so the image centres in the grid); orbit badges counter-rotate like Portfolio's `orbit-slot`/`orbit-counter`; intro timeline staggers `[data-intro]` children inside `useGsap` and `matchMedia`; buttons get `appMagnetic`.
- [ ] **Step 4:** Below 960 px stack the visual above the copy; below 600 px shrink the orbit radius so the widest badge stays inside the viewport at 320 px (Review Focus 2).
- [ ] **Step 5:** Run tests. Expected: PASS.
- [ ] **Step 6: Commit** `git commit -m "feat(web): hero with split title, magnetic CTAs and orbiting lab stack"`

### Task 5: Lab section

**Skills:** `angular-developer`, `ui-ux-pro-max`, `test-driven-development`

**Files:**
- Create: `web/src/app/sections/lab/lab.ts|html|scss|spec.ts`, `web/src/app/sections/lab/lab.data.ts`
- Modify: `web/src/app/app.html`

**Interfaces:**
- Consumes: `RevealDirective`, `SpotlightDirective`, `useGsap` (Task 2).
- Produces: `<app-lab>` with `id="lab"`; `lab.data.ts` exports `LAB_FLOW: readonly string[]`, `LAB_PIPELINE: readonly string[]`, `LAB_TILES: readonly { title: string; body: string; icon: 'server' | 'layers' | 'cloud' | 'pipeline' }[]`.

- [ ] **Step 1: Write the failing test** `lab.spec.ts`:
  - `it('titles the section')` → `h2` text `Built, shipped and run at home`.
  - `it('draws the request flow')` → flow node labels exactly `['Visitor', 'Cloudflare edge', 'Reverse proxy (TLS)', 'App containers']`; pipeline labels exactly `['git push', 'CI build', 'Image registry', 'Deploy']`.
  - `it('shows the four lab tiles')` → titles exactly `['Self-hosted server', 'Containers everywhere', 'Cloudflare at the edge', 'CI/CD to production']`, each with `appSpotlight`.
  - `it('names no internal service')` → section text matches none of `/vault|grafana|immich|seafile|dozzle|couchdb|192\.168|:\d{2,5}/i`.
- [ ] **Step 2:** Run tests. Expected: FAIL.
- [ ] **Step 3:** Implement the data file (tile bodies copied from the current static `index.html`) and the template: diagram as HTML nodes joined by an inline SVG path; inside `useGsap` + `matchMedia`, a ScrollTrigger draws the path (`strokeDashoffset`) and reveals nodes; the tile grid uses `appReveal` with `data-reveal` on each tile. 4 columns ≥ 960 px, 2 columns ≥ 600 px, 1 column below; the flow turns vertical below 600 px.
- [ ] **Step 4:** Run tests. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(web): lab section with request-flow diagram and spotlight tiles"`

### Task 6: Contact section

**Skills:** `angular-developer`, `ui-ux-pro-max`, `test-driven-development`

**Files:**
- Create: `web/src/app/sections/contact/contact.ts|html|scss|spec.ts`
- Modify: `web/src/app/app.html`

**Interfaces:**
- Consumes: `RevealDirective`, `MagneticDirective` (Task 2).
- Produces: `<app-contact>` with `id="contact"`.

- [ ] **Step 1: Write the failing test** `contact.spec.ts`: `it('offers three ways to get in touch')` → `h2` text `Let's build something`; links exactly `mailto:nguyendtan2030@gmail.com`, `https://github.com/nguyendtan2030` (with `rel` containing `noopener`), `https://duytan.meozlabs.com/`; labels `nguyendtan2030@gmail.com`, `github.com/nguyendtan2030`, `Portfolio & CV`.
- [ ] **Step 2:** Run tests. Expected: FAIL.
- [ ] **Step 3:** Implement the card (two columns ≥ 960 px, one below; email breaks only after `@` via `<wbr>`).
- [ ] **Step 4:** Run tests. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(web): contact section"`

### Task 7: SEO metadata

**Skills:** `angular-developer`, `test-driven-development`

**Files:**
- Modify: `web/src/index.html`
- Create: `web/public/robots.txt`, `web/public/sitemap.xml`
- Modify: `web/scripts/check-dist.mjs`

- [ ] **Step 1: Write the failing check** in `check-dist.mjs`: the built `index.html` must contain `<title>Meoz Labs - The personal lab of Tan Nguyen</title>`, `name="description"`, `property="og:image" content="https://www.meozlabs.com/images/meoz-lab-560.jpg"`, `rel="canonical" href="https://www.meozlabs.com/"`, and an `application/ld+json` block whose parsed JSON has `@type: "WebSite"` and `author.@type: "Person"` with `sameAs` containing the portfolio and GitHub URLs; `robots.txt` and `sitemap.xml` exist in `dist/web/browser`.
- [ ] **Step 2:** Run `npm run build && npm run check:dist`. Expected: FAIL.
- [ ] **Step 3:** Add the head tags (title and description text from the spec §4, OG, `theme-color #0d0b13`, favicon, apple-touch-icon, Google Fonts preconnect + stylesheet, preload `/images/meoz-lab-560.webp`), JSON-LD, `robots.txt` (allow all, sitemap URL) and `sitemap.xml` (one URL `https://www.meozlabs.com/`).
- [ ] **Step 4:** Run again. Expected: `dist OK`.
- [ ] **Step 5: Commit** `git commit -m "feat(web): SEO metadata, JSON-LD, robots and sitemap"`

### Task 8: Container, nginx and deploy scripts

**Skills:** `test-driven-development`, `verification-before-completion`

**Files:**
- Create: `web/Dockerfile`, `web/.dockerignore`, `web/nginx/default.conf`, `web/nginx/security-headers.conf`
- Create: `compose.yaml` (repo root), `deploy/smoke.sh`, `deploy/deploy.sh`, `deploy/README.md`

**Interfaces:**
- Produces: `deploy/smoke.sh <base-url>` exits 0 only when every check passes; `deploy/deploy.sh` (runs on the server from the repo root).

- [ ] **Step 1: Write the failing smoke test** `deploy/smoke.sh <base>` (bash, `set -euo pipefail`, curl) asserting:
  - `GET /` → 200, `Cache-Control` contains `no-cache`, body contains `Meoz Labs`.
  - `GET /?utm_source=x` → 200; `GET /index.html` → 200.
  - `GET /lab`, `/index.php`, `/wp-login.php` → 404.
  - `GET /healthz` → 200 body `ok`.
  - the first `main-*.js` referenced by `/` → `Cache-Control` contains `immutable`.
  - `GET /images/meoz-lab-560.webp` → 200, `max-age=2592000`.
  - `/` has headers `Content-Security-Policy` (containing `script-src 'self'`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy`; the JS response also has `X-Content-Type-Options` (proves the snippet is included per location).
  - no `Server` header version (`server_tokens off`).
- [ ] **Step 2:** Run `bash deploy/smoke.sh http://localhost:4300`. Expected: FAIL (nothing listening).
- [ ] **Step 3:** Write `Dockerfile` (stage 1 `node:22-alpine`: `npm ci`, `npm run build`; stage 2 `nginx:1.27-alpine`: copy `dist/web/browser` to `/usr/share/nginx/html` and both nginx files), `.dockerignore` (`node_modules`, `dist`, `.angular`), and `default.conf` / `security-headers.conf` exactly per spec §5 (CSP string verbatim).
- [ ] **Step 4:** Write `compose.yaml` per spec §5. For the local run only, start with an override that publishes `127.0.0.1:4300:80` (`docker compose -f compose.yaml -f compose.local.yaml up -d --build`, `compose.local.yaml` committed with `ports: !override ["127.0.0.1:4300:80"]`).
- [ ] **Step 5:** Run the local stack and `bash deploy/smoke.sh http://localhost:4300`. Expected: all checks PASS; `docker inspect -f '{{.State.Health.Status}}' meozlabs_web` → `healthy`.
- [ ] **Step 6:** Write `deploy/deploy.sh` per spec §5 (pull, `docker compose up -d --build`, wait ≤ 60 s for `healthy`, then `deploy/smoke.sh http://172.17.0.1:4300`, print container logs and exit non-zero on failure) and `deploy/README.md` (first deploy, pointing proxy host #7 via UI or via the backup + SQLite + `7.conf` commands, rollback).
- [ ] **Step 7:** Run `bash -n deploy/deploy.sh deploy/smoke.sh` and `shellcheck` if available. Expected: no errors.
- [ ] **Step 8: Commit** `git commit -m "feat(deploy): container, nginx config and deploy scripts for meozlabs-web"`

### Task 9: Browser verification

**Skills:** `verification-before-completion`, `ui-ux-pro-max`

- [ ] **Step 1:** With the local container up, open `http://localhost:4300/` at 1280×800, 375×812 and 320×640. Expected: no horizontal scroll (`scrollWidth === clientWidth`), logo centred in its ring (centres equal within 1 px), all four parts visible after scrolling.
- [ ] **Step 2:** Click Lab and Contact in the navbar. Expected: the section heading is fully below the navbar.
- [ ] **Step 3:** Emulate `prefers-reduced-motion: reduce` and reload. Expected: no running GSAP tweens, Lenis not attached, all content visible.
- [ ] **Step 4:** Load with JavaScript disabled. Expected: all text, images and links visible.
- [ ] **Step 5:** Read the console. Expected: no CSP violations, no errors.
- [ ] **Step 6:** Run Lighthouse (mobile) against `http://localhost:4300/`. Expected: Performance ≥ 90, Accessibility ≥ 95, CLS < 0.1; record the scores and the transfer size (≤ 250 kB excluding fonts) in the PR description.
- [ ] **Step 7:** Fix anything that failed in the owning task's files, re-run that task's tests, commit `fix(web): …`.

### Task 10: Cut over production

**Skills:** `verification-before-completion`

Ask the user before each server-changing step of this task.

**Files:**
- Delete: `index.html` (repo root)

- [ ] **Step 1:** Merge `feat/angular-site` into `main` and push (after the user approves).
- [ ] **Step 2:** On the server, back up `/home/meoz/error_pages`, `/home/meoz/npm/data/database.sqlite` and `/home/meoz/npm/data/nginx/proxy_host/7.conf` to `/home/meoz/backups/meozlabs-<timestamp>/`.
- [ ] **Step 3:** Run `deploy/deploy.sh` on the server. Expected: `healthy` and smoke checks PASS against `http://172.17.0.1:4300`.
- [ ] **Step 4:** Point proxy host #7: in SQLite set `forward_host='172.17.0.1'`, `forward_port=4300`, `advanced_config=''`, `caching_enabled=0`; regenerate `7.conf` with the default `location /` proxy block (copy the shape from `22.conf`, the practice host); `docker exec nginx-proxy-manager nginx -t` then `nginx -s reload`.
- [ ] **Step 5:** Verify live: `bash deploy/smoke.sh https://www.meozlabs.com` minus the `/healthz` check (exposed via NPM too, acceptable) and `https://meozlabs.com/` → new title; `/wp-login.php` → 404 with the static MeozLabs 404 page; `/_meoz/meoz-lab-radar-300.webp` → 200; `practice.meozlabs.com`, `duytan.meozlabs.com`, `practice-sso.meozlabs.com` unchanged status codes.
- [ ] **Step 6:** Delete the root `index.html` (no longer served), commit, push, `git pull` on the server.
- [ ] **Step 7:** Update the memory note `meozlabs-home-page-setup` with the container, port and host #7 forward.
