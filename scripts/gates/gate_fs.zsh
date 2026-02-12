# shellcheck shell=zsh
# Gate: FS/.git writability preflight

preflight_git_writable() {
  # macOS incident class: ACL/flags or permission drift preventing writes under .git
  # Goal: fail fast with actionable remediation (without trying sudo inside the script)
  local git_dir
  git_dir="$(git rev-parse --git-dir 2>/dev/null || echo ".git")"

  # Quick sanity
  if [[ ! -d "$git_dir" ]]; then
    echo "BLOCKED: git dir not found"
    echo "  git_dir: $git_dir"
    exit 1
  fi

  # Residual locks
  if [[ -e "$git_dir/index.lock" ]]; then
    echo "BLOCKED: git index lock present"
    echo "  lock: $git_dir/index.lock"
    echo "Hint: a previous git process may have crashed; remove lock if safe."
    exit 1
  fi

  # Write probe (covers: ACL denies, flags, perms, full disk access issues)
  local tmp
  tmp="${git_dir}/_write_probe.$$"
  if ! (echo "probe $(date -u +%FT%TZ)" > "$tmp" 2>/dev/null); then
    echo "BLOCKED: cannot write inside git dir ($git_dir)"
    echo "  path: $tmp"
    echo ""
    echo "Forensics (copy/paste):"
    echo "  ls -leOd \"$git_dir\" || true"
    echo "  ls -lOde \"$git_dir\" || true"
    echo "  (find \"$git_dir\" -maxdepth 2 -print0 | xargs -0 ls -lOde 2>/dev/null | head -n 60) || true"
    echo ""
    echo "Remediation (manual, requires sudo):"
    echo "  sudo chflags -R nouchg,noschg \"$git_dir\" || true"
    echo "  sudo chmod -RN \"$git_dir\" || true"
    echo "  sudo chown -R \"$(whoami):staff\" \"$git_dir\""
    echo "  sudo chmod -R u+rwX \"$git_dir\""
    echo "  rm -f \"$git_dir/index.lock\" \"$git_dir/TAG_EDITMSG\" || true"
    exit 1
  fi
  rm -f "$tmp" 2>/dev/null || true

  # Annotated tag probe (read-only safe: creates then deletes a temp tag)
  local t="__perm_probe_tag__"
  git tag -d "$t" >/dev/null 2>&1 || true
  if ! git tag -a "$t" -m "perm probe $(date -u +%FT%TZ)" >/dev/null 2>&1; then
    echo "BLOCKED: cannot create annotated tag (git object write denied)"
    echo "Hint: same remediation as 'cannot write inside git dir'."
    rm -f "$git_dir/TAG_EDITMSG" 2>/dev/null || true
    exit 1
  fi
  git tag -d "$t" >/dev/null 2>&1 || true
  rm -f "$git_dir/TAG_EDITMSG" 2>/dev/null || true

  echo "OK: preflight_git_writable PASS"
}
