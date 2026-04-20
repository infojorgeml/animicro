# Changelog

All notable changes to Animicro are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2026-04-20

### Improved

- **Highlight module overhauled** — Fixed `--am-hl-delay` inheriting stray `data-am-delay` values from the page (e.g. `20s`). `duration` and `delay` are now clamped at the JS layer to `[0, 10]` matching PHP sanitization. Direction (`highlightDirection`) is now validated against the allowed list (`left`, `right`, `center`); anything else falls back to `left`. Switched marker from `::after` to `::before` with `display: inline-block` so the highlight width tracks the actual text box correctly in all builders. `pointer-events: none` prevents the marker from blocking clicks on links inside highlighted text. Guard against double-init added (`data-am-highlight-ready`). Child nodes are now moved (not `innerHTML`-cloned) to preserve nested event listeners.
- **Typewriter module overhauled** — Respects `prefers-reduced-motion: reduce` (shows full text immediately, no cursor). `typingSpeed` and `delay` clamped at JS layer. Single text node updated in-place per tick instead of appending one text node per character. Cursor element removed from the DOM after fade-out. Guard against double-init added (`data-am-typewriter-ready`). Cursor blink CSS moved from runtime `<style>` injection to `style.css` (CSP-friendly). New `data-am-cursor` attribute lets you set a custom cursor character per element (e.g. `▍`, `_`, `data-am-cursor="_"`). `el._amTypewriterCancel()` exposes a canceller handle.
- **Color picker for Highlight, Text Fill on Scroll** — Native swatch + opacity slider (0–100 %) + free-text input in the admin. Accepts `#rrggbbaa` hex with alpha, `rgba()`, `hsla()`, and CSS variable tokens (`var(--brand-100)`). Opacity slider is automatically disabled when the value already carries its own alpha. Checkerboard background visible under transparent colors.

## [1.5.0] - 2026-04-17

### Added

- **Pro tier restored** — 9 Pro modules re-enabled (Blur, Stagger, Grid Reveal, Text Fill on Scroll, Parallax, Split Text, Text Reveal, Slide Right, Slide Left), plus Smooth Scroll and the Cheat Sheet reference panel. The free build on WP.org is unchanged.
- **`ANIMICRO_PRO` build flag** — Source now defines `ANIMICRO_PRO` (default `false`). `scripts/build.sh` flips it to `true` for the Pro ZIP and strips the license manager from the free ZIP. Local dev sites can force Pro by setting `define('ANIMICRO_PRO', true)` in `wp-config.php`.
- **Pre-push build hook** (`.githooks/pre-push`) — Rebuilds both ZIPs on every `git push`. Enabled automatically via `npm install` (`core.hooksPath = .githooks`).
- **`npm run release:wp`** — `scripts/release-wp.sh` rebuilds and rsyncs the free build into the WP.org SVN trunk; prints the final `svn ci` commands rather than running them (releases stay under manual control).

### Notes

- The free build on WP.org remains functionally identical to 1.4.0 for end users.

## [1.4.0] - 2026-04-17

### Security

- **REST API CSRF hardening** — `POST /animicro/v1/settings` now verifies the `X-WP-Nonce` header before processing writes. `GET` remains unauthenticated-nonce (read-only, gated by capability).
- **Numeric settings clamped** — `duration` and `delay` clamped to `[0, 10]`; `distance` to `[-500, 500]`; `scale` to `[0, 3]`; `typingSpeed` to `[10, 500]`. Rejects non-numeric input.
- **CSS class injection hardened** — Module IDs in `get_editor_css()` now validated with `[a-z0-9-]+` regex before being interpolated into CSS selectors.
- **`margin` whitelist** — `rootMargin` values validated against CSS shorthand pattern (1–4 values, valid units only); falls back to module default on invalid input.
- **Supabase anon key removed from source** (Pro) — Key is now injected at build time via `ANIMICRO_SUPABASE_ANON_KEY` env var / `.env.build`. Placeholder `__ANIMICRO_SUPABASE_ANON_KEY__` ships in source.
- **License key encrypted at rest** (Pro) — AES-256-CBC encryption using `AUTH_KEY` + `SECURE_AUTH_KEY` from `wp-config.php`. Legacy plaintext keys auto-migrated on next save.
- **License cache invalidated on domain change** (Pro) — Hooks `update_option_siteurl` and `update_option_home` clear license transients immediately on URL change.
- **Uninstall cleanup** — `uninstall.php` now removes all plugin data: `animicro_license_key`, `animicro_license_data`, `animicro_premium_active`, and both license transients.

