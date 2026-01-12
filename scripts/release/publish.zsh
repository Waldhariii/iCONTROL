#!/usr/bin/env zsh
set -euo pipefail

# ---- args/env ----
if [[ "${1:-}" == "TAG="* ]]; then
  export TAG="${1#TAG=}"
  shift
elif [[ -n "${TAG:-}" ]]; then
  : # TAG via env
else
  echo "ERROR: TAG not set. Usage: ./scripts/release/publish.zsh TAG=vX.Y.Z[-rcN|-toolsN] [flags]"
  exit 1
fi

REMOTE="${REMOTE:-origin}"
NOTES="_RELEASE_NOTES_${TAG}.md"
SCOPE="${SCOPE:-Product Release}"
MODE="prerelease"   # default
DRY_RUN=0
RETAG=0
FORCE_NOTES=0

# flags
while (( $# > 0 )); do
  case "$1" in
    --ga) MODE="ga" ;;
    --prerelease) MODE="prerelease" ;;
    --dry-run) DRY_RUN=1 ;;
    --retag) RETAG=1 ;;
    --force-notes) FORCE_NOTES=1 ;;
    --scope) shift; SCOPE="${1:-}"; [[ -n "$SCOPE" ]] || { echo "ERROR: --scope requires a value"; exit 1; } ;;
    *) echo "ERROR: unknown arg: $1"; exit 1 ;;
  esac
  shift
done

# ---- helpers ----
run() {
  if (( DRY_RUN == 1 )); then
    echo "[DRY_RUN] $*"
  else
    eval "$@"
  fi
}

need_clean_tree() {
  if [[ -n "$(git status --porcelain=v1)" ]]; then
    echo "BLOCKED: dirty working tree"
    git status --porcelain=v1
    exit 1
  fi
}

need_gh() {
  command -v gh >/dev/null 2>&1 || { echo "ERROR: gh not installed"; exit 1; }
  gh auth status >/dev/null 2>&1 || { echo "ERROR: gh not authenticated (run: gh auth login)"; exit 1; }
}

tag_exists() {
  git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null 2>&1
}

tag_commit() {
  git rev-parse "${TAG}^{}"
}

head_commit() {
  git rev-parse HEAD
}

ensure_tag_points_to_head_or_retagauthorized() {
  if ! tag_exists; then
    echo "BLOCKED: tag ${TAG} missing."
    echo "Policy: create the tag explicitly, or rerun with --retag to create on HEAD."
    if (( RETAG == 0 )); then exit 1; fi
  fi

  if tag_exists; then
    local tc hc
    tc="$(tag_commit)"
    hc="$(head_commit)"
    if [[ "$tc" != "$hc" ]]; then
      echo "WARN: tag ${TAG} does not point to HEAD"
      echo "  tag commit = $tc"
      echo "  HEAD       = $hc"
      if (( RETAG == 0 )); then
        echo "BLOCKED: refusing to move tag without --retag"
        exit 1
      fi
    fi
  fi
}

retag_to_head() {
  local sha
  sha="$(head_commit)"
  echo "=== RETAG ${TAG} -> HEAD ($sha) ==="
  run "git tag -d \"$TAG\" 2>/dev/null || true"
  run "git push \"$REMOTE\" \":refs/tags/${TAG}\" 2>/dev/null || true"
  run "git tag -a \"$TAG\" -m \"Release ${TAG} @ ${sha}\""
  run "git push \"$REMOTE\" \"$TAG\""
}

generate_notes_if_missing() {
  if [[ -f "$NOTES" && $FORCE_NOTES -eq 0 ]]; then
    echo "OK: notes already exist -> $NOTES"
    return 0
  fi

  local sha7
  sha7="$( (tag_exists && echo "$(tag_commit)" || echo "$(head_commit)") | cut -c1-7 )"

  echo "=== GENERATE notes -> $NOTES ==="
  cat > "$NOTES" <<EOF
# ${TAG} — ${SCOPE}

## Scope
- (TODO) Describe scope succinctly (what changed, why it matters)

## Gates (expected GREEN)
- npm test (app)
- audit-subscription-no-ui-coupling
- audit-no-node-builtins-in-app
- audit-no-node-builtins-in-client-surface
- npm run build (app)
- dist/assets: no FileSubscriptionStore* chunks

## Risk / Follow-ups
- (TODO) Provider adapters isolated behind interface; enterprise_free fallback
- (TODO) Observability: structured logs + metrics around entitlements/registry

## Commit
- ${sha7}
EOF
}

