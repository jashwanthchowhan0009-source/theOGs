#!/bin/sh
# Swap ?v=dev on CSS/JS links for the commit id, so phones fetch fresh files after each deploy.
# Used by GitHub Pages (.github/workflows/pages.yml) and Vercel (vercel.json).
set -e
cd "$(dirname "$0")/.."
SHA="${GITHUB_SHA:-${VERCEL_GIT_COMMIT_SHA:-$(date +%s)}}"
SHA=$(printf %s "$SHA" | cut -c1-7)
sed -i "s/?v=dev/?v=$SHA/g" index.html checkout.html
echo "Stamped assets with v=$SHA"
