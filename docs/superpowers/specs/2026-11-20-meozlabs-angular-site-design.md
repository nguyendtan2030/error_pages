# meozlabs.com bằng Angular & GSAP, chạy trong container

Ngày: 2026-11-20 · Repo: `error_pages` (github.com/nguyendtan2030/error_pages)

## 1. Bối cảnh

Hiện tại www.meozlabs.com là một file `index.html` tĩnh ở gốc repo `error_pages`. Repo này được mount vào container Nginx Proxy Manager (NPM) thành `/custom_errors`, và proxy host #7 phục vụ file đó qua `location = /`. Cùng repo còn chứa trang `404.html`, `50x.html`, ảnh trong `_meoz/` và `server_proxy.conf`. NPM include `server_proxy.conf` vào **mọi** proxy host.

Bản tĩnh đã giải quyết được chuyện ảnh nặng và lỗi tải, nhưng nhìn chưa chuyên nghiệp. Bản mới làm theo phong cách portfolio (duytan.meozlabs.com): Angular, GSAP, Lenis, Tailwind, và chạy trong container thay vì để NPM phục vụ file tĩnh.

## 2. Mục tiêu (giữ từ trước)

1. Giới thiệu **lab cá nhân** kèm **thương hiệu cá nhân** của Tan Nguyen. Đúng 4 phần: navbar, hero, lab, contact. Không có mục About hay Projects.
2. Tải nhanh, ảnh không lỗi: ảnh WebP nhỏ, đường dẫn tuyệt đối, ngân sách dung lượng ở mục 7.
3. Không công khai dịch vụ nội bộ (vault, grafana, npm, immich…), IP hay cổng.
4. Mobile tốt, tôn trọng `prefers-reduced-motion`, tắt JavaScript vẫn đọc được toàn bộ nội dung.
5. Cấu hình nginx và deploy viết sẵn đầy đủ: chạy `deploy/deploy.sh` là có site, không phải chỉnh tay thêm gì ngoài một lần trỏ proxy host #7.

Không nằm trong phạm vi: chuyển trang 404/50x sang Angular, CI/CD tự động, đa ngôn ngữ.

## 3. Cấu trúc repo

```
error_pages/
├─ 404.html, 50x.html        trang lỗi tĩnh, NPM phục vụ trực tiếp (giữ nguyên)
├─ _meoz/                    ảnh cho trang lỗi (giữ nguyên)
├─ server_proxy.conf         include vào mọi proxy host (giữ nguyên)
├─ web/                      app Angular 22 cho meozlabs.com
│  ├─ src/…
│  ├─ public/images/         ảnh WebP/JPG, favicon, touch icon của app
│  ├─ nginx/default.conf
│  ├─ nginx/security-headers.conf
│  ├─ Dockerfile
│  └─ .dockerignore
├─ compose.yaml              service meozlabs-web
├─ deploy/deploy.sh          chạy trên server
├─ deploy/README.md          cách deploy, cách trỏ proxy host #7, cách rollback
└─ docs/superpowers/…
```

- `index.html` ở gốc repo bị xoá khi chuyển sang container.
- Trang lỗi phải độc lập với app: nếu container chết, NPM trả 502 và phục vụ `50x.html` tĩnh.

## 4. App Angular

### Stack
- Angular 22, standalone components, signals, zoneless.
- Prerender tĩnh bằng `@angular/ssr`. Chỉ có một route `/`, prerender thành `index.html`.
- Tailwind CSS 3, SCSS.
- GSAP 3 (`ScrollTrigger`, `SplitText`) và Lenis.
- Test bằng Vitest, giống Portfolio.
- Component dùng `templateUrl` và `styleUrl` với file `.html` và `.scss` riêng, không viết inline template hay style.
- Chỉ chạy code đụng tới `window`, `document` hay GSAP trong trình duyệt (`afterNextRender` hoặc `isPlatformBrowser`).
- Mọi tween và ScrollTrigger phải dọn dẹp khi component bị huỷ (`gsap.context()` + `revert()`).

### Motion (copy từ Portfolio `src/app/shared/motion`)
- **Lấy về:** `MotionService` (tải GSAP lười, chỉ trong trình duyệt, có timer dự phòng), `RevealDirective`, `SplitTextDirective`, `MagneticDirective`, `SpotlightDirective`, `SmoothScrollService` (Lenis) và `gsap-scope`.
- **Giảm chuyển động:** mọi animation đi qua `gsap.matchMedia()` với `(prefers-reduced-motion: no-preference)`. Khi giảm chuyển động thì không có animation nào và không bật Lenis.
- **Nội dung luôn hiện:** chỉ script mới ẩn phần tử chờ hiệu ứng (qua class `motion-ready` trên `<html>`), CSS tĩnh không bao giờ ẩn. Tắt JS vẫn thấy đủ nội dung.
- **Không lấy về:** `CountUpDirective`, vì không có dải số liệu.

