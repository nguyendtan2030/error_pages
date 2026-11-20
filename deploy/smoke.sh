#!/usr/bin/env bash
# Smoke test for the meozlabs-web container (or the live site behind NPM).
# Usage: deploy/smoke.sh <base-url> [--skip-healthz]
# Exits 0 only when every check passes.
set -euo pipefail

BASE="${1:?usage: smoke.sh <base-url> [--skip-healthz]}"
BASE="${BASE%/}"
SKIP_HEALTHZ="${2:-}"

failures=0
pass() { printf '  PASS  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; failures=$((failures + 1)); }

# fetch <path> -> sets STATUS, HEADERS (lower-cased names), BODY
fetch() {
  local tmp_h tmp_b
  tmp_h="$(mktemp)"
  tmp_b="$(mktemp)"
  STATUS="$(curl -sS -o "$tmp_b" -D "$tmp_h" -w '%{http_code}' --max-time 15 "$BASE$1" 2>/dev/null || true)"
  [[ "$STATUS" =~ ^[0-9]{3}$ && "$STATUS" != 000 ]] || STATUS=unreachable
  HEADERS="$(tr -d '\r' < "$tmp_h" | sed 's/^\([^:]*\):/\L\1:/')"
  BODY="$(tr -d '\000' < "$tmp_b")"
  rm -f "$tmp_h" "$tmp_b"
}

header() { { printf '%s\n' "$HEADERS" | grep -i "^$1:" || true; } | tail -n1 | cut -d: -f2- | sed 's/^ *//'; }

expect_status() {
  fetch "$1"
  if [[ "$STATUS" == "$2" ]]; then pass "GET $1 -> $2"; else fail "GET $1 -> expected $2, got $STATUS"; fi
}

expect_header_contains() {
  local value
  value="$(header "$2")"
  if [[ "$value" == *"$3"* ]]; then pass "$1: $2 contains '$3'"; else fail "$1: $2 '$value' lacks '$3'"; fi
}

echo "Smoke test against $BASE"

# --- page ---
expect_status / 200
expect_header_contains / cache-control no-cache
if [[ "$BODY" == *"Meoz Labs"* ]]; then pass "/ body contains 'Meoz Labs'"; else fail "/ body lacks 'Meoz Labs'"; fi
ROOT_BODY="$BODY"

expect_header_contains / content-security-policy "'strict-dynamic' 'self'; style-src"
csp1="$(header content-security-policy)"
fetch /
csp2="$(header content-security-policy)"
nonce1="$(grep -oE "'nonce-[^']+'" <<< "$csp1" || true)"
nonce2="$(grep -oE "'nonce-[^']+'" <<< "$csp2" || true)"
if [[ -n "$nonce1" && "$nonce1" != "$nonce2" ]]; then pass "/: CSP nonce is fresh per response"; else fail "/: CSP nonce missing or reused ('$nonce1' / '$nonce2')"; fi
nonce_value="${nonce2#\'nonce-}"; nonce_value="${nonce_value%\'}"
if [[ "$BODY" == *"mailto:"* && "$BODY" != *"email-protection"* ]]; then pass "/: email link not obfuscated by Cloudflare"; else fail "/: email link obfuscated or missing"; fi
if grep -qE "<script nonce=\"$nonce_value\"[^>]*src=\"main-" <<< "$BODY"; then pass "/: main script carries the header's nonce"; else fail "/: main script lacks the header's nonce"; fi
if [[ "$csp1" =~ script-src[^\;]*unsafe-inline ]]; then fail "/: script-src allows 'unsafe-inline'"; else pass "/: script-src has no 'unsafe-inline'"; fi

expect_header_contains / x-content-type-options nosniff
expect_header_contains / referrer-policy strict-origin-when-cross-origin
expect_header_contains / x-frame-options DENY
if [[ -n "$(header permissions-policy)" ]]; then pass "/: permissions-policy present"; else fail "/: permissions-policy missing"; fi
server="$(header server)"
if [[ "$server" =~ [0-9] ]]; then fail "/: server header leaks a version ('$server')"; else pass "/: server header has no version ('$server')"; fi

expect_status '/?utm_source=x' 200
expect_status /index.html 200

# --- unknown URLs ---
for path in /what-we-do /index.php /wp-login.php; do
  expect_status "$path" 404
done

# --- health ---
if [[ "$SKIP_HEALTHZ" != "--skip-healthz" ]]; then
  expect_status /healthz 200
  if [[ "$(printf '%s' "$BODY" | tr -d '[:space:]')" == "ok" ]]; then pass "/healthz body is 'ok'"; else fail "/healthz body is '$BODY'"; fi
fi

# --- hashed JS ---
main_js="$(printf '%s' "$ROOT_BODY" | grep -oE 'main-[A-Za-z0-9]+\.js' | head -n1 || true)"
if [[ -z "$main_js" ]]; then
  fail "/ references no main-*.js"
else
  expect_status "/$main_js" 200
  expect_header_contains "/$main_js" cache-control immutable
  expect_header_contains "/$main_js" x-content-type-options nosniff
fi

# --- images ---
expect_status /images/meoz-lab-560.webp 200
expect_header_contains /images/meoz-lab-560.webp cache-control max-age=2592000

if (( failures > 0 )); then
  echo "smoke FAILED: $failures check(s)"
  exit 1
fi
echo "smoke OK"