normalize_notes_commit_to_tag() {
  if [[ ! -f "$NOTES" ]]; then
    echo "BLOCKED: missing notes file $NOTES"
    exit 1
  fi

  local sha7
  if tag_exists; then
    sha7="$(tag_commit | cut -c1-7)"
  else
    sha7="$(head_commit | cut -c1-7)"
  fi

  # Replace entire "## Commit" section body with exactly "- <sha7>"
  perl -0777 -i -pe "s/##\\s*Commit\\s*\\R.*?(?=\\R##\\s|\\z)/## Commit\\n- ${sha7}\\n/s" "$NOTES"

  echo "OK: normalized notes commit pointer -> $sha7"
}

commit_notes_if_changed() {
  local head_before=""
  local head_after=""
  head_before="$(git rev-parse HEAD)"

  run "git add \"$NOTES\""
  if git diff --cached --quiet; then
    echo "OK: notes unchanged (NO-OP)"
  else
    run "git commit -m \"docs(release): add/refresh release notes for ${TAG} (non-core)\""
    run "git push \"$REMOTE\" \"$(git rev-parse --abbrev-ref HEAD)\""
  fi

  head_after="$(git rev-parse HEAD)"
  if [[ "$head_after" != "$head_before" ]]; then
    echo "INFO: notes commit moved HEAD"
    echo "  before: $head_before"
    echo "  after : $head_after"

    # Industrialisation: auto-retag after notes commit to keep tag == HEAD for gates
    if (( RETAG == 1 )); then
      echo "=== AUTO-RETAG (post-notes commit): ${TAG} -> HEAD (${head_after}) ==="
      retag_to_head
    else
      echo "BLOCKED: HEAD moved due to notes commit, tag alignment would drift."
      echo "Policy: rerun with --retag (to auto-align tag to HEAD) OR create a new tag for this HEAD."
      exit 1
    fi
  fi
}

run_gates() {
  echo "=== GATES: close-the-loop (pre-publish) ==="
  if [[ ! -x "scripts/release/close-the-loop.zsh" ]]; then
    echo "ERROR: missing scripts/release/close-the-loop.zsh"
    exit 1
  fi
  run "TAG=\"$TAG\" ./scripts/release/close-the-loop.zsh"
}

publish_release() {
  need_gh

  echo "=== RELEASE: publish/update on GitHub ==="
  local args=""
  if [[ "$MODE" == "prerelease" ]]; then
    args="--prerelease"
  fi

  if (( DRY_RUN == 1 )); then
    echo "[DRY_RUN] gh release create/edit $TAG (mode=$MODE) notes=$NOTES"
    return 0
  fi

  if gh release view "$TAG" >/dev/null 2>&1; then
    gh release edit "$TAG" --title "$TAG" --notes-file "$NOTES" || exit 1
  else
    gh release create "$TAG" --title "$TAG" --notes-file "$NOTES" $args || exit 1
  fi

  gh release view "$TAG" --json name,tagName,isDraft,isPrerelease,url >/dev/null || true
  echo "OK: release published/updated -> $TAG"
}

verify_final() {
  echo "=== VERIFY: canonical pointers ==="
  local tc hc
  hc="$(head_commit)"
  if tag_exists; then
    tc="$(tag_commit)"
    echo "tag commit : $tc"
  else
    echo "tag commit : (missing)"
  fi
  echo "HEAD commit: $hc"
  echo "notes      : $NOTES"
}

# ---- main ----
echo "=== CONTEXT ==="
echo "TAG=$TAG"
echo "REMOTE=$REMOTE"
echo "MODE=$MODE"
echo "DRY_RUN=$DRY_RUN"
echo "RETAG=$RETAG"
echo "SCOPE=$SCOPE"
echo "PWD=$(pwd)"
echo ""

need_clean_tree

# Tag governance: either must exist & point to HEAD, or explicit --retag
ensure_tag_points_to_head_or_retagauthorized
if (( RETAG == 1 )); then
  retag_to_head
fi

# Notes governance
generate_notes_if_missing
normalize_notes_commit_to_tag
commit_notes_if_changed

# Gates before publishing release
run_gates

# Publish release
publish_release

verify_final

echo ""
echo "OK: ReleaseOps publish completed for $TAG"
