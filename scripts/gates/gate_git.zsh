# shellcheck shell=zsh
# Gate: Git hygiene

need_clean_tree() {
  if [[ -n "$(git status --porcelain=v1)" ]]; then
    echo "BLOCKED: dirty working tree"
    git status --porcelain=v1
    exit 1
  fi
}