### Performance

- **`animicro_settings` autoload disabled** — Option stored with `autoload=false`; existing installs migrated on next activation.
- **Admin menu icon pre-encoded** — SVG base64 string stored as class constant; eliminates `base64_encode()` call on every `admin_menu` hook.

### Developer

- **`animicro_upgrade_url` filter** — Upgrade link URL is now filterable for white-label or partner deployments.
- **Manifest error logging** — Failed manifest reads in admin and frontend now emit `error_log` entries when `WP_DEBUG` is enabled.

## [1.3.0] - 2026-04-16

### Changed (WordPress.org directory compliance)

- **Free plugin is 100% free code** — Removed Pro-only modules, smooth scroll, license UI, and premium gating from the free distribution. No trialware / hidden Pro code in the shipped free package.
- **No automatic deactivation of other plugins** — Removed `deactivate_plugins()` on activation (forbidden by plugin directory guidelines).
- **`readme.txt`** — Added `== Source Code ==` with link to the public GitHub repository for reviewers (minified bundles + human-readable source).
- **`README.md` (bundled)** — Aligned with the free tier only (module list and docs).
- **Build output** — Free ZIP is named `animicro-X.Y.Z.zip` alongside `animicro-pro-X.Y.Z.zip` (see `scripts/build.sh`).

### Removed (free build)

- Lenis / smooth-scroll chunk from the free frontend bundle; Pro-only animation modules and their JS from the free tree.

## [1.2.0] - 2026-04-13

### Added

- **Upgrade button in plugin row** — Free version now shows a lilac "Upgrade" link next to "Deactivate" in the WordPress plugins list, pointing to animicro.com.
- **Pro auto-deactivates Free** — When Animicro Pro is activated, the free plugin is deactivated automatically and a success notice is shown in the admin.

### Changed

- **Highlight and Typewriter are now Free** — Both modules moved from the Pro tier to the Free tier. All users (free and pro) have access to `.am-highlight` and `.am-typewriter` without a license.
- **Dynamic CSS output** — Builder-compatibility CSS is now injected via `wp_add_inline_style()` instead of `echo "<style>"` in `wp_head`, fully complying with WordPress.org Plugin Check requirements.
- **Pro plugin name** — Animicro Pro is now correctly displayed as "Animicro Pro" in the WordPress admin (plugin list and menu), distinguishing it from the free "Animicro" plugin.
- **`add_module_type()` hardened** — Uses `str_replace('<script ', ...)` with a duplicate-type guard, preventing false matches on `data-src` or similar attributes.

### Fixed

- **`free/readme.txt`** — Added `== External Services ==` section confirming no external connections, as required by WordPress.org review guidelines.
- **`PRO_MODULES` / `FREE_MODULES`** in `class-license-manager.php` updated to reflect that Highlight and Typewriter are now Free.

## [1.1.0] - 2026-04-13

### Changed

