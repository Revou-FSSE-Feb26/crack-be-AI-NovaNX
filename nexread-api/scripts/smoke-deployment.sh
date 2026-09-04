#!/usr/bin/env bash

set -euo pipefail

base_url="${1:-}"

if [[ ! "$base_url" =~ ^https?://[^[:space:]]+$ ]]; then
  echo "Usage: $0 https://api.example.com" >&2
  exit 2
fi

base_url="${base_url%/}"

check_endpoint() {
  local endpoint="$1"
  local attempts="${2:-30}"
  local delay_seconds="${3:-5}"
  local response

  for ((attempt = 1; attempt <= attempts; attempt++)); do
    if response=$(curl --fail --silent --show-error \
      --connect-timeout 5 \
      --max-time 10 \
      "$base_url$endpoint" 2>/dev/null) &&
      grep -Eq '"status"[[:space:]]*:[[:space:]]*"ok"' <<< "$response"; then
      echo "$endpoint passed on attempt $attempt."
      return 0
    fi

    echo "$endpoint is not healthy yet (attempt $attempt/$attempts)."
    sleep "$delay_seconds"
  done

  echo "$endpoint did not become healthy." >&2
  return 1
}

check_endpoint /health/live
check_endpoint /health/ready

