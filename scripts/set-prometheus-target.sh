#!/usr/bin/env bash
# Inject the real App Service hostnames into prometheus.yml, then reload Prometheus.
# Run on the VM from infra/vm.  Usage:
#   ./scripts/set-prometheus-target.sh <prod-host> [staging-host]
# e.g. ./scripts/set-prometheus-target.sh ecomsaas-app.azurewebsites.net ecomsaas-app-staging.azurewebsites.net
set -euo pipefail

PROD_HOST="${1:?usage: set-prometheus-target.sh <prod-host> [staging-host]}"
STAGING_HOST="${2:-$PROD_HOST}"
CFG="$(dirname "$0")/../infra/vm/prometheus/prometheus.yml"

sed -i "s/__APP_HOSTNAME__/${PROD_HOST}/g" "$CFG"
sed -i "s/__STAGING_HOSTNAME__/${STAGING_HOST}/g" "$CFG"
echo "Updated targets in ${CFG}"

# Reload Prometheus (works if --web.enable-lifecycle is set) or restart the container.
curl -fsS -X POST http://localhost:9090/-/reload 2>/dev/null \
  && echo "Prometheus reloaded." \
  || (cd "$(dirname "$0")/../infra/vm" && docker compose restart prometheus && echo "Prometheus restarted.")