- **Freemium architecture** — The plugin now ships as two separate builds from a single source repository (replacement model): `animicro` (free, for WordPress.org) and `animicro-pro` (paid, distributed directly). The free version has no license checks, no Supabase calls, and no license manager code included.
- **`ANIMICRO_PRO` constant** — New PHP constant (`false` in free, `true` in pro) gates all premium-only code paths. Pro modules, Smooth Scroll, and the License admin page are fully absent from the free build at the file level.
- **`Animicro::PRO_MODULES` and `Animicro::is_pro_plugin()`** — Pro module list and pro-plugin detection moved to the core `Animicro` class so all PHP files can reference them without depending on `class-license-manager.php`.
- **Admin UI** — In the free version, locked Pro module cards link directly to `animicro.com` ("Upgrade to Pro") instead of the internal license page. Pro tabs (Cheat Sheet, Smooth Scroll) open `animicro.com` when clicked. In the pro version behaviour is unchanged.
- **Build script** (`scripts/build.sh`) — New shell script generates both ZIPs in one command: compiles Vite assets, copies shared files, excludes `class-license-manager.php` from the free build, flips `ANIMICRO_PRO` to `true` for the pro build, and zips both into `release/`.
- **`free/readme.txt`** — Added WordPress.org-format `readme.txt` required for directory submission.

### Removed

- **`class-license-manager.php` from free build** — License validation, Supabase API calls, and option management are not present in the plugin distributed via WordPress.org.

## [1.0.1] - 2026-03-29

### Fixed

- **WordPress.org automated scan**: removed `languages/.gitkeep` (hidden files are not permitted). Replaced with `languages/index.php` (standard “silence is golden” stub). Release zip script now skips any file whose name starts with `.` to avoid packing dotfiles by mistake.

## [1.0.0] - 2026-03-29

### Initial public release

- **15 animation modules** — Free: Fade, Scale, Slide Up, Slide Down. Pro: Slide Left, Slide Right, Blur, Stagger, Grid Reveal, Highlight, Text Fill on Scroll, Parallax, Split Text, Text Reveal, Typewriter.
- **Builder-aware** — Compatible with Elementor, Bricks, Breakdance, Oxygen, Divi, and Gutenberg (per-builder CSS so elements stay editable in editors; animations run on the live site).
- **Per-module settings** with live preview in the WordPress admin.
- **Pro license** — Unlock Pro modules, Smooth Scroll (Lenis), and the Cheat Sheet tab.
- **`data-am-*` attributes** — Per-element overrides for duration, easing, delay, margins, distances, colors, and more.
- **Smooth Scroll** (Pro) — Optional site-wide smooth scrolling via a separate JS chunk.
- **Advanced** (Free) — Respect Reduced Motion (accessibility) and Debug Mode (outline `.am-*` elements + console timing).
- **REST API** — Settings saved in `animicro_settings`; frontend receives `animicroFrontData` for module loading and options.

## [0.6.0] - 2026-03-29

### Added

- **Advanced** tab (last in the admin nav, after Integrations): global options stored in `animicro_settings.advanced` and passed as `animicroFrontData.advanced`.
- **Respect Reduced Motion** (Free, on by default): when enabled and the visitor’s OS reports `prefers-reduced-motion: reduce`, the frontend script skips loading animation modules and smooth scroll. A CSS `@media (prefers-reduced-motion: reduce)` block in `style.css` disables transitions/animations on `.am-*` elements as a fallback.
- **Debug Mode** (Free): optional red dashed outlines on elements whose class list contains `am-`, plus `console.time` / `console.timeEnd` around module loading for troubleshooting.

### Removed

- **Replay animations on scroll** (previously Pro): feature and UI removed; entry animations behave as one-shot again.

## [0.5.0] - 2026-03-29

### Added

- **Smooth Scroll** (Pro): global smooth scrolling via Lenis, configured under **Animicro → Smooth Scroll**. Settings (`lerp`, `duration`, `smoothWheel`, `wheelMultiplier`, `anchors`) are saved in `animicro_settings.smooth_scroll` and passed to the frontend as `animicroFrontData.smoothScroll` only when enabled and the site has an active Pro license. The implementation uses a dynamic import so Lenis loads as a separate chunk only when the feature is on.

### Changed

- **Smooth Scroll** admin copy: introductory text no longer names the underlying library; it describes behavior only.

