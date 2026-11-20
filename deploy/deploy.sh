#!/usr/bin/env bash
# Deploys meozlabs-web on the server. Run from the repo root (/home/meoz/error_pages).
# The container only binds 172.17.0.1:4300, so this script never touches NPM.
set -euo pipefail

cd "$(dirname "$0")/.."

BASE="http://172.17.0.1:4300"
CONTAINER="meozlabs_web"
TIMEOUT=60

on_failure() {
  echo "deploy FAILED; last container logs:" >&2
  docker logs --tail 50 "$CONTAINER" >&2 || true
  exit 1
}
trap on_failure ERR

echo "==> git pull"
git pull --ff-only

echo "==> docker compose up -d --build"
docker compose up -d --build

echo "==> waiting up to ${TIMEOUT}s for $CONTAINER to be healthy"
status=""
for ((i = 0; i < TIMEOUT; i += 2)); do
  status="$(docker inspect -f '{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null || echo missing)"
  [[ "$status" == healthy ]] && break
  sleep 2
done
if [[ "$status" != healthy ]]; then
  echo "container is '$status' after ${TIMEOUT}s" >&2
  false
fi
echo "    healthy"

echo "==> quick checks"
curl -fsS "$BASE/healthz" > /dev/null
curl -fsS -o /dev/null "$BASE/"

echo "==> smoke test"
bash deploy/smoke.sh "$BASE"

trap - ERR
echo "deploy OK: $(git rev-parse --short HEAD)"
