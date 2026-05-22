#!/usr/bin/env bash
# Monitoring/incident demo: stop the production app so Prometheus loses the target
# and the AppInstanceDown alert fires, then bring it back.
# Usage: ./scripts/simulate-incident.sh <resource-group> <app-name> [down-seconds]
set -euo pipefail

RG="${1:?usage: simulate-incident.sh <rg> <app> [seconds]}"
APP="${2:?usage: simulate-incident.sh <rg> <app> [seconds]}"
DOWN="${3:-150}"

echo "Stopping $APP to trigger AppInstanceDown alert..."
az webapp stop --name "$APP" --resource-group "$RG"
echo "App stopped. Watch Prometheus /alerts and Alertmanager — alert should fire after ~1m."
echo "Sleeping ${DOWN}s..."
sleep "$DOWN"

echo "Restarting $APP to resolve the incident..."
az webapp start --name "$APP" --resource-group "$RG"
echo "App started. Alert should resolve shortly."