## [0.4.2] - 2026-03-29

### Added

- **Admin menu icon**: custom Animicro logo as an inline SVG passed to `add_menu_page()` via `data:image/svg+xml;base64,...` (no extra HTTP request).

### Changed

- **Admin UI branding**: primary accent color set to brand violet (`#A200FF`) via Tailwind `brand` palette in `tailwind.config.js` (replaces generic blue across dashboard, tabs, toggles, module settings, license, integrations, cheat sheet class badges).
- **License page**: simplified copy to “Activate your license to unlock Pro modules.” and removed the “Pro modules included” list block.
- **Cheat Sheet**: copy actions use the same icon-style `CopyClassButton` as the module list (stroke copy icon + check feedback).

## [0.4.1] - 2026-03-29

### Fixed

- **Grid Reveal flicker**: eliminated the 1-2 frame flash where children appeared at full opacity before the entrance animation started. Children now receive inline `opacity: 0` before the `.is-ready` class is added, ensuring the CSS override never wins.
- **Stagger flicker prevention**: applied the same inline initial-style technique to the Stagger module as a preventive measure against the same race condition.
- **WordPress Plugin Check compliance**: removed remaining `error_log()` calls from `class-license-manager.php`, escaped CSS output with `wp_strip_all_tags()` in `class-frontend.php`, added `phpcs:ignore` annotations for legitimate nonce-free `$_GET` reads (builder detection).
- **README headers**: added required WordPress.org headers (Tested up to, Stable tag, License, Short Description, Contributors, Tags).
- **Distribution**: created `.distignore` to exclude dev files from WordPress.org SVN packages, created `languages/` folder for the Domain Path header.
- **Hidden files**: removed `.DS_Store` from git tracking.
- **Directory rename**: renamed plugin folder from `Animicro/` to `animicro/` (lowercase) to match WordPress.org slug conventions and resolve text domain mismatch warnings.

## [0.4.0] - 2026-03-28

### Fixed

- **PHP defaults**: added missing `duration`, `easing`, `delay`, `margin` to `text-fill-scroll` module defaults, preventing PHP 8+ undefined key warnings.
- **Uninstall cleanup**: `uninstall.php` now deletes all license options (`animicro_license_key`, `animicro_license_data`, `animicro_premium_active`) and transients (`animicro_license_check`, `animicro_license_last_check`).
- **License page**: updated Pro modules list to include all 11 current Pro modules.
- **Dead code removed**: deleted unused `GlobalSettings.tsx` component.
- **CSS no-JS fallback**: completed `@media (scripting: none)` block with missing modules (`slide-right`, `slide-left`, `text-reveal`, `typewriter`, `parallax`).
- **Security**: removed `error_log` statements that exposed license key and domain in `class-license-manager.php`.
- **Security**: wrapped `$_GET` values with `sanitize_text_field( wp_unslash() )` in `class-frontend.php`.
- **Clipboard fallback**: `CheatSheet.tsx` now uses `try/catch` with `document.execCommand('copy')` fallback for older browsers.
- **Documentation**: corrected `README.md` (`data-am-distance` now includes `split`) and `docs/animicro.md` (added Divi, fixed Breakdance body class, added `et_pb_pagebuilder_layout`).
- **NaN protection**: `config.js` now uses safe `parseFloat`/`parseInt` wrappers that fall back to defaults on invalid input.
- **Indentation**: fixed misaligned `module_settings` key in `class-animicro.php`.
- **Integrations UX**: selecting "None" now deselects all builders, and selecting a builder deselects "None".

## [0.3.9] - 2026-03-28

### Added

- **Text Fill on Scroll module** (Pro): `.am-text-fill-scroll` splits text into words and reveals a fill color per word as the user scrolls, using Motion One `scroll()` + `animate()` with linear opacity. Global settings for **base color**, **fill color**, **scroll start**, and **scroll end** (viewport percentages for scroll offsets). Overrides: `data-am-color-base`, `data-am-color-fill`, `data-am-scroll-start`, `data-am-scroll-end`. Admin preview simulates the word-by-word fill with staggered opacity.

