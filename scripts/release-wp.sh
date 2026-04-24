#!/usr/bin/env bash
# Publish the current Animicro free build to the WordPress.org SVN repository.
#
# Full flow (fully automated, with one confirmation prompt before committing):
#   1. Rebuild both ZIPs so SVN trunk mirrors the latest code.
#   2. Refresh SVN working copy (revert tags/ noise, update).
#   3. Rsync build/animicro/ -> trunk/ (with --delete).
#   4. svn add new files, svn rm deleted files, all scoped to trunk/.
#   5. Show a short summary and ask for confirmation.
#   6. svn ci trunk (commit).
#   7. Server-side svn cp trunk -> tags/VERSION (commit).
#
# Flags:
#   -y / --yes     Skip confirmation (for CI-style unattended runs).
#
# Env:
#   ANIMICRO_SVN_DIR   SVN checkout path (default: ~/Desktop/Wordpress/SVN/animicro-svn)
#   SVN_USERNAME       SVN username (default: jorgemml)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SVN_DIR="${ANIMICRO_SVN_DIR:-$HOME/Desktop/Wordpress/SVN/animicro-svn}"
SVN_USER="${SVN_USERNAME:-jorgemml}"
SVN_REPO="https://plugins.svn.wordpress.org/animicro"

AUTO_YES=0
for arg in "$@"; do
    case "$arg" in
        -y|--yes) AUTO_YES=1 ;;
        *) ;;
    esac
done

VERSION=$(sed -n "s/.*define( 'ANIMICRO_VERSION', '\([^']*\)'.*/\1/p" "$ROOT/animicro.php" | head -1)
VERSION="${VERSION:-0.0.0}"

echo "==> Releasing Animicro v${VERSION} to WP.org SVN"
echo "    SVN checkout: $SVN_DIR"
echo "    SVN user:     $SVN_USER"
echo ""

if [[ ! -d "$SVN_DIR/.svn" ]]; then
    echo "✗ SVN checkout not found at: $SVN_DIR"
    echo "  Run: svn co $SVN_REPO $SVN_DIR"
    exit 1
fi

# ---------------------------------------------------------------------------
# 0. Abort early if the tag already exists upstream
# ---------------------------------------------------------------------------
if svn info "$SVN_REPO/tags/$VERSION" >/dev/null 2>&1; then
    echo "✗ Tag $VERSION already exists on WP.org SVN."
    echo "  Bump ANIMICRO_VERSION in animicro.php before re-running."
    exit 1
fi

# ---------------------------------------------------------------------------
# 1. Rebuild ZIPs (ensures build/animicro/ is current)
# ---------------------------------------------------------------------------
bash "$ROOT/scripts/build.sh"

# ---------------------------------------------------------------------------
# 2. Refresh SVN working copy — drop any lingering pending state in tags/
#    (previous interrupted releases can leave A+ / ! entries there) and pull
#    the latest from the server.
# ---------------------------------------------------------------------------
echo ""
echo "==> Refreshing SVN working copy..."
cd "$SVN_DIR"
if [[ -d "$SVN_DIR/tags" ]]; then
    svn revert -R tags >/dev/null 2>&1 || true
fi
svn update --quiet

# ---------------------------------------------------------------------------
# 3. Sync build/animicro/ -> SVN trunk/
# ---------------------------------------------------------------------------
echo ""
echo "==> Syncing build/animicro/ -> trunk/"
rsync -a --delete \
    --exclude '.svn' \
    "$ROOT/build/animicro/" \
    "$SVN_DIR/trunk/"

# ---------------------------------------------------------------------------
# 4. Reconcile SVN tracking inside trunk/: add new files, remove deleted ones
# ---------------------------------------------------------------------------
svn add --force trunk >/dev/null 2>&1 || true

# Remove files SVN still tracks but rsync deleted
MISSING=$(svn status trunk | awk '/^!/ {print $2}' || true)
if [[ -n "$MISSING" ]]; then
    echo "$MISSING" | xargs svn rm >/dev/null 2>&1 || true
fi

# ---------------------------------------------------------------------------
# 5. Summary + confirmation
# ---------------------------------------------------------------------------
echo ""
echo "==> Pending changes in trunk/:"
svn status trunk | awk '{print $1}' | sort | uniq -c | awk '{printf "    %-4s %s\n", $1, $2}'

if (( AUTO_YES != 1 )); then
    echo ""
    read -r -p "Commit trunk and create tag $VERSION? [y/N] " REPLY
    if [[ ! "$REPLY" =~ ^[Yy]$ ]]; then
        echo "Aborted. Working copy left as-is for inspection."
        exit 0
    fi
fi

# ---------------------------------------------------------------------------
# 6. Commit trunk (scoped — never touches tags/)
# ---------------------------------------------------------------------------
echo ""
echo "==> Committing trunk..."
svn ci trunk -m "Release $VERSION" --username "$SVN_USER"

# ---------------------------------------------------------------------------
# 7. Server-side tag (no local working copy involvement)
# ---------------------------------------------------------------------------
echo ""
echo "==> Tagging $VERSION (server-side copy)..."
svn cp "$SVN_REPO/trunk" "$SVN_REPO/tags/$VERSION" \
    -m "Tag $VERSION" --username "$SVN_USER"

echo ""
echo "================================================================"
echo "  ✓ Published Animicro $VERSION to WP.org SVN."
echo "    Users will see the update within ~15 minutes."
echo "================================================================"
