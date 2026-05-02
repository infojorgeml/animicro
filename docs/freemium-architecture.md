# Freemium WordPress plugin architecture — reference guide

This document describes a **single-source freemium architecture** for WordPress plugins: one git repository produces two ZIPs (free + pro) that ship to two different distribution channels (WordPress.org SVN + GitHub Releases) with two different update mechanisms — and yet share 95% of their code through a build-time stripping pipeline.

It's plugin-agnostic. The patterns work for any plugin that wants a free tier on the WordPress.org directory plus a paid tier with extra modules, premium-only options, and licensing. The reference implementation lives in this repo.

---

## 1. Philosophy

The "free + pro" question gets solved one of three ways in the WordPress ecosystem:

| Approach | Pros | Cons |
|----------|------|------|
| **Two separate repos** | Clean separation, no risk of leaking Pro code | Pro features that touch shared code require maintaining two diffs forever |
| **Pro is a separate plugin** that extends Free | Two installable artifacts, free can ship to WP.org | Activation order matters, code split via "addon" hooks adds runtime cost and complexity |
| **Single source, two builds** ← *this approach* | One source of truth, refactors apply everywhere, the runtime cost of the freemium check is one constant comparison | Build pipeline is a real piece of infrastructure that needs maintenance |

The single-source approach wins when:
- Pro is a **superset** of Free, not a fundamentally different product.
- Your changes routinely touch both tiers.
- You can absorb the build-pipeline complexity in exchange for monorepo-level developer ergonomics.

The trade-off is that you can never just `git push` and have users see changes — every release goes through `bash scripts/build.sh` (locally or in CI), which produces the two ZIPs from the same `main` branch.

---

## 2. Repository layout

```
myplugin/
├── myplugin.php                         # main plugin file — the file WP loads
├── uninstall.php                        # cleans options on plugin delete
├── readme.txt                           # ← does NOT exist at the top — see below
├── README.md                            # GitHub-facing readme
├── CHANGELOG.md
├── package.json                         # if you have a JS/React admin
│
├── includes/                            # PHP classes
│   ├── class-myplugin.php               # orchestrator
│   ├── class-admin.php                  # admin menu, REST routes, asset enqueue
│   ├── class-frontend.php               # frontend asset enqueue
│   ├── class-license-manager.php        # 🔒 PRO ONLY — stripped from free build
│   ├── class-updater.php                # 🔒 PRO ONLY — GitHub Releases self-updater
│   └── lib/
│       └── plugin-update-checker/       # 🔒 PRO ONLY — vendored library (~30 files)
│
├── admin/src/                           # React/TS source (if applicable)
├── frontend/src/                        # frontend JS source
│
├── free/
│   └── readme.txt                       # ← the WP.org-format readme
│                                          # copied to ZIP root as "readme.txt"
│                                          # for the free build only
│
├── docs/
│   ├── freemium-architecture.md         # this document
│   ├── licensing.md                     # licensing-specific details
│   └── plugin.md                        # implementation reference
│
├── scripts/
│   ├── build.sh                         # main build script — produces both ZIPs
│   ├── build_release_zip.py             # alternative free-only ZIP builder
│   └── release-wp.sh                    # WP.org SVN publish flow
│
├── .githooks/
│   └── pre-push                         # rebuilds ZIPs on every push
│
└── .github/
    └── workflows/
        └── release-pro.yml              # builds + publishes Pro Release on `v*` tags
```

The 🔒 PRO ONLY files are present in the source tree (so devs can edit them), but the build script strips them from the free ZIP. The same files end up in the Pro ZIP unmodified.

> **Why two readmes (`README.md` and `free/readme.txt`)?** WordPress.org requires a specific format (`readme.txt` with `=== Plugin Name ===`, `Stable tag:`, `Tested up to:`, etc.) that is incompatible with GitHub-flavoured Markdown. We keep `README.md` for GitHub and a parallel `free/readme.txt` for WP.org. Only the latter ships to WP.org. The Pro ZIP has no `readme.txt` — Pro doesn't go through wordpress.org's review system.

---

## 3. The two output artifacts

After running the build, you get:

```
release/
├── myplugin-X.Y.Z.zip          # FREE — for wordpress.org SVN
└── myplugin-pro-X.Y.Z.zip      # PRO — for GitHub Releases
```

Both are valid WordPress plugin ZIPs (they extract to a folder containing the main `myplugin.php` file). The differences:

| Aspect | Free ZIP | Pro ZIP |
|--------|----------|---------|
| Folder name (when extracted) | `myplugin/` | `myplugin-pro/` |
| `Plugin Name:` header | `My Plugin` | `My Plugin Pro` |
| `MYPLUGIN_PRO` constant | `false` | `true` |
| `class-license-manager.php` | absent | present, with hardcoded API key |
| `class-updater.php` | absent | present |
| `lib/plugin-update-checker/` | absent | present |
| `readme.txt` | present (WP.org format) | absent |
| Premium gating in admin UI | "Upgrade to Pro" links | unlocked panels |
| Update mechanism | `wp-admin/update-core.php` (via wordpress.org) | self-update via plugin-update-checker (GitHub Releases) |