## [0.3.8] - 2026-03-28

### Added

- **Highlight module** (Pro): `.am-highlight` draws a marker-style background behind text when it enters the viewport. Global settings for color and sweep direction (`left`, `right`, `center`); overrides with `data-am-highlight-color` and `data-am-highlight-direction` on the element. Uses a wrapped inner span and `::after` with CSS `scaleX` transitions (Motion One `inView` for activation).

### Fixed

- **Admin preview (Highlight)**: Stacking context (`isolation: isolate`) so the highlight is visible over the preview background. Replay and parameter changes now reset the animation reliably (instant transition reset via `--am-hl-duration: 0s`, then restored duration and double `requestAnimationFrame` before re-adding the active class).

## [0.3.7] - 2026-03-28

### Added

- **Grid Reveal module** (Pro): `.am-grid-reveal` on a container animates **direct children** with spatial timing from a focal point. Nine origins (corners, edges, center) plus **random** (`data-am-origin` on the container, utility-first). Per-module settings: origin picker, stagger delay, slide distance, live 3×3 preview. Frontend uses `getBoundingClientRect()` and **rank-based delays** so each child gets a unique stagger while preserving wave order (no more paired simultaneous items when distances tie).
- **Copy class** buttons next to each module class in the Dashboard and in module settings headers; copies the class string to the clipboard with a brief check-state feedback.

### Fixed

- **REST API**: `origin` is now whitelisted when saving `module_settings` so Grid Reveal origin persists after Save (was dropped by PHP sanitization).

## [0.3.6] - 2026-02-26

### Added

- **Divi builder** compatibility: body class `et_pb_pagebuilder_layout`, URL check `?et_fb=1`; Divi button added to Integrations admin panel
- **Elementor** URL check `?elementor-preview` in addition to the existing body class — prevents hiding CSS from loading in the editor iframe
- **Oxygen Builder** URL check `?ct_builder=true` in addition to the existing body class
- **Builder docs**: individual markdown files in `docs/` for each supported builder (Bricks, Breakdance, Elementor, Oxygen, Divi, Gutenberg) with detection details and key references
- **Bug fix**: `type="module"` now injected via `str_replace('<script ', ...)` instead of `str_replace(' src', ...)` — more robust across all WordPress versions and attribute orders
- **Bug fix**: Vite frontend build now uses `base: './'` so dynamic chunk imports resolve correctly from the plugin's URL instead of the server root — fixes 404 errors for all JS modules

## [0.3.5] - 2026-02-26

### Added

- **Parallax module** (Pro) full upgrade: per-module settings with **Speed** slider (0.1–1.0), live preview with scroll-simulation oscillation, rewritten frontend using `getElementConfig` and Motion One `scroll()`. `data-am-speed` support. Duration, easing, delay, and margin hidden in admin since parallax is scroll-linked.

## [0.3.4] - 2026-02-26

### Added

- **Stagger module** (Pro) full upgrade: per-module settings (duration, easing, delay, margin, stagger delay, distance), **6-square grid preview** in admin, rewritten frontend with `getElementConfig`, margin-based inView, `Array.from` for proper stagger timing. `data-am-stagger` and `data-am-distance` support.

### Fixed

- **Bricks builder**: Stagger children no longer disappear in the editor. Removed static CSS `.am-stagger > * { opacity: 0 }` that hid elements globally; hiding now only via dynamic CSS with `body:not(.bricks-is-builder)` exclusion.

## [0.3.3] - 2026-02-26

### Added

- **Typewriter module** (Pro): character-by-character typing with blinking cursor — `.am-typewriter` types the element's text with a configurable **Typing speed** (delay per character, 0.02–0.15s). Cursor blinks during typing and fades out when done. Per-module settings (typing speed, delay, margin), live preview, `data-am-typing-speed` support. Duration and easing hidden in admin for this module.

