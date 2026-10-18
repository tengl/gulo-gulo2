#!/usr/bin/env bash
set -euo pipefail

# Run from repository root; Vercel's project Root Directory must be apps/web.
target="${1:?Usage: bash tooling/deploy-web.sh preview|production}"
: "${VERCEL_TOKEN:?Missing VERCEL_TOKEN}"
: "${VERCEL_ORG_ID:?Missing VERCEL_ORG_ID}"
: "${VERCEL_PROJECT_ID:?Missing VERCEL_PROJECT_ID}"

flags=()
case "$target" in
  production) flags+=(--prod) ;;
  preview) ;;
  *) echo "Unknown environment: $target" >&2; exit 1 ;;
esac

npm exec -- vercel pull --yes --environment="$target" --token="$VERCEL_TOKEN"
npm exec -- vercel build "${flags[@]}" --token="$VERCEL_TOKEN"
url="$(npm exec -- vercel deploy --prebuilt "${flags[@]}" --token="$VERCEL_TOKEN")"
printf '%s\n' "$url"
if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  printf 'Vercel (%s): %s\n' "$target" "$url" >> "$GITHUB_STEP_SUMMARY"
fi
