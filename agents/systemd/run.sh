#!/usr/bin/env bash
# Helper exécuté par onze-agents@.service. Reçoit le suffixe d'instance en $1
# (ex: "ingest-foot", "analyze-basket", "compute-clv", "backtest-skill-foot").
# Mappe vers le job tsx correspondant.

set -euo pipefail

INSTANCE="${1:-}"
if [ -z "$INSTANCE" ]; then
  echo "Usage: run.sh <instance>" >&2
  echo "Examples: ingest-foot, analyze-basket, compute-clv, backtest-skill-foot" >&2
  exit 2
fi

cd /opt/onze-agents

# Précompile en dist/ si pas déjà fait (idempotent)
if [ ! -d dist ] || [ src/jobs -nt dist/jobs ]; then
  npx tsc --build
fi

case "$INSTANCE" in
  ingest-foot|ingest-basket|ingest-tennis|ingest-ufc)
    SPORT="${INSTANCE#ingest-}"
    exec node dist/jobs/ingest.js --sport "$SPORT"
    ;;
  analyze-foot|analyze-basket|analyze-tennis|analyze-ufc)
    SPORT="${INSTANCE#analyze-}"
    exec node dist/jobs/analyze.js --sport "$SPORT"
    ;;
  compute-clv)
    exec node dist/jobs/compute-clv.js
    ;;
  backtest-skill-foot|backtest-skill-basket|backtest-skill-tennis|backtest-skill-ufc)
    SPORT="${INSTANCE#backtest-skill-}"
    exec node dist/jobs/backtest-skill.js --sport "$SPORT" --n 30
    ;;
  *)
    echo "Unknown instance: $INSTANCE" >&2
    exit 2
    ;;
esac
