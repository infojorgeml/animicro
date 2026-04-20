#!/usr/bin/env bash
# Prepare a WP.org SVN release of the free Animicro build.
# Does NOT run `svn ci` — prints the manual commands at the end.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SVN_DIR="${ANIMICRO_SVN_DIR:-$HOME/Desktop/Wordpress/SVN/animicro-svn}"

VERSION=$(sed -n "s/.*define( 'ANIMICRO_VERSION', '\([^']*\)'.*/\1/p" "$ROOT/animicro.php" | head -1)
VERSION="${VERSION:-0.0.0}"

echo "==> Releasing Animicro v${VERSION} to WP.org SVN"
echo "    SVN checkout: $SVN_DIR"
echo ""

if [[ ! -d "$SVN_DIR" ]]; then
    echo "✗ SVN checkout not found at: $SVN_DIR"
    echo "  Run: svn co https://plugins.svn.wordpress.org/animicro $SVN_DIR"
    exit 1
fi

# 1. Rebuild both ZIPs (ensures free build is current)
bash "$ROOT/scripts/build.sh"

# 2. Sync build/animicro/ -> SVN trunk/
echo ""
echo "==> Syncing build/animicro/ -> $SVN_DIR/trunk/"
rsync -a --delete \
    --exclude '.svn' \
    "$ROOT/build/animicro/" \
    "$SVN_DIR/trunk/"

# 3. svn add any new files (ignore already-added, suppress errors)
cd "$SVN_DIR"
svn add --force trunk > /dev/null 2>&1 || true

# Stat preview
echo ""
echo "==> SVN status (trunk):"
svn status trunk | head -30 || true

echo ""
echo "================================================================"
echo "  READY. Run these commands manually to publish v${VERSION}:"
echo "================================================================"
echo ""
echo "  cd $SVN_DIR"
echo "  svn ci -m 'Release ${VERSION}' --username jorgemml"
echo "  svn cp trunk tags/${VERSION}"
echo "  svn ci -m 'Tag ${VERSION}' --username jorgemml"
echo ""
echo "  (wp.org releases are irreversible — double-check the diff first.)"
echo ""
