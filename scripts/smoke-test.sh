#!/usr/bin/env bash
# Smoke test a deployed environment: poll /health until it returns HTTP 200 + success:true.
# Usage: ./scripts/smoke-test.sh https://host
set -euo pipefail

BASE_URL="${1:?usage: smoke-test.sh <base-url>}"
HEALTH_URL="${BASE_URL%/}/health"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-20}"
SLEEP_SECONDS="${SLEEP_SECONDS:-15}"

echo "Smoke testing ${HEALTH_URL}"
for i in $(seq 1 "$MAX_ATTEMPTS"); do
  body="$(curl -fsS --max-time 10 "$HEALTH_URL" 2>/dev/null || true)"
  if echo "$body" | grep -q '"success":true'; then
    echo "PASS: ${HEALTH_URL} healthy on attempt ${i}"
    echo "$body"
    exit 0
  fi
  echo "  attempt ${i}/${MAX_ATTEMPTS}: not healthy yet, retrying in ${SLEEP_SECONDS}s..."
  sleep "$SLEEP_SECONDS"
done

echo "FAIL: ${HEALTH_URL} did not become healthy after ${MAX_ATTEMPTS} attempts"
exit 1