## [0.3.2] - 2026-02-26

### Added

- **Text Reveal module** (Pro): per-line sliding mask — `.am-text-reveal` reveals text line by line with a vertical clip (text slides up from behind a mask). Per-module settings (duration, easing, delay, margin, stagger delay), live preview, `data-am-stagger` support.

## [0.3.1] - 2026-02-26

### Added

- **Split Text module** (Pro): hybrid approach with two utility classes — `.am-split-chars` (by characters) and `.am-split-words` (by words). One admin module, per-module settings (stagger delay, distance), live preview, `data-am-stagger` support.

### Changed

- Split Text: removed `data-am-split`; mode is now determined by the CSS class used

## [0.3.0] - 2026-02-26

### Added

- **Scale module** (free) brought to same quality as Fade: per-module settings (duration, easing, delay, margin, scale factor), **Scale factor** slider (0.5–1.0), live preview, reset to default
- **Blur module** (Pro) full support: per-module settings, **Blur amount** slider (1–20px), live preview, reset to default
- `ModuleConfig` and PHP defaults now support optional `scale` and `blur`; frontend `getElementConfig` returns them
- **One animation per element** notice in Dashboard (below module grid) and Cheat Sheet: warning icon + "Important: Use only one animation class per element…" to avoid flicker when combining classes

### Changed

- **Module order**: Scale is now second in the list (Fade, Scale, Slide Up, Slide Down, Slide Right, Slide Left, Blur, Stagger, Parallax, Split)
- `scale.js` and `blur.js` rewritten with per-element `forEach` + `margin`-based inView (no `amount`)
- AnimationPreview supports scale and blur animations in the admin
- README and docs updated with new order and data attributes for scale/blur

## [0.2.9] - 2026-02-26

### Added

- **Slide Down** full support: per-module settings, distance slider, live preview, reset to default (same as Slide Up)
- **Slide Right** (`.am-slide-right`) and **Slide Left** (`.am-slide-left`) as Pro modules: X-axis slide-in animations, settings page, live preview, initial CSS
- Frontend `slide.js` extended for X-axis: slide-right animates `x: [-distance, 0]`, slide-left `x: [distance, 0]`
- Registry entries and PHP defaults for `slide-right` and `slide-left`

### Changed

- License: Slide Right and Slide Left require Pro; Slide Down remains free
- `data-am-distance` applies to all four slide modules (slide-up, slide-down, slide-right, slide-left)
- AnimationPreview supports X-axis for slide-right/slide-left

## [0.2.8] - 2026-02-26

### Added

- **Slide Up module** brought to same quality as Fade:
  - Per-module settings (duration, easing, delay, margin, distance) with dedicated settings page
  - **Distance** slider (10–100px) in admin for slide-up and slide-down
  - Live preview in admin shows opacity + translateY for slide modules
  - Reset to default button for Slide Up settings
- `ModuleConfig` and PHP defaults now support optional `distance` for slide modules
- Frontend `slide.js` rewritten: per-element config via `getElementConfig`, `margin`-based inView (no `amount`)

### Changed

- Initial CSS for `.am-slide-up` and `.am-slide-down` aligned to 30px distance (was 20px)
- `getElementConfig` uses module default `distance` from settings when not overridden by `data-am-distance`

## [0.2.7] - 2026-02-26

### Changed

- **Data attributes** renamed to namespaced `data-am-*` format:
  - `data-duration` → `data-am-duration`
  - `data-delay` → `data-am-delay`
  - `data-easing` → `data-am-easing`
  - `data-margin` → `data-am-margin`
  - `data-distance` → `data-am-distance`
  - `data-scale` → `data-am-scale`
  - `data-blur` → `data-am-blur`
  - `data-stagger` → `data-am-stagger`
  - `data-speed` → `data-am-speed`
  - `data-split` → `data-am-split`
