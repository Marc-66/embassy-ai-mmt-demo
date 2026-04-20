#!/bin/bash
# Update the pinned kairos-ontology-toolkit version.
#
# Usage:
#   ./update-toolkit.sh              # auto-detect latest release from GitHub
#   ./update-toolkit.sh 1.3.0        # pin to a specific version
#
# Reads current pinned version from versions.lock, fetches the desired
# release, installs it, and writes the new version back to versions.lock.
# Never uses @main — the result is always a pinned release tag.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}") && pwd)"
LOCK_FILE="$SCRIPT_DIR/versions.lock"
REPO_BASE="https://api.github.com/repos/Cnext-eu/kairos-ontology-toolkit"
REPO_GIT="https://github.com/Cnext-eu/kairos-ontology-toolkit.git"

# ── Read current pinned version ───────────────────────────────────────────────
if [ ! -f "$LOCK_FILE" ]; then
  echo "ERROR: versions.lock not found at $LOCK_FILE" >&2
  exit 1
fi

CURRENT_VERSION=$(grep '^TOOLKIT_VERSION=' "$LOCK_FILE" | cut -d= -f2)
echo "Current pinned version : $CURRENT_VERSION"

# ── Determine target version ──────────────────────────────────────────────────
TARGET_VERSION="${1:-}"
if [ -z "$TARGET_VERSION" ]; then
  echo "Fetching latest version from GitHub..."

  # Use gh CLI token if available (handles private repos)
  AUTH_HEADER=""
  if command -v gh &>/dev/null; then
    GH_TOKEN=$(gh auth token 2>/dev/null || true)
    [ -n "$GH_TOKEN" ] && AUTH_HEADER="-H \"Authorization: Bearer $GH_TOKEN\""
  fi

  # 1) Try releases/latest
  TARGET_VERSION=$(eval curl -sf $AUTH_HEADER "$REPO_BASE/releases/latest" 2>/dev/null \
    | grep '"tag_name"' | sed 's/.*"v\([^"]*\)".*/\1/' || true)

  # 2) Fall back to tags
  if [ -z "$TARGET_VERSION" ]; then
    echo "No releases found — falling back to git tags..."
    TARGET_VERSION=$(eval curl -sf $AUTH_HEADER "$REPO_BASE/tags" 2>/dev/null \
      | grep '"name"' | head -1 | sed 's/.*"v\([^"]*\)".*/\1/' || true)
  fi

  if [ -z "$TARGET_VERSION" ]; then
    echo "ERROR: could not auto-detect the latest version." >&2
    echo "The repo may have no releases or tags yet, or requires authentication." >&2
    echo "Run with an explicit version:  ./update-toolkit.sh <version>" >&2
    exit 1
  fi
  echo "Latest version : $TARGET_VERSION"
else
  # Strip leading 'v' if supplied
  TARGET_VERSION="${TARGET_VERSION#v}"
  echo "Requested version : $TARGET_VERSION"
fi

if [ "$TARGET_VERSION" = "$CURRENT_VERSION" ]; then
  echo "Already at $CURRENT_VERSION — nothing to do."
  exit 0
fi

# ── Install the pinned version ────────────────────────────────────────────────
echo "Installing kairos-ontology-toolkit v$TARGET_VERSION ..."
pip install --upgrade --force-reinstall "git+$REPO_GIT@v$TARGET_VERSION"

# ── Write new version back to versions.lock ───────────────────────────────────
sed -i "s/^TOOLKIT_VERSION=.*/TOOLKIT_VERSION=$TARGET_VERSION/" "$LOCK_FILE"
echo "versions.lock updated → TOOLKIT_VERSION=$TARGET_VERSION"

# ── Verify ────────────────────────────────────────────────────────────────────
INSTALLED=$(pip show kairos-ontology-toolkit 2>/dev/null | grep '^Version:' | awk '{print $2}')
if [ -z "$INSTALLED" ]; then
  echo "ERROR: verification failed — kairos-ontology-toolkit not found after install" >&2
  exit 1
fi
echo "Installed : kairos-ontology-toolkit v$INSTALLED"

echo ""
echo "Toolkit updated $CURRENT_VERSION -> $TARGET_VERSION"
echo "Next: review versions.lock, then commit and open a PR."