### Giao diện
- **Font:** Space Grotesk cho tiêu đề, Inter cho chữ thường, JetBrains Mono cho nhãn kỹ thuật. Tải qua Google Fonts, `display=swap`.
- **Màu:** token trong Tailwind theo portfolio (nền tối, chữ, chữ phụ), giữ hai màu nhận diện MeozLabs: teal `#2dd4bf` và tím `#8b5cf6`.
- **Icon:** SVG inline, không dùng Font Awesome, để nhẹ hơn và giữ CSP chặt.
- **Nền:** orb dùng gradient tròn, chỉ animate `transform` và `opacity`; không có `filter: blur` nào chuyển động.

### Các phần trang
1. **Navbar** (`components/navbar`)
   - Dính ở trên, nền kính mờ. Logo MeozLabs và các liên kết Lab · About me · Contact.
   - Dưới 600px chỉ còn logo và Contact.
   - Có link "Skip to content".
2. **Hero** (`sections/hero`)
   - Badge "The personal lab of Tan Nguyen".
   - `h1` "Meoz Labs" chạy hiệu ứng split-text.
   - Vai trò "Full-Stack & DevOps Engineer · Ho Chi Minh City", và một câu giới thiệu lab.
   - Hai nút có hiệu ứng magnetic: *Explore the lab* (`#lab`) và *About me* (`https://duytan.meozlabs.com/`).
   - Hình bên phải:
     - Logo mèo trong vòng xoay.
     - Quỹ đạo 4 badge: Docker, Nginx, Cloudflare, GitHub Actions. Badge được xoay ngược lại để chữ luôn đứng thẳng, giống portfolio.
3. **Lab** (`sections/lab`)
   - Tiêu đề "Built, shipped and run at home".
   - Sơ đồ luồng request, mô tả chung, không có tên host hay cổng:
     `Visitor → Cloudflare edge → Reverse proxy (TLS) → App containers`, cùng nhánh `git push → CI build → Image registry → deploy`.
     Dùng SVG và HTML; đường nối được vẽ dần bằng ScrollTrigger.
   - Bốn thẻ có hiệu ứng spotlight: Self-hosted server · Containers everywhere · Cloudflare at the edge · CI/CD to production. Nội dung giữ như bản tĩnh.
4. **Contact** (`sections/contact`)
   - Lời mời "Let's build something".
   - Ba nút: email `nguyendtan2030@gmail.com`, GitHub `github.com/nguyendtan2030`, *Portfolio & CV*.
5. **Footer** (`components/site-footer`): "© {năm} MeozLabs · Built with Angular & GSAP".

Nội dung trang viết bằng tiếng Anh.

### SEO và meta
- Thẻ `title` và `description` giữ như bản tĩnh. Thêm Open Graph (ảnh `/images/meoz-lab-560.jpg`), `theme-color`, favicon 32px và apple-touch-icon.
- Thêm JSON-LD kiểu `WebSite`, trong đó `author` là `Person` Tan Nguyen, kèm `sameAs` trỏ tới portfolio và GitHub.
- Thêm `robots.txt` và `sitemap.xml` có một URL.

## 5. Container và nginx

### `web/Dockerfile`
- **Stage 1:** `node:22-alpine`, `npm ci`, `npm run build`.
- **Stage 2:** `nginx:1.27-alpine`, copy `dist/web/browser` sang `/usr/share/nginx/html`, copy `nginx/default.conf` và `nginx/security-headers.conf`.

### `web/nginx/default.conf`
- `listen 80`; `absolute_redirect off`; `server_tokens off`.
- Gzip cho text, CSS, JS, JSON, SVG và manifest, với `gzip_min_length 1024` và `gzip_vary on`.
- **Định tuyến:** `try_files $uri $uri/index.html =404`. Đường dẫn không tồn tại trả 404 thật.
- **404:** container không có trang 404 riêng. NPM bật `proxy_intercept_errors`, nên thay bằng `404.html` tĩnh của MeozLabs.
- **Cache:**
  - File JS và CSS có hash trong tên (`~* \.[0-9a-f]{8,}\.(js|css)$`, dựa theo cách Angular đặt tên file): `Cache-Control: public, max-age=31536000, immutable`.
  - `/images/`, font, `.ico`, `.png`, `.webp`, `.jpg`, `.svg`: `public, max-age=2592000`.
  - `index.html` và `/`: `no-cache`, để mỗi lần deploy có hiệu lực ngay mà không phải purge Cloudflare.
- `location = /healthz`: trả `200 "ok"`, `access_log off`.
- **Security headers** nằm trong `security-headers.conf`, được include trong `server` và trong mọi `location` có `add_header` riêng (nginx bỏ header cấp server khi location tự khai báo `add_header`):
  - `Content-Security-Policy`: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'`.
  - Nếu bản build có sinh inline script hay handler `onload`, phải tắt nó trong `angular.json` (ví dụ `inlineCritical: false`) hoặc thêm hash cụ thể. Không được dùng `'unsafe-inline'` cho script.
  - `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
  - Không đặt HSTS ở container, vì NPM và Cloudflare đã lo TLS.

### `compose.yaml` (ở gốc repo)
- Service `meozlabs-web`: `build: ./web`, `image: meozlabs-web:latest`, `container_name: meozlabs_web`, `restart: unless-stopped`.
- `ports: ["172.17.0.1:4300:80"]`: chỉ NPM trên cùng máy gọi được, không mở ra LAN hay internet. Cách bind giống `practicecsharp-gateway-1`.
- `mem_limit: 128m`, `cpus: 0.25`.
- Healthcheck: `wget -qO- http://127.0.0.1/healthz`, mỗi 30 giây, timeout 3 giây, thử lại 3 lần.