A user with the free ZIP installed who later upgrades **must replace the entire plugin folder**: the folder names are different (`myplugin/` vs `myplugin-pro/`), so WordPress treats them as separate plugins. The Pro plugin's activation hook auto-deactivates the Free version (see §4.4).

---

## 4. The "is this Pro?" pattern

Everything hinges on a single boolean constant defined in the main plugin file:

```php
// myplugin.php
if ( ! defined( 'MYPLUGIN_PRO' ) ) {
    define( 'MYPLUGIN_PRO', false );   // ← default for the dev tree + free build
}
```

The build script flips this to `true` only when generating the Pro ZIP:

```bash
# scripts/build.sh — Pro build branch
sed -i.bak \
    -e "s/define( 'MYPLUGIN_PRO', false )/define( 'MYPLUGIN_PRO', true )/" \
    "$BUILD/myplugin-pro/myplugin.php"
```

Every Pro-gated path in the plugin is a one-liner check against this constant. There are four common patterns:

### 4.1 Conditional `require_once`

```php
// includes/class-myplugin.php — orchestrator
private function load_dependencies(): void {
    if ( self::is_pro_plugin() ) {
        require_once MYPLUGIN_DIR . 'includes/class-license-manager.php';
        require_once MYPLUGIN_DIR . 'includes/class-updater.php';
    }
    require_once MYPLUGIN_DIR . 'includes/class-admin.php';
    require_once MYPLUGIN_DIR . 'includes/class-frontend.php';
}

public static function is_pro_plugin(): bool {
    return defined( 'MYPLUGIN_PRO' ) && true === MYPLUGIN_PRO;
}
```

The free build doesn't even attempt to load files that aren't there. The Pro build loads them all.

### 4.2 Conditional hook registration

```php
private function register_hooks(): void {
    if ( self::is_pro_plugin() ) {
        add_action( 'admin_init', [ 'Myplugin_License_Manager', 'validate_license_periodically' ] );
    }
    new Myplugin_Admin();
    new Myplugin_Frontend();
}
```

### 4.3 Conditional initialisation in the main file

```php
// myplugin.php — only the Pro build wires up the self-updater
if ( MYPLUGIN_PRO && is_readable( MYPLUGIN_DIR . 'includes/class-updater.php' ) ) {
    require_once MYPLUGIN_DIR . 'includes/class-updater.php';
    Myplugin_Updater::init( __FILE__ );
}
```

### 4.4 Auto-deactivate the other tier

When the Pro plugin activates, silently deactivate the Free version if it's running. Avoids both running side-by-side with conflicting hooks:

```php
// In Myplugin::activate(), called from register_activation_hook
public static function activate(): void {
    if ( self::is_pro_plugin() ) {
        $free_basename = 'myplugin/myplugin.php';
        if ( function_exists( 'is_plugin_active' ) && is_plugin_active( $free_basename ) ) {
            deactivate_plugins( $free_basename, true );
            set_transient( 'myplugin_pro_deactivated_free', true, 30 );
        }
    }
    // ... rest of activation
}
```

The transient is consumed by an admin notice that explains "Free was deactivated automatically; Pro is now active" — friendly UX rather than a surprise.

### 4.5 Premium feature gating at runtime

For per-feature gating (Pro modules, Pro options, Pro admin tabs), use the licence layer's `is_premium()` check rather than the build-time constant. The constant says "is this the Pro build?", `is_premium()` says "is this Pro user actively licensed right now?".

```php
if ( Myplugin_License_Manager::is_premium() ) {
    // load Pro modules, render Pro admin tab, etc.
}
```

In the free build, `Myplugin_License_Manager` doesn't exist (file stripped), so any premium-gated code must also check `class_exists()` or be wrapped in a `MYPLUGIN_PRO` block:

```php
$is_premium = MYPLUGIN_PRO
    && class_exists( 'Myplugin_License_Manager' )
    && Myplugin_License_Manager::is_premium();
```

---

## 5. The build script

`scripts/build.sh` is the heart of the freemium pipeline. Anatomy:

