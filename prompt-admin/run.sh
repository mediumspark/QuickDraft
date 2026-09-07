#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created prompt-admin/.env — add your Supabase URL and service role key, then run again."
  exit 1
fi

exec python3 app.py
