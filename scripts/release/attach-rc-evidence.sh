#!/usr/bin/env bash
set -euo pipefail

repo="$(pwd)"
rc_tag="$(git tag --list 'rc-*' --sort=-creatordate | head -n 1 || true)"
if [[ -z "${rc_tag:-}" ]]; then
  echo "ERR_NO_RC_TAG"
  exit 2
fi

base="_artifacts/release/rc/${rc_tag}"
mkdir -p "${base}/prod" "${base}/meta"

# Known evidence candidates (move/copy into RC allowlist if present)
candidates=(
  "PROVENANCE_"*.md
  "RELEASE_INDEX.md"
  "RELEASE_BUNDLE_"*.json
)

shopt -s nullglob
moved=0
for f in "${candidates[@]}"; do
  if [[ -f "$f" ]]; then
    # classify: provenance->meta, bundle->prod, index->meta
    dest="${base}/meta"
    [[ "$f" == RELEASE_BUNDLE_* ]] && dest="${base}/prod"
    mv -f "$f" "${dest}/"
    echo "MOVED: $f -> ${dest}/"
    moved=$((moved+1))
  fi
done
shopt -u nullglob

# Force-add allowlisted evidence only
git add -f "${base}/" >/dev/null 2>&1 || true
echo "OK_ATTACH_RC_EVIDENCE rc=${rc_tag} moved=${moved} path=${base}"