```bash
#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD="$ROOT/build"
RELEASE="$ROOT/release"

# 1. Extract version from the main plugin file
VERSION=$(sed -n "s/.*define( 'MYPLUGIN_VERSION', '\([^']*\)'.*/\1/p" "$ROOT/myplugin.php" | head -1)

# 2. Run frontend build if needed (Vite, webpack, whatever)
if [[ ! -f "$ROOT/admin/dist/.vite/manifest.json" ]]; then
    cd "$ROOT" && npm run build
fi

# 3. Wipe and re-create build/ and release/
rm -rf "$BUILD"
mkdir -p "$BUILD/myplugin" "$BUILD/myplugin-pro" "$RELEASE"

# 4. Define a copy_shared() helper that copies the files BOTH builds need
copy_shared() {
    local TARGET="$1"
    cp "$ROOT/myplugin.php" "$TARGET/myplugin.php"
    mkdir -p "$TARGET/includes"
    cp "$ROOT/includes/class-myplugin.php"     "$TARGET/includes/"
    cp "$ROOT/includes/class-admin.php"        "$TARGET/includes/"
    cp "$ROOT/includes/class-frontend.php"     "$TARGET/includes/"
    # ... and so on. NOTE: class-license-manager.php is NOT in this list.
    cp -r "$ROOT/admin/dist"    "$TARGET/admin/"
    cp -r "$ROOT/frontend/dist" "$TARGET/frontend/"
    cp "$ROOT/uninstall.php" "$TARGET/"
}

# 5. Build the FREE artifact
copy_shared "$BUILD/myplugin"
sed -i.bak "s/define( 'MYPLUGIN_PRO', true )/define( 'MYPLUGIN_PRO', false )/" \
    "$BUILD/myplugin/myplugin.php"
rm -f "$BUILD/myplugin/myplugin.php.bak"
# Free ZIP gets the WP.org-formatted readme
cp "$ROOT/free/readme.txt" "$BUILD/myplugin/readme.txt"

# 6. Build the PRO artifact
copy_shared "$BUILD/myplugin-pro"
# Flip the constant + rename the plugin in WP dashboard
sed -i.bak \
    -e "s/define( 'MYPLUGIN_PRO', false )/define( 'MYPLUGIN_PRO', true )/" \
    -e "s/ \* Plugin Name:       My Plugin$/ \* Plugin Name:       My Plugin Pro/" \
    "$BUILD/myplugin-pro/myplugin.php"
# Drop in the Pro-only files
cp "$ROOT/includes/class-license-manager.php" "$BUILD/myplugin-pro/includes/"
cp "$ROOT/includes/class-updater.php"         "$BUILD/myplugin-pro/includes/"
mkdir -p "$BUILD/myplugin-pro/includes/lib"
cp -R "$ROOT/includes/lib/plugin-update-checker" "$BUILD/myplugin-pro/includes/lib/"

# 7. Zip both artifacts
cd "$BUILD"
zip -rq "$RELEASE/myplugin-${VERSION}.zip"     myplugin/
zip -rq "$RELEASE/myplugin-pro-${VERSION}.zip" myplugin-pro/
```

### Key principles

1. **`copy_shared()` is the explicit list of "stuff both tiers need".** Pro-only files are NOT in this function — they're only added to the Pro target after `copy_shared` runs. This means anything you forget to add to `copy_shared` gets silently dropped from the free build, which is a feature: it forces you to be deliberate about what's free.

2. **The constant flip is a `sed` against the main plugin file.** It runs after the copy so the source tree is never mutated. Using `sed -i.bak` (with backup) followed by `rm -f *.bak` is the macOS-portable idiom — bare `sed -i` differs between BSD and GNU.

3. **`set -euo pipefail` at the top** is non-negotiable. A silent failure in the Pro branch (e.g. forgetting to copy the licence manager) ships a broken Pro ZIP. Fail loud.

4. **Version is read from `MYPLUGIN_VERSION` constant**, not hardcoded in the script. Bumping the version in one place (`myplugin.php`) cascades everywhere automatically.

5. **The `build/` directory is throwaway.** Wiped at the start of every run. Never commit it.

There's also a Python-based variant `scripts/build_release_zip.py` in this repo that builds **only the free ZIP** by walking the source tree directly (no `cp` step, no intermediate `build/` folder). It's useful when you only need the WP.org artifact and want to avoid the build script's `npm run build` requirement. Both scripts read `MYPLUGIN_VERSION` from the same place, so they always agree.

---

## 6. Distribution channels

The two artifacts ship to two completely independent channels.

### 6.1 Free → WordPress.org SVN

WordPress.org distributes plugins via SVN, not git. The publish flow is:

1. SVN checkout of `https://plugins.svn.wordpress.org/myplugin` lives at `~/Desktop/Wordpress/SVN/myplugin-svn` (or wherever you choose, configurable via env var).
2. `scripts/release-wp.sh` rsyncs `build/myplugin/` → `trunk/`, runs `svn add` for new files, `svn rm` for deleted ones, and commits.
3. Then `svn cp trunk tags/X.Y.Z` (server-side copy) creates the version tag.
4. WordPress.org's review system picks up the new tag from the `Stable tag:` header in `readme.txt` and serves it to users via the standard WP update flow.

The script does this automatically with one confirmation prompt before commit. Sketch:

```bash
#!/usr/bin/env bash
set -euo pipefail

VERSION=$(extract_from_php_constant)
SVN_DIR="${MYPLUGIN_SVN_DIR:-$HOME/Desktop/Wordpress/SVN/myplugin-svn}"

# Abort if the tag already exists upstream
if svn info "$SVN_REPO/tags/$VERSION" >/dev/null 2>&1; then
    echo "Tag $VERSION already exists on WP.org SVN. Bump the version first."
    exit 1
fi

# Rebuild ZIPs to ensure trunk reflects current code
bash scripts/build.sh

# Refresh local working copy
svn revert -R "$SVN_DIR/tags"
svn update "$SVN_DIR"

# Sync build/myplugin/ → trunk/
rsync -a --delete "$ROOT/build/myplugin/" "$SVN_DIR/trunk/"

# Add/remove files svn-aware
svn add --force "$SVN_DIR/trunk"
svn status "$SVN_DIR/trunk" | grep '^!' | awk '{print $2}' | xargs -r svn rm

# Show summary, ask confirmation, commit, then tag
echo "Pending: $(svn status "$SVN_DIR/trunk" | wc -l) files"
read -p "Commit trunk and create tag $VERSION? [y/N] " REPLY
[[ "$REPLY" =~ ^[Yy]$ ]] || exit 0

svn ci -m "Release $VERSION" "$SVN_DIR/trunk"
svn cp -m "Tag $VERSION" "$SVN_REPO/trunk" "$SVN_REPO/tags/$VERSION"
```