### `deploy/deploy.sh`
Chạy trên server, trong `/home/meoz/error_pages`. Dùng `set -euo pipefail`.
1. `git pull --ff-only`.
2. `docker compose up -d --build`.
3. Chờ container `healthy`, tối đa 60 giây.
4. `curl -fsS http://172.17.0.1:4300/healthz` và `curl -fsS -o /dev/null http://172.17.0.1:4300/`.
5. In kết quả. Bước nào lỗi thì in log của container rồi thoát với mã khác 0.

Container chỉ có cổng nội bộ, nên script không đụng tới NPM.

### `deploy/README.md`
- Lần đầu: chạy `deploy/deploy.sh`, sau đó trỏ proxy host #7.
- Trỏ proxy host #7 qua UI: Forward Hostname `172.17.0.1`, Port `4300`, tắt Cache Assets, xoá trắng Advanced.
- Hoặc dùng lệnh đã chuẩn bị sẵn để sửa đồng thời DB SQLite và `proxy_host/7.conf`, rồi `nginx -t` và `nginx -s reload`, kèm bước backup.
- Rollback: `git checkout <sha>` rồi chạy lại `deploy.sh`. Muốn quay về bản tĩnh thì khôi phục `advanced_config` của host #7 từ backup.

## 6. NPM proxy host #7 sau khi chuyển

- Forward tới `http://172.17.0.1:4300`.
- `advanced_config` để trống, nên NPM tạo `location /` proxy sang container.
- `caching_enabled = 0`, vì container tự đặt header cache.
- `server_proxy.conf` không đổi:
  - `/_meoz/` vẫn phục vụ ảnh cho trang lỗi.
  - Lỗi 404 và 50x từ container được thay bằng trang lỗi tĩnh, giữ đúng mã trạng thái.
- Quét kiểu `/wp-login.php` giờ đi tới container và nhận 404 ngay, không còn vòng lặp proxy.

## 7. Ngân sách hiệu năng

- Lần tải đầu, đã nén, không tính font: tối đa khoảng 250 KB.
  - JS ban đầu tối đa khoảng 120 KB gzip. GSAP được tải lười sau lần vẽ đầu tiên và không tính vào con số này.
  - Ảnh hero tối đa 70 KB.
- `angular.json` budget: initial tối đa 300 kB (raw), báo lỗi nếu vượt; mỗi component style tối đa 10 kB.
- Lighthouse mobile chạy trên bản build cục bộ: hiệu năng ≥ 90, accessibility ≥ 95, CLS < 0.1.

## 8. Kiểm thử và nghiệm thu

- **Unit test (Vitest):**
  - Các directive motion: không chạy gì khi ở server, không chạy khi giảm chuyển động.
  - Navbar có đúng các liên kết.
  - Hero render đúng tiêu đề và hai nút.
  - Lab render đủ 4 thẻ và sơ đồ.
  - Contact có link `mailto:` và hai link ngoài.
  - Footer có chữ "Built with Angular & GSAP".
- **Build:** `npm run build` phải prerender `/` thành công và không vượt budget.
- **Container cục bộ:** `docker compose up -d --build`, sau đó kiểm:
  - `GET /` trả 200 và header `no-cache`.
  - File JS có hash trả `immutable`.
  - `GET /healthz` trả 200.
  - `GET /khong-ton-tai` trả 404.
  - Có đủ security header.
  - Container ở trạng thái `healthy`.
- **Trình duyệt:**
  - Desktop 1280px và mobile 375px: không có cuộn ngang, logo nằm đúng giữa vòng tròn.
  - Bật giảm chuyển động: trang tĩnh.
  - Tắt JS: đọc được đủ nội dung.
  - Console không có lỗi CSP.
- **Sau khi deploy:**
  - www.meozlabs.com và meozlabs.com đều trả trang mới.
  - `/wp-login.php` trả 404 với trang lỗi tĩnh.
  - `/_meoz/meoz-lab-radar-300.webp` trả 200.
  - Các subdomain khác vẫn hoạt động bình thường.

## 9. Rủi ro

- **Angular sinh inline script hoặc handler làm vỡ CSP:** xử lý bằng cấu hình build hoặc hash, kiểm tra ở mục 8.
- **Server build image chậm hoặc thiếu RAM:** `npm ci` và `ng build` chạy trên server mỗi lần deploy. Chấp nhận được vì portfolio cũng làm như vậy. Nếu không ổn thì chuyển sang build sẵn image và push lên GHCR, nhưng đó là việc sau, không nằm trong spec này.
- **Container dừng:** NPM trả trang 50x tĩnh, site vẫn có trang thương hiệu.
