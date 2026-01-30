#!/usr/bin/env bash
set -euo pipefail

# ============================================
# Install Git Hooks
# ============================================
# Copies the pre-commit orchestrator to .git/hooks/pre-commit
# Makes it executable and ensures proper setup
# ============================================

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"

ORCHESTRATOR_SOURCE="${REPO_ROOT}/.githooks/pre-commit-orchestrator"
HOOK_TARGET="${REPO_ROOT}/.git/hooks/pre-commit"

if [ ! -f "$ORCHESTRATOR_SOURCE" ]; then
  echo "ERROR: Orchestrator source not found: $ORCHESTRATOR_SOURCE"
  exit 1
fi

if [ ! -d "$(dirname "$HOOK_TARGET")" ]; then
  echo "ERROR: Git hooks directory not found: $(dirname "$HOOK_TARGET")"
  exit 1
fi

# Copy orchestrator to hook location
cp "$ORCHESTRATOR_SOURCE" "$HOOK_TARGET"
chmod +x "$HOOK_TARGET"

# Ensure .githooks/pre-commit is executable
if [ -f "${REPO_ROOT}/.githooks/pre-commit" ]; then
  chmod +x "${REPO_ROOT}/.githooks/pre-commit"
fi

echo "✅ Git hooks installed successfully"
echo "   - Pre-commit orchestrator: $HOOK_TARGET"
echo "   - Gates script: ${REPO_ROOT}/.githooks/pre-commit"
echo ""
echo "The pre-commit hook will:"
echo "  1. Block binaries/archives in staging (exit 12)"
echo "  2. Execute all gates from .githooks/pre-commit"
