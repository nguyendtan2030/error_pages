# Deploying meozlabs-web

The site runs in container `meozlabs_web` (image `meozlabs-web:latest`), bound to
`172.17.0.1:4300` so only Nginx Proxy Manager (NPM) on the same host can reach it.
NPM proxy host #7 (`www.meozlabs.com`, `meozlabs.com`) forwards to it. The static
`404.html`, `50x.html` and `_meoz/` in this repo, with `server_proxy.conf`, keep serving
every host's error pages.

## Every deploy

On the server:

```bash
cd /home/meoz/error_pages
bash deploy/deploy.sh
```

It pulls, rebuilds the image, waits up to 60 s for `healthy`, runs `deploy/smoke.sh`
against `http://172.17.0.1:4300`, and prints the container logs and exits non-zero if any
step fails. The page is served with `Cache-Control: no-cache`, so no Cloudflare purge is
needed.

## First deploy

### 1. Back up

```bash
TS=$(date +%Y%m%d-%H%M%S)
B=/home/meoz/backups/meozlabs-$TS
mkdir -p "$B"
cp -a /home/meoz/error_pages "$B/error_pages"
cp -a /home/meoz/npm/data/database.sqlite "$B/"
cp -a /home/meoz/npm/data/nginx/proxy_host/7.conf "$B/"
```

### 2. Start the container

```bash
cd /home/meoz/error_pages && git pull --ff-only && bash deploy/deploy.sh
```

### 3. Point proxy host #7 at the container

**Through the NPM UI (recommended; NPM regenerates `7.conf` itself):**
Hosts → Proxy Hosts → `www.meozlabs.com` → Edit:

- Details: Scheme `http`, Forward Hostname `172.17.0.1`, Forward Port `4300`,
  **Cache Assets off**. Keep Block Common Exploits and Websockets as they are.
- Advanced: clear the custom Nginx configuration.
- SSL tab: unchanged.

**Or from the shell:**

```bash
sqlite3 /home/meoz/npm/data/database.sqlite \
  "UPDATE proxy_host SET forward_scheme='http', forward_host='172.17.0.1', forward_port=4300,
          advanced_config='', caching_enabled=0, modified_on=datetime('now') WHERE id=7;"
```

Then rewrite `/home/meoz/npm/data/nginx/proxy_host/7.conf` to match: copy
`22.conf` (the practice host, a plain proxy host), and change its header comment,
`server_name`, certificate paths and access/error log names to host 7's (take them from
the backup of `7.conf`), with `set $server "172.17.0.1";` and `set $port 4300;`, and
the default block:

```nginx
location / {
  include conf.d/include/proxy.conf;
}
```

Then check and reload:

```bash
docker exec nginx-proxy-manager nginx -t && docker exec nginx-proxy-manager nginx -s reload
```

### 4. Verify live

```bash
bash deploy/smoke.sh https://www.meozlabs.com
curl -sI https://meozlabs.com/ | head -n1
curl -s -o /dev/null -w '%{http_code}\n' https://www.meozlabs.com/_meoz/meoz-lab-radar-300.webp   # 200
for h in practice duytan practice-sso; do curl -s -o /dev/null -w "$h %{http_code}\n" https://$h.meozlabs.com/; done
```

`/wp-login.php` must return 404 with the static MeozLabs 404 page (NPM intercepts the
container's 404).

## Rollback

- **Previous build:** `git checkout <sha> && bash deploy/deploy.sh` (on a detached HEAD,
  skip the pull: `docker compose up -d --build`).
- **Back to the old static page:** restore host #7 from the backup:
  `cp $B/database.sqlite /home/meoz/npm/data/database.sqlite` and
  `cp $B/7.conf /home/meoz/npm/data/nginx/proxy_host/7.conf`, then
  `docker restart nginx-proxy-manager`. The old root `index.html` was removed from the
  repo after the cutover, so also `cp $B/error_pages/index.html /home/meoz/error_pages/`.
  The cutover backup is `/home/meoz/backups/meozlabs-20261120-091036`.

## Local run

```bash
docker compose -f compose.yaml -f compose.local.yaml up -d --build
bash deploy/smoke.sh http://localhost:4300
```