- Avoids conflicts with other plugins; aligns with `.am-*` class naming

## [0.2.6] - 2026-02-26

### Added

- **Reset to default** button in Fade preview panel to restore duration, easing, delay, and margin
- Plugin row links: **Settings** (to admin) and **Upgrade to Pro** (bold green, animicro.com)

### Changed

- **Cheat Sheet** is Pro-only: tab shows "Pro" badge and is locked without license; content visible only for Pro users
- Examples section removed from Cheat Sheet (CSS Classes and Data Attributes tables only)
- Plugin URI and Author URI set to https://animicro.com

## [0.2.5] - 2026-02-26

### Added

- **Live preview** for Fade module settings: animated square on the right that reflects duration, easing, and delay in real time
- **Replay** button to manually trigger the preview animation

### Changed

- **Builder selection** is now multiselect: you can enable multiple builders (e.g. Bricks + Elementor) at once
- Fade settings field order: Delay moved to second position (after Duration)
- Preview panel background: light gray instead of dark
- Preview no longer loops automatically; use Replay to see the animation again

## [0.2.0] - 2026-02-26

### Added

- **Bricks Builder integration**: elements with animation classes stay visible in the editor and animations only run on the live frontend
- **Builder-specific CSS strategy**: dynamic inline CSS in `<head>` uses `body:not(.editor-class)` per builder for zero-flicker loading
- `will-change` optimization on all animation modules for GPU-accelerated rendering

### Changed

- Dynamic CSS now prints at priority 5 in `wp_head` for faster rendering
- Simplified JS builder detection: only checks `?bricks=run` URL parameter
- All UI strings translated to English for international distribution

### Fixed

- Elements with `.am-fade` no longer disappear inside the Bricks editor
- Animations no longer execute inside builder preview/canvas

## [0.1.1] - 2026-02-26

### Added

- **Animation engine** powered by Motion One with 8 modules:
  - **Free**: Fade, Slide Up, Slide Down, Scale
  - **Pro**: Blur, Stagger, Parallax, Split Text
- **Admin panel** React with tabs: Modules, Cheat Sheet, Integrations
- **Per-module settings**: individual configuration (duration, easing, delay, margin) for Fade
- **Pro license system** integrated with Supabase:
  - "License" submenu to activate/deactivate license
  - Periodic validation every 24 hours
  - Pro modules locked without active license
- **Universal CSS** for builder compatibility (Elementor, Bricks, Oxygen, Breakdance)
- **Accessibility fallback** (`@media (scripting: none)`) for users without JavaScript
- **Code splitting** on frontend: only loads JS of active modules
- **Data attributes**: `data-am-duration`, `data-am-delay`, `data-am-easing`, `data-am-margin` per element

### Technical

- PHP 7.4+, WordPress 6.0+
- Vite 6 for admin (React + TypeScript + Tailwind) and frontend (Vanilla JS) build
- REST API: `animicro/v1/settings`, `animicro/v1/license/status`, `animicro/v1/license/save`

[1.2.0]: https://github.com/infojorgeml/animicro/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/infojorgeml/animicro/compare/v1.0.1...v1.1.0
[0.3.4]: https://github.com/infojorgeml/animicro/compare/v0.3.3...v0.3.4
[0.3.3]: https://github.com/infojorgeml/animicro/compare/v0.3.2...v0.3.3
[0.3.2]: https://github.com/infojorgeml/animicro/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/infojorgeml/animicro/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/infojorgeml/animicro/compare/v0.2.9...v0.3.0
[0.2.7]: https://github.com/infojorgeml/animicro/compare/v0.2.6...v0.2.7
[0.2.6]: https://github.com/infojorgeml/animicro/compare/v0.2.5...v0.2.6
[0.2.5]: https://github.com/infojorgeml/animicro/compare/v0.2.0...v0.2.5
[0.2.0]: https://github.com/infojorgeml/animicro/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/infojorgeml/animicro/releases/tag/v0.1.1
