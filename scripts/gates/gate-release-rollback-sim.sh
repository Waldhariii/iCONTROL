#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT" || exit 1

resolve() { git rev-parse "${1}^{commit}"; }

RC_TAG="${RC_TAG:-$(git tag -l 'rc-*' --sort=-creatordate | head -n 1)}"
PROD_TAG="${PROD_TAG:-$(git tag -l 'prod-candidate-*' --sort=-creatordate | head -n 1)}"
BASE_TAG="${BASE_TAG:-$(git tag -l 'baseline-*' --sort=-creatordate | head -n 1)}"

if [ -z "$RC_TAG" ] || [ -z "$PROD_TAG" ] || [ -z "$BASE_TAG" ]; then
  echo "ERR_ROLLBACK_SIM: RC_TAG/PROD_TAG/BASE_TAG required"
  exit 1
fi

for t in "$RC_TAG" "$PROD_TAG" "$BASE_TAG"; do
  git rev-parse -q --verify "$t" >/dev/null || { echo "ERR_ROLLBACK_SIM: missing tag $t"; exit 1; }
done

HEAD="$(git rev-parse HEAD)"
RC_HEAD="$(resolve "$RC_TAG")"
PROD_HEAD="$(resolve "$PROD_TAG")"
BASE_HEAD="$(resolve "$BASE_TAG")"

if ! git merge-base --is-ancestor "$BASE_HEAD" "$HEAD" 2>/dev/null; then
  echo "ERR_ROLLBACK_SIM: baseline is not ancestor of HEAD"
  echo "baseline=$BASE_TAG -> $BASE_HEAD"
  echo "head=$HEAD"
  exit 1
fi

STRICT="${ROLLBACK_SIM_STRICT:-1}"
if ! git merge-base --is-ancestor "$PROD_HEAD" "$HEAD" 2>/dev/null; then
  if [ "$STRICT" -eq 1 ]; then
    echo "ERR_ROLLBACK_SIM: prod-candidate is not ancestor of HEAD"
    echo "prod=$PROD_TAG -> $PROD_HEAD"
    echo "head=$HEAD"
    exit 1
  else
    echo "WARN_ROLLBACK_SIM: prod-candidate not ancestor of HEAD"
  fi
fi

echo "OK: rollback-sim PASS"
echo "HEAD=$HEAD"
echo "RC=$RC_TAG -> $RC_HEAD"
echo "PROD=$PROD_TAG -> $PROD_HEAD"
echo "BASE=$BASE_TAG -> $BASE_HEAD"
