#!/usr/bin/env zsh
set -euo pipefail

# Release publication uses a canonical notes render (tmp) to guarantee Commit pointer == tag commit.

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
# --- DRY-RUN NOTES TEMP (industrialisation) ---
# En dry-run, on ne doit PAS salir le working tree: notes générées/normalisées dans un fichier temporaire,
# et on pointe NOTES vers ce tmp pour publish_release (sans commit).
NOTES_REAL="$NOTES"
NOTES_TMP=""
cleanup_notes_tmp() {
  if [[ -n "${NOTES_TMP:-}" && -f "$NOTES_TMP" ]]; then
    rm -f "$NOTES_TMP" || true
  fi
}
# Toujours nettoyer en sortie
trap cleanup_notes_tmp EXIT

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

# ---- gates (sourced) ----

validate_tag_format() {
  if [[ "${TAG:-}" == "vX.Y.Z" ]]; then
    echo "BLOCKED: TAG is a placeholder (vX.Y.Z)."
    echo "  action: choose a real semver tag, ex: v0.2.0 or v0.2.0-hotfix1"
    exit 1
  fi

  if [[ -z "${TAG:-}" ]]; then
    echo "BLOCKED: TAG is required"
    exit 1
  fi

  if [[ ! "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+([-.][A-Za-z0-9]+([-.][A-Za-z0-9]+)*)?$ ]]; then
    echo "BLOCKED: TAG format invalid"
    echo "  got     : $TAG"
    echo "  expected: vMAJOR.MINOR.PATCH[-suffix]"
    echo "  ex      : v0.2.0 | v0.2.0-tools9 | v0.2.0-hotfix1"
    exit 1
  fi

  echo "OK: validate_tag_format PASS"
}


# Centralised gates are sourced to avoid drift and keep scripts readable.
if [[ -f "scripts/_gates/gate_fs.zsh" ]]; then source "scripts/_gates/gate_fs.zsh"; fi
if [[ -f "scripts/_gates/gate_git.zsh" ]]; then source "scripts/_gates/gate_git.zsh"; fi
if [[ -f "scripts/_gates/gate_release.zsh" ]]; then source "scripts/_gates/gate_release.zsh"; fi


run() {
  if (( DRY_RUN == 1 )); then
    echo "OK: DRY_RUN $*"
  else
    eval "$@"
  fi
}


# [gates] preflight_git_writable() moved to scripts/_gates (sourced)
# [gates] need_clean_tree() moved to scripts/_gates (sourced)
need_gh() {
  command -v gh >/dev/null 2>&1 || { echo "ERROR: gh not installed"; exit 1; }
  gh auth status >/dev/null 2>&1 || { echo "ERROR: gh not authenticated (run: gh auth login)"; exit 1; }
}

repo_slug() {
  # Use OWNER/REPO if provided; otherwise infer from git remote.
  if [[ -n "${OWNER:-}" && -n "${REPO:-}" ]]; then
    echo "${OWNER}/${REPO}"
    return 0
  fi
  git remote get-url origin 2>/dev/null | sed -E 's#^git@github.com:##; s#^https://github.com/##; s#\.git$##'
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
    echo "BLOCKED: policy: create the tag explicitly, or rerun with --retag to create on HEAD."
    if (( RETAG == 0 )); then exit 1; fi
  fi

  if tag_exists; then
    local tc hc
    tc="$(tag_commit)"
    hc="$(head_commit)"
    if [[ "$tc" != "$hc" ]]; then
      if (( RETAG == 0 )); then
        echo "BLOCKED: tag ${TAG} does not point to HEAD"
        echo "  expected: $hc"
        echo "  found   : $tc"
        echo "BLOCKED: refusing to move tag without --retag"
        exit 1
      fi
      echo "OK: tag ${TAG} does not point to HEAD (retag authorized)"
      echo "  expected: $hc"
      echo "  found   : $tc"
    fi
  fi
}

retag_to_head() {
  local sha
  sha="$(head_commit)"
  echo "OK: RETAG ${TAG} -> HEAD ($sha)"
  run "git tag -d \"$TAG\" 2>/dev/null || true"
  run "git push \"$REMOTE\" \":refs/tags/${TAG}\" 2>/dev/null || true"
  run "git tag -a \"$TAG\" -m \"Release ${TAG} @ ${sha}\""
  run "git push \"$REMOTE\" \"$TAG\""
}

generate_notes_if_missing() {

  # DRY-RUN POLICY: do not create/modify tracked files
  if (( DRY_RUN == 1 )); then
    NOTES_TMP="$(mktemp -t "icontrol_notes_${TAG}.XXXXXX.md")"
    NOTES="$NOTES_TMP"
    if [[ -f "$NOTES_REAL" ]]; then
      cp -f "$NOTES_REAL" "$NOTES_TMP"
    else
      # Minimal synthèse (best-effort) pour rendre le pipeline observable
      cat > "$NOTES_TMP" <<EOF
# ${TAG} — ${SCOPE}

## Scope
- (DRY-RUN) Notes auto-générées: à finaliser avant publication réelle

## Gates (expected GREEN)
- npm test (app)
- audit-subscription-no-ui-coupling
- audit-no-node-builtins-in-app
- audit-no-node-builtins-in-client-surface
- npm run build (app)
- dist/assets: no FileSubscriptionStore* chunks

## Commit
- $(git rev-parse HEAD | cut -c1-7)
EOF
    fi
    echo "OK: DRY-RUN notes -> $NOTES (no working tree changes)"
    return 0
  fi
  if [[ -f "$NOTES" && $FORCE_NOTES -eq 0 ]]; then
    echo "OK: notes already exist -> $NOTES"
    return 0
  fi

  local sha7
  sha7="$( (tag_exists && echo "$(tag_commit)" || echo "$(head_commit)") | cut -c1-7 )"

  echo "OK: GENERATE notes -> $NOTES"
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
    echo "OK: notes commit moved HEAD"
    echo "  before: $head_before"
    echo "  after : $head_after"

    # Industrialisation: auto-retag after notes commit to keep tag == HEAD for gates
    if (( RETAG == 1 )); then
      echo "OK: AUTO-RETAG (post-notes commit): ${TAG} -> HEAD (${head_after})"
      retag_to_head
    else
      echo "BLOCKED: HEAD moved due to notes commit, tag alignment would drift."
      echo "BLOCKED: policy: rerun with --retag (to auto-align tag to HEAD) OR create a new tag for this HEAD."
      exit 1
    fi
  fi
}

render_notes_for_release() {
  # Always produce a canonical notes file for GitHub Release publishing where:
  #   ## Commit
  #   - <TAG_SHA7>
  #
  # This avoids extra repo commits solely for "Commit pointer hygiene".
  local tag_sha7 tmp

  if tag_exists; then
    tag_sha7="$(tag_commit | cut -c1-7)"
  else
    # Fallback: if tag doesn't exist yet, use HEAD (retag flow will create it)
    tag_sha7="$(head_commit | cut -c1-7)"
  fi

  tmp="$(mktemp -t "icontrol_release_notes_${TAG}.XXXXXX.md")"
  cp -f "$NOTES" "$tmp"

  perl -0777 -i -pe "s/##\\s*Commit\\s*\\R.*?(?=\\R##\\s|\\z)/## Commit\\n- ${tag_sha7}\\n/s" "$tmp"

  echo "$tmp"
}

# [gates] verify_release_consistency() moved to scripts/_gates (sourced)
run_gates() {
  echo "OK: GATES close-the-loop (pre-publish)"
  if [[ ! -x "scripts/release/close-the-loop.zsh" ]]; then
    echo "ERROR: missing scripts/release/close-the-loop.zsh"
    exit 1
  fi
  run "TAG=\"$TAG\" ./scripts/release/close-the-loop.zsh"
}

publish_release() {
  echo "OK: RELEASE publish/update on GitHub"
  local args=""
  if [[ "$MODE" == "prerelease" ]]; then
    args="--prerelease"
  fi

  if (( DRY_RUN == 1 )); then
    echo "OK: DRY_RUN gh release create/edit $TAG (mode=$MODE) notes=$NOTES"
    return 0
  fi

  need_gh

  # Canonical notes render for publishing: ensures Commit pointer == final tag commit
  local notes_for_release
  notes_for_release="$(render_notes_for_release)"

  if gh release view "$TAG" >/dev/null 2>&1; then
    gh release edit "$TAG" --title "$TAG" --notes-file "$notes_for_release" || exit 1
  else
    gh release create "$TAG" --title "$TAG" --notes-file "$notes_for_release" $args || exit 1
  fi

  rm -f "$notes_for_release" 2>/dev/null || true

  gh release view "$TAG" --json name,tagName,isDraft,isPrerelease,url >/dev/null || true
  echo "OK: release published/updated -> $TAG"
  verify_release_consistency
}

assert_dod() {
  if (( DRY_RUN == 1 )); then
    echo "OK: DoD assertions skipped (DRY_RUN=1)"
    return 0
  fi

  if ! tag_exists; then
    echo "BLOCKED: DoD tag missing"
    echo "  expected tag: $TAG"
    exit 1
  fi

  local tc hc
  tc="$(tag_commit)"
  hc="$(head_commit)"
  if [[ "$tc" != "$hc" ]]; then
    echo "BLOCKED: DoD tag != HEAD"
    echo "  expected: $hc"
    echo "  found   : $tc"
    exit 1
  fi

  echo "OK: DoD tag == HEAD"
  verify_release_consistency
}

verify_final() {
  echo "OK: VERIFY canonical pointers"
  local tc hc
  hc="$(head_commit)"
  if tag_exists; then
    tc="$(tag_commit)"
    echo "OK: tag commit  : $tc"
  else
    if (( DRY_RUN == 1 )); then
      echo "OK: tag commit skipped (DRY_RUN=1)"
    else
      echo "ERROR: tag commit missing"
    fi
  fi
  echo "OK: HEAD commit: $hc"
  echo "OK: notes      : $NOTES"
  assert_dod
}

# ---- main ----
echo "OK: CONTEXT"
echo "OK: TAG=$TAG"
echo "OK: REMOTE=$REMOTE"
echo "OK: MODE=$MODE"
echo "OK: DRY_RUN=$DRY_RUN"
echo "OK: RETAG=$RETAG"
echo "OK: SCOPE=$SCOPE"
echo "OK: PWD=$(pwd)"
echo "OK: CONTEXT_END"



validate_tag_format

# 0. Preflight: .git must be writable (macOS ACL/flags safety)
preflight_git_writable

# 1. Vérification du working tree
need_clean_tree

# 2. Vérification / création du tag
ensure_tag_points_to_head_or_retagauthorized
if (( RETAG == 1 )); then
  retag_to_head
fi

# 3. Génération ou normalisation des release notes
generate_notes_if_missing
normalize_notes_commit_to_tag

# 4. Commit des notes (si changement)
commit_notes_if_changed

# 5. Auto-retag si HEAD a bougé (après commit_notes_if_changed)
# 6. Gates techniques
run_gates

# 7. Publication GitHub
publish_release

# 8. Vérification finale de cohérence
verify_final

echo "OK: ReleaseOps publish completed for $TAG"
