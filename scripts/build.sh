#!/usr/bin/env bash
set -euo pipefail

# Build the Animicro ZIP (the same package that goes to WordPress.org).
# Usage: bash scripts/build.sh

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD="$ROOT/build"
RELEASE="$ROOT/release"

# Extract version from animicro.php (macOS-compatible)
VERSION=$(sed -n "s/.*define( 'ANIMICRO_VERSION', '\([^']*\)'.*/\1/p" "$ROOT/animicro.php" | head -1)
VERSION="${VERSION:-0.0.0}"

echo "==> Animicro v${VERSION}"
echo ""

# ---------------------------------------------------------------------------
# 1. Frontend build (Vite)
# ---------------------------------------------------------------------------
if [[ ! -f "$ROOT/admin/dist/.vite/manifest.json" ]] || [[ ! -f "$ROOT/frontend/dist/.vite/manifest.json" ]]; then
    echo "==> Running pnpm run build ..."
    cd "$ROOT"
    pnpm run build
    echo ""
fi

# ---------------------------------------------------------------------------
# 2. Clean previous builds
# ---------------------------------------------------------------------------
rm -rf "$BUILD"
mkdir -p "$BUILD/animicro" "$RELEASE"

# ---------------------------------------------------------------------------
# Helper: copy shared assets into a target directory
# ---------------------------------------------------------------------------
copy_shared() {
    local TARGET="$1"

    cp "$ROOT/animicro.php" "$TARGET/animicro.php"

    mkdir -p "$TARGET/includes"
    cp "$ROOT/includes/class-animicro.php"      "$TARGET/includes/"
    cp "$ROOT/includes/class-admin.php"          "$TARGET/includes/"
    cp "$ROOT/includes/class-frontend.php"       "$TARGET/includes/"
    cp "$ROOT/includes/class-compatibility.php"  "$TARGET/includes/"

    mkdir -p "$TARGET/admin" "$TARGET/frontend"
    cp -r "$ROOT/admin/dist"    "$TARGET/admin/"
    cp -r "$ROOT/frontend/dist" "$TARGET/frontend/"

    mkdir -p "$TARGET/languages"
    if [[ -f "$ROOT/languages/index.php" ]]; then
        cp "$ROOT/languages/index.php" "$TARGET/languages/"
    fi

    cp "$ROOT/uninstall.php" "$TARGET/"

    if [[ -f "$ROOT/README.md" ]]; then
        cp "$ROOT/README.md" "$TARGET/"
    fi

    # Plugin icons / banners (WP.org serves them from SVN, but bundling them
    # locally is harmless and keeps the "View details" lightbox complete).
    if [[ -d "$ROOT/assets" ]]; then
        cp -r "$ROOT/assets" "$TARGET/assets"
    fi

    # macOS Finder metadata: WP.org's Plugin Check rejects hidden files.
    find "$TARGET" -name ".DS_Store" -delete
}

# ---------------------------------------------------------------------------
# 3. Plugin package
# ---------------------------------------------------------------------------
echo "==> Building animicro ..."

copy_shared "$BUILD/animicro"

# WP.org readme.txt
if [[ -f "$ROOT/free/readme.txt" ]]; then
    cp "$ROOT/free/readme.txt" "$BUILD/animicro/readme.txt"
fi

echo "   Done: build/animicro/"

# ---------------------------------------------------------------------------
# 4. Generate ZIP
# ---------------------------------------------------------------------------
echo ""
echo "==> Generating ZIP ..."

cd "$BUILD"

# Start from scratch: `zip -r` into an existing archive only adds/updates
# entries, so files removed from the plugin would linger in the ZIP.
rm -f "$RELEASE/animicro-${VERSION}.zip"
zip -rq "$RELEASE/animicro-${VERSION}.zip" animicro/
echo "   Created: release/animicro-${VERSION}.zip ($(wc -c < "$RELEASE/animicro-${VERSION}.zip") bytes)"

echo ""
echo "==> Build complete!"
