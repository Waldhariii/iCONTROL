# shellcheck shell=zsh
# Gate: GitHub release consistency

verify_release_consistency() {
  # Read-only consistency check (Git ↔ GitHub):
  # - tag exists (or skip in DRY_RUN)
  # - GitHub release tag_name/name match TAG
  # - Release body "## Commit" contains expected SHA7

  if (( DRY_RUN == 1 )); then
    echo "OK: DRY_RUN verify_release_consistency skipped"
    return 0
  fi

  need_gh

  if ! tag_exists; then
    echo "BLOCKED: verify_release_consistency requires existing git tag"
    echo "  expected tag: $TAG"
    exit 1
  fi

  local slug tag_sha7 api_tag api_name api_body release_url commit_line
  slug="$(repo_slug)"
  tag_sha7="$(git rev-parse "${TAG}^{}" | cut -c1-7)"

  if ! gh api "/repos/${slug}/releases/tags/${TAG}" >/dev/null 2>&1; then
    echo "BLOCKED: GitHub release not found for tag"
    echo "  expected tag: $TAG"
    exit 1
  fi

  api_tag="$(gh api -q '.tag_name' "/repos/${slug}/releases/tags/${TAG}")"
  api_name="$(gh api -q '.name' "/repos/${slug}/releases/tags/${TAG}")"
  api_body="$(gh api -q '.body' "/repos/${slug}/releases/tags/${TAG}")"
  release_url="$(gh api -q '.html_url' "/repos/${slug}/releases/tags/${TAG}")"

  if [[ "$api_tag" != "$TAG" ]]; then
    echo "BLOCKED: release.tag_name mismatch"
    echo "  expected: $TAG"
    echo "  found   : $api_tag"
    echo "  url     : $release_url"
    exit 1
  fi
  if [[ "$api_name" != "$TAG" ]]; then
    echo "BLOCKED: release.name mismatch"
    echo "  expected: $TAG"
    echo "  found   : $api_name"
    echo "  url     : $release_url"
    exit 1
  fi
  commit_line="$(
    printf "%s
" "$api_body" | python3 -c '
import re,sys
body=sys.stdin.read()

m=re.search(r"(?is)##\s*Commit\s*(?:\r?\n)+(.*?)(?:\r?\n##\s|\Z)", body)
if not m:
    print("SECTION_MISSING"); raise SystemExit(0)

chunk=m.group(1)

m2=re.search(r"(?i)(?:[-•]\s*)?\s*`?([0-9a-f]{7,40})`?", chunk)
if not m2:
    print("SHA_MISSING"); raise SystemExit(0)

print(m2.group(1)[:7])
'
  )"
  if [[ "$commit_line" == "SECTION_MISSING" ]]; then
    echo "BLOCKED: release body missing '## Commit' section"
    echo "  expected: $tag_sha7"
    echo "  url     : $release_url"
    exit 1
  fi

  if [[ "$commit_line" == "SHA_MISSING" || -z "$commit_line" ]]; then
    echo "BLOCKED: release body missing Commit SHA"
    echo "  expected: $tag_sha7"
    echo "  url     : $release_url"
    exit 1
  fi

  if [[ "$commit_line" != "$tag_sha7" ]]; then
    echo "BLOCKED: release body Commit SHA mismatch"
    echo "  expected: $tag_sha7"
    echo "  found   : $commit_line"
    echo "  url     : $release_url"
    exit 1
  fi

  echo "OK: verify_release_consistency PASS"
  echo "OK: tag commit  : $tag_sha7"
  echo "OK: release     : name/tag_name/body Commit aligned"
}
