#!/usr/bin/env bash
set -euo pipefail

# Build both Animicro free (WP.org) and Animicro Pro ZIPs from a single source.
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
    echo "==> Running npm run build ..."
    cd "$ROOT"
    npm run build
    echo ""
fi

# ---------------------------------------------------------------------------
# 2. Clean previous builds
# ---------------------------------------------------------------------------
rm -rf "$BUILD"
mkdir -p "$BUILD/animicro" "$BUILD/animicro-pro" "$RELEASE"

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
}

# ---------------------------------------------------------------------------
# 3. Free build (WP.org)
# ---------------------------------------------------------------------------
echo "==> Building FREE (animicro) ..."

copy_shared "$BUILD/animicro"

# Ensure ANIMICRO_PRO is false (should already be, but enforce)
sed -i.bak "s/define( 'ANIMICRO_PRO', true )/define( 'ANIMICRO_PRO', false )/" "$BUILD/animicro/animicro.php"
rm -f "$BUILD/animicro/animicro.php.bak"

# Exclude license manager from free build
rm -f "$BUILD/animicro/includes/class-license-manager.php"

# Copy WP.org readme.txt
if [[ -f "$ROOT/free/readme.txt" ]]; then
    cp "$ROOT/free/readme.txt" "$BUILD/animicro/readme.txt"
fi

echo "   Done: build/animicro/"

# ---------------------------------------------------------------------------
# 4. Pro build
# ---------------------------------------------------------------------------
echo "==> Building PRO (animicro-pro) ..."

copy_shared "$BUILD/animicro-pro"

# Set ANIMICRO_PRO to true and rename plugin for WP dashboard
sed -i.bak \
    -e "s/define( 'ANIMICRO_PRO', false )/define( 'ANIMICRO_PRO', true )/" \
    -e "s/ \* Plugin Name:       Animicro$/ \* Plugin Name:       Animicro Pro/" \
    "$BUILD/animicro-pro/animicro.php"
rm -f "$BUILD/animicro-pro/animicro.php.bak"

# Include license manager
cp "$ROOT/includes/class-license-manager.php" "$BUILD/animicro-pro/includes/"

# Include the GitHub Releases self-updater + vendored plugin-update-checker
# library. Both are stripped from the free build (copy_shared above does not
# copy them, so they only ever land in the Pro tree).
cp "$ROOT/includes/class-updater.php" "$BUILD/animicro-pro/includes/"
mkdir -p "$BUILD/animicro-pro/includes/lib"
cp -R "$ROOT/includes/lib/plugin-update-checker" "$BUILD/animicro-pro/includes/lib/"

# Inject Supabase anon key from environment (or .env.build) into the Pro license manager
if [[ -z "${ANIMICRO_SUPABASE_ANON_KEY:-}" && -f "$ROOT/.env.build" ]]; then
    # shellcheck disable=SC1091
    set -a; . "$ROOT/.env.build"; set +a
fi
if [[ -z "${ANIMICRO_SUPABASE_ANON_KEY:-}" ]]; then
    echo "   ERROR: ANIMICRO_SUPABASE_ANON_KEY is not set (export it or create .env.build)" >&2
    exit 1
fi
sed -i.bak "s|__ANIMICRO_SUPABASE_ANON_KEY__|${ANIMICRO_SUPABASE_ANON_KEY}|" \
    "$BUILD/animicro-pro/includes/class-license-manager.php"
rm -f "$BUILD/animicro-pro/includes/class-license-manager.php.bak"

echo "   Done: build/animicro-pro/"

# ---------------------------------------------------------------------------
# 5. Generate ZIPs
# ---------------------------------------------------------------------------
echo ""
echo "==> Generating ZIPs ..."

cd "$BUILD"

zip -rq "$RELEASE/animicro-${VERSION}.zip" animicro/
echo "   Created: release/animicro-${VERSION}.zip ($(wc -c < "$RELEASE/animicro-${VERSION}.zip") bytes)"

zip -rq "$RELEASE/animicro-pro-${VERSION}.zip" animicro-pro/
echo "   Created: release/animicro-pro-${VERSION}.zip ($(wc -c < "$RELEASE/animicro-pro-${VERSION}.zip") bytes)"

echo ""
echo "==> Build complete!"