The script accepts `-y` / `--yes` for unattended runs.

**Critical**: WordPress.org's `Plugin Check` runs against your trunk on every release. If you accidentally include licensing/Pro code in the free ZIP, Plugin Check will reject the release. The build script's `copy_shared()` strategy (allow-list of free files, deny-by-default) prevents this almost by accident.

### 6.2 Pro → GitHub Releases

Pro distribution doesn't go through wordpress.org — there's no "premium plugins" directory there. Instead, you publish a GitHub Release with the Pro ZIP attached as a release asset:

1. Push a `v*` tag (e.g. `v1.2.3`) to your GitHub repo.
2. A GitHub Action (`.github/workflows/release-pro.yml`) triggers on the tag push.
3. It runs `npm ci`, `npm run build`, `bash scripts/build.sh`.
4. It extracts the matching `## [1.2.3]` section from `CHANGELOG.md` as release notes.
5. It uses [softprops/action-gh-release](https://github.com/softprops/action-gh-release) to create a Release named `My Plugin v1.2.3` with both ZIPs attached as assets.
6. Users install the Pro ZIP via `wp-admin → Plugins → Add New → Upload Plugin`.
7. From there, the Pro plugin's self-updater (§7) handles future updates automatically.

A minimal workflow file:

```yaml
name: Release Pro

on:
  push:
    tags: ['v*']

permissions:
  contents: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run build
      - run: bash scripts/build.sh

      - name: Verify ZIPs exist
        run: |
          test -f release/myplugin-${GITHUB_REF_NAME#v}.zip
          test -f release/myplugin-pro-${GITHUB_REF_NAME#v}.zip

      - name: Extract changelog section
        run: |
          VERSION="${GITHUB_REF_NAME#v}"
          awk -v ver="$VERSION" '
            $0 ~ "^## \\[" ver "\\]" { p=1; next }
            p && /^## \[/ { exit }
            p { print }
          ' CHANGELOG.md > release_notes.md
          [ -s release_notes.md ] || echo "Release v$VERSION" > release_notes.md

      - uses: softprops/action-gh-release@v2
        with:
          name: My Plugin ${{ github.ref_name }}
          body_path: release_notes.md
          files: |
            release/myplugin-*.zip
            release/myplugin-pro-*.zip
          draft: false
          prerelease: false
```

**Public vs private repo for Pro?** The repo can be public (anyone can download the Pro ZIP, but `is_premium()` still gates features at runtime — see `licensing.md`) or private (the ZIP is only accessible via authenticated download with a Personal Access Token). Public is simpler and matches the "stealing the ZIP gets you a locked plugin" model. Private adds friction for legitimate users (the auto-updater needs a token baked into the plugin) without meaningfully blocking pirates.

> **Common GH Action flake**: `softprops/action-gh-release@v2` occasionally fails on the very first attempt with no clear error in the logs. We've seen this once across ~10 releases. Re-pushing the same tag (delete the remote tag, re-push pointing at the same commit) re-triggers the Action and resolves it. Don't panic; don't bump the version.

---

## 7. The Pro auto-updater

WordPress core only checks wordpress.org for updates by default. Pro plugins (which aren't on wordpress.org) need their own update mechanism. The standard solution is [YahnisElsts/plugin-update-checker](https://github.com/YahnisElsts/plugin-update-checker) (PUC), an MIT-licensed library that injects update info into WP's standard update mechanisms.

Vendor PUC under `includes/lib/plugin-update-checker/` (it's ~30 files, ~700 KB uncompressed, ~175 KB in the Pro ZIP). The build script copies the whole folder to the Pro build only.

A thin wrapper class invokes PUC pointing at your GitHub Releases:

```php
// includes/class-updater.php
class Myplugin_Updater {

    const REPO_URL    = 'https://github.com/youruser/myplugin/';
    const BRANCH      = 'main';
    const ASSET_REGEX = '/^myplugin-pro-\d+\.\d+\.\d+\.zip$/';
    const PLUGIN_SLUG = 'myplugin-pro';

    public static function init( string $plugin_main_file ): void {
        $loader = MYPLUGIN_DIR . 'includes/lib/plugin-update-checker/plugin-update-checker.php';
        if ( ! is_readable( $loader ) ) return;
        require_once $loader;

        if ( ! class_exists( '\YahnisElsts\PluginUpdateChecker\v5\PucFactory' ) ) return;

        $updater = \YahnisElsts\PluginUpdateChecker\v5\PucFactory::buildUpdateChecker(
            self::REPO_URL,
            $plugin_main_file,
            self::PLUGIN_SLUG
        );

        $updater->setBranch( self::BRANCH );

        // Tell PUC to download the matching Release asset (the Pro ZIP)
        // instead of GitHub's auto-generated source tarball.
        $api = $updater->getVcsApi();
        if ( method_exists( $api, 'enableReleaseAssets' ) ) {
            $api->enableReleaseAssets( self::ASSET_REGEX );
        }
    }
}
```

The `ASSET_REGEX` is critical: each GitHub Release has both `myplugin-X.Y.Z.zip` and `myplugin-pro-X.Y.Z.zip` attached, and PUC needs to know it should download the Pro one. Anchoring on `myplugin-pro-` is the cleanest disambiguation.

Wired up in the main plugin file, behind the constant:

```php
// myplugin.php
if ( MYPLUGIN_PRO && is_readable( MYPLUGIN_DIR . 'includes/class-updater.php' ) ) {
    require_once MYPLUGIN_DIR . 'includes/class-updater.php';
    Myplugin_Updater::init( __FILE__ );
}
```

After this is in place, every Pro install polls the GitHub API once per 12 hours (PUC default) and surfaces "Update available" in `wp-admin/plugins.php` whenever a newer GitHub Release exists.

> **First-version chicken-and-egg**: the version of the plugin you publish that *introduces* the updater is the one that has to be installed manually. From the next release onward, all installed Pro sites auto-update.

---

## 8. Versioning convention

The version number lives in **5 places** that all must stay in sync. This is the most common source of bugs in the freemium pipeline; bump them all every release.

| File | Field | Why it's there |
|------|-------|---------------|
| `myplugin.php` | `Version: X.Y.Z` (header) | WordPress reads this to display the version in the plugins list |
| `myplugin.php` | `define( 'MYPLUGIN_VERSION', 'X.Y.Z' )` | Used internally for cache-busting asset URLs, etc. |
| `package.json` | `"version": "X.Y.Z"` | Convention for any JS tooling that introspects it |
| `README.md` | `**Stable tag:** X.Y.Z` | GitHub-facing |
| `free/readme.txt` | `Stable tag: X.Y.Z` + `= X.Y.Z =` Changelog block + Upgrade Notice | WordPress.org reads `Stable tag` to know which tag to serve to users |

Plus the git tag `vX.Y.Z` that triggers the release workflow.

A bash one-liner for the bumps (or a small npm script wrapper):

```bash
v=1.2.3
sed -i.bak \
  -e "s/Version: .*/Version:           $v/" \
  -e "s/define( 'MYPLUGIN_VERSION', '[^']*' )/define( 'MYPLUGIN_VERSION', '$v' )/" \
  myplugin.php
sed -i.bak "s/\"version\": \"[^\"]*\"/\"version\": \"$v\"/" package.json
sed -i.bak "s/\*\*Stable tag:\*\* .*/**Stable tag:** $v/" README.md
sed -i.bak "s/^Stable tag: .*/Stable tag: $v/" free/readme.txt
rm -f *.bak free/*.bak
```

Then prepend a `## [X.Y.Z] - YYYY-MM-DD` block to `CHANGELOG.md` and matching `= X.Y.Z =` blocks to `free/readme.txt` Changelog and Upgrade Notice sections.

---

## 9. CHANGELOG conventions

`CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
# Changelog

## [1.2.3] - 2026-05-02

### Added
- New module: ...

### Changed
- Behaviour of ...

### Fixed
- Bug where ...

### Removed
- Deprecated ...

## [1.2.2] - 2026-04-29

### Fixed
...
```

Two reasons to keep it strict:

1. **The GitHub Action extracts the section between `## [VERSION]` and the next `## [` to use as Release notes.** A loose format breaks the awk extraction silently (the Release publishes with empty notes).
2. **`free/readme.txt` has its own per-version Changelog and Upgrade Notice** in WP.org format. Keeping both files in sync is annoying but unavoidable — wordpress.org displays the `readme.txt` version, github.com displays the `CHANGELOG.md` version. Different templates, same content.

Conventions that pay off:

- **Tag every entry with `Pro —` or `Free —` prefix** so users skimming the changelog know which tier the change applies to.
- **Be honest about removed/breaking changes**, especially when the removal is intentional cleanup (dead code, deprecated paths). It's fine to ship a `### Removed` block — that's what semver is for.
- **Use Markdown code-fences for paths and identifiers** (`includes/class-x.php`, `Myplugin::method()`). The GitHub Release page renders them as code; the WP.org changelog renders them as plain text. Both work.

---

## 10. Automation

Three layers of automation reduce the human steps in a release:

### 10.1 Pre-push hook

`.githooks/pre-push` rebuilds both ZIPs before every `git push`. Configured once with `git config core.hooksPath .githooks` (do this in `npm postinstall` so cloning the repo + `npm install` sets it up automatically).

```bash
#!/usr/bin/env bash
set -e

ROOT="$(git rev-parse --show-toplevel)"

echo "==> pre-push: rebuilding release ZIPs..."
bash "$ROOT/scripts/build.sh"

if ! git diff --quiet release/ 2>/dev/null; then
    echo "⚠  release/ changed during build."
fi

exit 0
```

Effect: `release/myplugin-X.Y.Z.zip` always reflects the latest commit. If a developer pushes a broken plugin (syntax error, missing file in `copy_shared`), `build.sh` fails and the push is blocked. This is the single most valuable piece of the pipeline.

### 10.2 GitHub Actions on tag push

Already covered in §6.2. Triggers the Pro Release publish on every `v*` tag.

### 10.3 SVN release script

`scripts/release-wp.sh` (§6.1). One command publishes Free to wordpress.org. Manually invoked because WP.org review is async — you don't want to publish on every commit, only on releases.

### Overall release flow

The end-to-end release ritual (after the version bump in §8 + CHANGELOG entry):

```bash
# 1. Sanity local checks
php -l myplugin.php includes/*.php uninstall.php
npm run build
bash scripts/build.sh   # produces both ZIPs

# 2. Commit + push (pre-push hook rebuilds, validates)
git add -A
git commit -m "release: X.Y.Z"
git push origin main

# 3. Tag + push tag → triggers GitHub Action
git tag vX.Y.Z
git push origin vX.Y.Z
# Wait ~90s for the Action; verify the GitHub Release page has both ZIPs.

# 4. Optional: publish Free to WP.org SVN
bash scripts/release-wp.sh -y
```

If you skip step 4, the Free version stays on its previous wordpress.org tag. That's deliberate — sometimes a release is Pro-only (e.g. a licensing fix) and there's no value in pushing the free side through review.

---

## 11. WordPress.org compliance

The Free build must pass WordPress.org's [Plugin Check](https://wordpress.org/plugins/plugin-check/). Common gotchas worth designing around from day one:

| Rule | Implication for the architecture |
|------|--------------------------------|
| **No external services / phone-home in the free tier** | The licence manager (which talks to your Supabase/etc) MUST be stripped from the free build. Build script's `copy_shared` allow-list naturally enforces this. |
| **External services must be disclosed in `readme.txt`** | If the free build does have any external connection (e.g. plugin-update-checker contacts wordpress.org — fine; an analytics call — not fine), document it under `== External Services ==` in `free/readme.txt`. |
| **No automatic deactivation of other plugins** | The "Pro auto-deactivates Free" pattern (§4.4) is OK because it only triggers from the Pro plugin (which isn't on WP.org). Don't try to do reverse — Free should never deactivate Pro. |
| **No obfuscated / minified-only JS or CSS without source** | Add a `== Source Code ==` section to `readme.txt` linking to your GitHub repo. Vite-built bundles are fine because the source is publicly available. |
| **No premium upsell that hijacks core admin pages** | Upgrade prompts should be confined to the plugin's own admin pages. Don't add notices to `Plugins`, `Dashboard`, etc. |
| **All code must be GPL-2-or-later compatible** | License the plugin GPL-2.0-or-later in the main file header. Your private Pro features can be GPL too — it's the most permissive direction. |

The single-source architecture makes most of these easy: the licensing/upselling/external-services code is Pro-only and physically absent from the free ZIP, so Plugin Check can't flag it.

> **WP.org review delay**: the first submission of a new plugin takes 1-4 weeks of human review. Subsequent releases via SVN are usually visible within minutes. Build the free version with this in mind — get accepted on WP.org first, then start iterating on Pro features.

---

## 12. Hard-learned lessons

A handful of pitfalls collected from real-world freemium plugin development. None of these are theoretical — each has cost a release cycle to fix.

### 12.1 The `copy_shared` allow-list is your only defence against leaking Pro code

Any file you forget to add to `copy_shared()` silently ends up missing from the Free build. Conversely, any file that should be Pro-only but lives at a path that already gets copied (e.g. inside `includes/` because you cp'd the whole folder) ships to wordpress.org and breaks Plugin Check.

**Always copy files explicitly by name in `copy_shared()`. Never `cp -r includes/`.** It looks more verbose, but the verbosity is doing real work — every line is a documented decision about which tier gets the file.

### 12.2 `set -euo pipefail` saves your release pipeline

Without `-e`, a failing `cp` mid-build prints an error to stderr and continues, producing a corrupt ZIP. Without `-u`, an empty `${VERSION}` variable produces `release/myplugin-.zip`. Without `-o pipefail`, a failure in the middle of a pipe (`tar | grep`) goes unnoticed. Set all three at the top of every shell script.

### 12.3 The pre-push hook is the most valuable piece of the pipeline

Once you have it, you stop pushing broken plugins. Without it, you push, then realise after the GitHub Action fails that you forgot to commit a file. The pre-push hook re-runs the full build before letting the push through. Worth its weight in gold.

### 12.4 Version bumping in 5 places will bite you

Even with the bash one-liner above, you'll forget one of the 5 files at least once. The most common forget is `free/readme.txt` (because it's in a subdirectory and out of sight). The symptom: WordPress.org keeps serving the old version because `Stable tag:` points to the old number.

A `make bump VERSION=1.2.3` target or an npm script that wraps the bash is worth the 10 minutes of setup.

### 12.5 The `Stable tag:` in `readme.txt` controls which version users see

Even after you SVN-commit a `tags/1.2.3/` folder, WordPress.org continues serving `tags/1.2.2/` until `Stable tag:` in `trunk/readme.txt` points to `1.2.3`. The release script handles this automatically (because it copies the bumped `readme.txt` into trunk before commit), but if you're ever doing a manual SVN release, **that line is the actual deployment trigger** — not the `svn cp` to tags.

### 12.6 Pro plugin slug must NOT match Free plugin slug

If both ZIPs extract to `myplugin/`, WordPress treats them as the same plugin and refuses to install Pro alongside an existing Free install. The convention: Free is `myplugin/`, Pro is `myplugin-pro/`. Pro's activation hook then auto-deactivates Free (§4.4). The folder names are encoded in the ZIP structure, so the build script controls them via the `mkdir -p "$BUILD/myplugin"` and `mkdir -p "$BUILD/myplugin-pro"` calls.

### 12.7 GitHub Action's softprops/action-gh-release flakes ~5% of the time

The `Create GitHub Release` step occasionally fails with no useful error in the logs, despite all preceding steps succeeding. The fix: delete the remote tag (`git push origin :refs/tags/vX.Y.Z`) and re-push it pointing at the same commit. Re-triggers the Action. We've seen this once across ~10 releases. Don't bump the version when this happens; it's transient.

### 12.8 PUC's `enableReleaseAssets()` regex is critical

Without filtering, PUC will download GitHub's auto-generated source tarball (the entire monorepo) instead of your Pro ZIP. WP rejects the install. With a wrong regex, PUC matches the Free ZIP instead. Anchor the regex on the Pro folder name: `/^myplugin-pro-\d+\.\d+\.\d+\.zip$/`.

### 12.9 SVN's `svn rm` doesn't pick up files deleted by rsync

When the rsync `--delete` flag removes a file, SVN doesn't know about it until you explicitly run `svn rm`. The release script handles this with:

```bash
svn status "$SVN_DIR/trunk" | grep '^!' | awk '{print $2}' | xargs -r svn rm
```

The `!` status means "missing — was tracked but is now gone". `xargs -r` is GNU-only; on macOS use `xargs` without `-r` (it's harmless to call `svn rm` with no args, just prints usage).

### 12.10 Pro and Free can't both be active at the same time

WordPress doesn't enforce this, so you have to. The §4.4 pattern (auto-deactivate Free when Pro activates) is the bare minimum. Don't try to make them coexist — they share the same option keys, the same hooks, the same DB rows, and you'll spend weeks chasing duplicate-execution bugs.

### 12.11 Build artefacts don't belong in git

`build/`, `release/`, `node_modules/`, `vendor/` should all be `.gitignore`d. The pre-push hook regenerates `release/` on every push, so what's tracked is the source, not the artefacts. Some teams track release ZIPs as a "snapshot" mechanism — don't. Use GitHub Releases for that, where the artefacts live alongside the matching git tag automatically.

---

## 13. Port checklist — adapting an existing plugin to this architecture

Assuming you have an existing plugin that you want to convert to the freemium pattern. Roughly half a day of work for the first port; ~2 hours for subsequent ports.

### 13.1 Decide what's Free vs Pro

Before touching code, write down:

- The list of files (or feature areas) that will be Pro-only.
- The user-facing features Free will lack.
- Whether your plugin already has any external services (analytics, license checks, self-update), because those all need to move to the Pro side.

If everything currently lives in `includes/`, you'll likely need to split a few files into "shared" + "Pro-extension" pieces.

### 13.2 Add the `MYPLUGIN_PRO` constant

```php
// myplugin.php
if ( ! defined( 'MYPLUGIN_PRO' ) ) {
    define( 'MYPLUGIN_PRO', false );
}
```

Add an `is_pro_plugin()` helper to your orchestrator class. Audit the codebase for any `if (existing_premium_check)` and replace with the constant + the new `is_premium()` helper from the licensing layer (see `licensing.md`).

### 13.3 Move Pro-only files behind the constant

The minimum set of Pro-only files for a typical freemium plugin:

- `includes/class-license-manager.php` (licensing — see `licensing.md`)
- `includes/class-updater.php` (auto-updater wrapper)
- `includes/lib/plugin-update-checker/` (vendored library)
- Optionally: any "Pro module" files (premium feature implementations)

Wire each behind `if ( MYPLUGIN_PRO )` in the orchestrator's `load_dependencies()` and `register_hooks()`.

### 13.4 Write `scripts/build.sh`

Copy the structure from §5. Customise:

- The `copy_shared()` list to match your plugin's actual file layout.
- The `sed` constant flip (the constant name, the Plugin Name change).
- The Pro-specific `cp` calls at the bottom.

Test by running `bash scripts/build.sh` and inspecting both `build/myplugin/` and `build/myplugin-pro/` folders to confirm the right files are in each.

### 13.5 Write `free/readme.txt`

Convert your existing `README.md` (or write fresh) into WP.org format:

```
=== My Plugin ===
Contributors: yourname
Tags: tag1, tag2, tag3
Requires at least: 6.0
Tested up to: 6.9
Stable tag: 1.0.0
Requires PHP: 7.4
License: GPLv2 or later

Short description (max 150 chars).

== Description ==
Long description.

== Installation ==
1. Upload to /wp-content/plugins/
2. Activate.

== Changelog ==
= 1.0.0 =
* Initial release.

== Upgrade Notice ==
= 1.0.0 =
Initial release.
```

### 13.6 Write `scripts/release-wp.sh`

Copy from §6.1. Run `svn co https://plugins.svn.wordpress.org/myplugin ~/Desktop/Wordpress/SVN/myplugin-svn` once to get the working copy. (Requires the plugin to be already accepted on wordpress.org — submit `myplugin-1.0.0.zip` to the WP.org review queue first.)

### 13.7 Vendor PUC + write `class-updater.php`

Download the latest plugin-update-checker release, extract under `includes/lib/plugin-update-checker/`. Write the wrapper class (§7) with your repo URL and asset regex. Wire it from `myplugin.php` behind `if ( MYPLUGIN_PRO )`.

### 13.8 Set up the GitHub Action

Copy `.github/workflows/release-pro.yml` from §6.2. No secrets needed (the licensing layer handles its own keys with public values). Push the file, then push a `v0.0.1-test` tag to verify the Action runs end-to-end before relying on it.

### 13.9 Set up the pre-push hook

```bash
mkdir -p .githooks
cat > .githooks/pre-push <<'EOF'
#!/usr/bin/env bash
set -e
ROOT="$(git rev-parse --show-toplevel)"
echo "==> pre-push: rebuilding release ZIPs..."
bash "$ROOT/scripts/build.sh"
EOF
chmod +x .githooks/pre-push
```

Then either run `git config core.hooksPath .githooks` once (developer-local), or add a `npm postinstall` script that does it automatically:

```json
{
  "scripts": {
    "postinstall": "git config core.hooksPath .githooks"
  }
}
```

### 13.10 Submit Free to WordPress.org

If the plugin isn't on WP.org yet:
1. Build the free ZIP: `bash scripts/build.sh` → `release/myplugin-1.0.0.zip`.
2. Submit it via [https://wordpress.org/plugins/developers/add/](https://wordpress.org/plugins/developers/add/).
3. Wait 1-4 weeks for review.
4. Once approved, you'll get SVN credentials. Run `svn co` per §6.1.

### 13.11 Smoke test the full pipeline

Before announcing anything:

- **Free install**: install `myplugin-1.0.0.zip` on a fresh WP. Activate. Verify it works without any Pro features.
- **Pro install**: install `myplugin-pro-1.0.0.zip` on another fresh WP. Activate. Verify Pro features work.
- **Pro overlays Free**: install Free, activate, then install Pro. Verify Free auto-deactivates.
- **Pro auto-update**: install Pro 1.0.0. Push a `v1.0.1` tag. Wait for the Action. Verify "Update available" shows up in `wp-admin/plugins.php` within 24 h.
- **Free WP.org update**: SVN-publish 1.0.1. Verify the existing Free site sees "Update available" within 6 h (WP's update transient TTL).

---

## 14. References

- [WordPress.org Plugin Handbook](https://developer.wordpress.org/plugins/) — mandatory reading on hooks, options, security.
- [Plugin Check](https://wordpress.org/plugins/plugin-check/) — install in your dev WP, run against your Free build before every SVN release.
- [softprops/action-gh-release](https://github.com/softprops/action-gh-release) — the GitHub Action used for Pro releases.
- [YahnisElsts/plugin-update-checker](https://github.com/YahnisElsts/plugin-update-checker) — the auto-updater library vendored into Pro builds.
- [Keep a Changelog](https://keepachangelog.com/) — the format `CHANGELOG.md` follows so the GH Action can extract release notes reliably.
- `docs/licensing.md` (in this repo) — licensing-specific details that complement the freemium architecture (covered separately because the licensing back-end is its own beast).

---

## 15. What this document deliberately does NOT cover

- **Specific plugin features.** The architecture described here is the *frame*; what your plugin *does* is orthogonal.
- **The licensing layer.** That's a separate concern with its own complexity. See `docs/licensing.md`.
- **Frontend / admin UI choices.** Whether you use vanilla PHP forms, a React SPA via Vite, or something else — out of scope. The freemium pattern works the same regardless of your UI stack.
- **Database migrations.** Any data layer is plugin-specific. The architecture doesn't constrain it.
- **Internationalisation.** Language file generation, `.pot` extraction, string scanning — all standard WP plugin practice, not freemium-specific.
- **Cross-tier feature flags.** The simple `MYPLUGIN_PRO` constant + Pro-module gating covers ~95% of cases. If you need fine-grained per-feature flags (A/B tests, experimental features), build that on top — don't try to encode it in the freemium constant.
