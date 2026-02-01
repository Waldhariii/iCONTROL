#!/usr/bin/env bash
set -euo pipefail

head_sha="$(git rev-parse HEAD)"
rc_tag="$(git tag --list 'rc-*' --sort=-creatordate | head -n 1 || true)"
if [[ -z "${rc_tag:-}" ]]; then
  echo "ERR_NO_RC_TAG"
  exit 2
fi

suffix="${rc_tag#rc-}"
prod_tag="prod-candidate-${suffix}"
base_tag="baseline-${suffix}"

git tag -f "$rc_tag" "$head_sha"
git tag -f "$prod_tag" "$head_sha"
git tag -f "$base_tag" "$head_sha"

base_dir="_artifacts/release/rc/${rc_tag}/meta"
mkdir -p "$base_dir"

cat > "${base_dir}/tags.json" <<JSON
{
  "head": "${head_sha}",
  "rc": "${rc_tag}",
  "prod_candidate": "${prod_tag}",
  "baseline": "${base_tag}"
}
JSON

cat > "${base_dir}/TAGS_SNAPSHOT.md" <<MD
# Tags Snapshot (SSOT)
- head: ${head_sha}
- rc: ${rc_tag}
- prod-candidate: ${prod_tag}
- baseline: ${base_tag}
MD

echo "OK_TAG_SET_ATOMIC head=${head_sha} rc=${rc_tag} prod=${prod_tag} baseline=${base_tag}"

# FAILSAFE_UNSTAGE_TAG_SNAPSHOTS (generated-only)
git restore --staged --quiet -- "${base_dir}/TAGS_SNAPSHOT.md" "${base_dir}/tags.json" 2>/dev/null || true
