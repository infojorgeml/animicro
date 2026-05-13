# Animicro — Development Reference

**Release:** 1.14.0 (2026-05-09). See CHANGELOG for history.

Utility-first micro-animations for WordPress powered by [Motion One](https://motion.dev/). This document describes the architecture and conventions for developers and AI assistants.

## Overview

- **Philosophy**: Utility-first. No timelines or complex UIs. Users enable modules in the admin panel and apply CSS classes (`.am-fade`, `.am-slide-up`, etc.) and `data-am-*` attributes in their Page Builder.
- **One animation per element**: Do not combine entry animations (e.g. `.am-fade` + `.am-slide-up`) on the same element — multiple modules would run conflicting animations and cause flicker.
- **Goal**: High-end animations (Awwwards-style) with minimal performance impact, compatible with popular builders.
- **Prefixes**: PHP functions/handles/globals use `animicro_`. CSS classes use `.am-`. Data attributes use `data-am-*`.

## Tech Stack

| Layer | Stack |
|-------|-------|
| Backend | PHP 7.4+ OOP |
| Admin UI | React 19, TypeScript, Tailwind CSS, Vite |
| Frontend | Vanilla JS (ES Modules), CSS, Vite |
| Animation | Motion One (~3.8kb). Smooth scroll (Lenis) exists only in the Pro product line, not in the WordPress.org free package. |
| Build | Vite multi-entry (admin + frontend), `manifest.json` for dynamic enqueue |

## Folder Structure

```
animicro/
├── admin/
│   └── src/           # React app (main.tsx, App.tsx, components/, hooks/, data/)
├── frontend/
│   └── src/           # Vanilla JS (main.js, core/, modules/)
├── includes/          # PHP classes (class-animicro, class-admin, class-frontend, class-compatibility, class-license-manager)
├── docs/              # This file, bricks.md, etc.
├── animicro.php       # Bootstrap, constants, activation hooks
├── vite.config.ts     # Vite config (admin + frontend modes)
└── package.json
```

## Data Flow

1. **Settings** stored in `animicro_settings` (options API). Includes `active_modules`, `module_settings`, `smooth_scroll` (Pro), and `advanced` (`reducedMotion`, `debugMode`).
2. **Admin** passes `animicroData` via `wp_add_inline_script` (REST URL, nonce, settings, isPremium, etc.).
3. **Frontend** receives `animicroFrontData` with `modules` (active list), `moduleSettings` (per-module defaults), and `advanced`. If Pro and smooth scroll is enabled, `smoothScroll` is included with Lenis options (`lerp`, `duration`, `smoothWheel`, `wheelMultiplier`, `anchors`).
4. **Per-element** `data-am-*` attributes override module defaults. See `frontend/src/core/config.js` → `getElementConfig(el, moduleId)`.

## Frontend Modules

- **Entry**: `frontend/src/main.js` → `loadModules(activeModules)` from `core/registry.js`.
- **Modules**: `fade`, `slide-up`, `slide-down`, `slide-left`, `slide-right`, `skew-up`, `scale`, `blur`, `float`, `pulse`, `hover-zoom`, `stagger`, `grid-reveal`, `highlight`, `text-fill-scroll`, `parallax`, `img-parallax`, `split`, `text-reveal`, `typewriter`, `page-fade`, `page-curtain`. Each exports `init()`.
- **Config**: `getElementConfig(el, moduleId)` merges `el.dataset.am*` with `moduleSettings[moduleId]` and fallbacks.
- **Code splitting**: Dynamic `import()` per module; only active modules load. **Smooth scroll** (`frontend/src/smooth-scroll.js`) is loaded only when `animicroFrontData.smoothScroll` is present (Pro + enabled in settings).

## Smooth Scroll (Pro, global)

- Not a per-element module: no CSS class on content. Enable in **Animicro → Smooth Scroll** (Pro tab).
- **Frontend**: `main.js` dynamically imports `./smooth-scroll.js`, which initializes Lenis with the options from PHP and imports `lenis/dist/lenis.css` in that chunk.
- **Builder detection**: Same URL checks as `main.js` — Lenis does not start inside Bricks, Elementor, Breakdance, Oxygen, or Divi builder previews.

## Page Transitions (Free, global — added in 1.14.0)

Two global modules that animate the **whole page** on load, configured from the **Page Transitions** admin tab (not the Modules dashboard, because they aren't per-element). Both are Free.

- **`page-fade`** — animates `<body>` from `opacity: 0` → `1` on `DOMContentLoaded`. The hidden state is set via critical inline CSS injected by `class-compatibility.php` against the body class `am-page-fade-init` (which `class-frontend.php` adds via `body_class` filter only outside builder editors). The JS module (`frontend/src/modules/page-fade.js`) animates and then removes both the class and the inline opacity style.
- **`page-curtain`** — a full-screen overlay `<div id="am-page-curtain">` injected via `wp_body_open` hook from `class-frontend.php::output_page_curtain()`. Critical inline CSS in `<head>` makes it cover the viewport from the first paint. The JS module animates it out (3 directions: `fade` / `slide-up` / `slide-down`) and then `remove()`s the element. Supports background color and an optional centered logo image.

Both modules are **builder-safe** (the body class and the overlay are never emitted inside builder editors thanks to the existing `is_builder_editor()` URL detection), respect **`prefers-reduced-motion: reduce`** (revealed immediately, no animation), and degrade gracefully when **JavaScript is disabled** (via a `@media (scripting: none)` safety net in the inline CSS that forces the body visible and hides the curtain). If a (very old) theme doesn't call `wp_body_open()`, the curtain simply never appears — no error, no flash.

The two modules **coexist independently** when both are enabled — the curtain animates over a body that's fading in. Normally users want only one or the other; we don't force exclusivity.

## Advanced (global, Free)

- Tab order: **Advanced** is the last tab.
- **Respect Reduced Motion**: When on (default) and `prefers-reduced-motion: reduce` matches, `main.js` returns early (no `loadModules`, no Lenis). Complemented by CSS in `style.css` under `@media (prefers-reduced-motion: reduce)`.
- **Debug Mode**: When on, `console.time`/`timeEnd` around `loadModules`, and a red dashed outline on elements matching `[class*="am-"]`.

## Builder Compatibility

Two layers protect elements from being stuck at `opacity: 0` inside builder editor previews:

- **Layer 1 — URL detection (primary)**: `frontend/src/main.js` and `includes/class-frontend.php` both check the request for builder-specific URL params. When detected, JS skips `loadModules()` entirely and PHP skips injecting the inline "hide initially" CSS. The element stays at its natural visible state from `frontend/src/style.css` (`opacity: 1; visibility: visible;`).

  Detected URL params: `?bricks=run`, `?breakdance=builder`, `?elementor-preview`, `?ct_builder=true`, `?et_fb=1`. Covers all mainstream builders' editor previews.

- **Layer 2 — body-class exclusion (defense in depth)**: when the inline "hide initially" CSS *is* injected, the selector chains `:not()` against every known builder editor body class plus `.wp-admin`. So even if URL detection missed (an unusual editor that doesn't touch the URL but does add a body class), the element still won't go invisible.

  ```css
  body:not(.wp-admin):not(.elementor-editor-active):not(.bricks-is-builder):not(.breakdance):not(.oxygen-builder-body):not(.et_pb_pagebuilder_layout):not(.block-editor-page) .am-fade {
    opacity: 0;
    /* … */
  }
  ```

  Generated by `Animicro_Compatibility::get_editor_css()`. Up to v1.12.x this list was configurable via an admin "Integrations" tab; the toggle was removed in 1.13.0 because it had no observable effect for normal users (URL detection covered all mainstream builders) and added UI confusion.

Builder body classes monitored: `elementor-editor-active`, `bricks-is-builder`, `breakdance`, `oxygen-builder-body`, `et_pb_pagebuilder_layout`, `block-editor-page`.

## Pro License

- **Free modules**: fade, scale, slide-up, slide-down, slide-left, slide-right, skew-up, float, pulse, highlight, typewriter, hover-zoom.
- **Pro modules**: blur, stagger, grid-reveal, text-fill-scroll, parallax, img-parallax, split, text-reveal. Locked in UI and frontend when `!Animicro_License_Manager::is_premium()`.
- **Cheat Sheet** and **Smooth Scroll** tabs are Pro-only.
- License activation via **LicenSuite v3.0 Connect flow** (OAuth-style account binding); product slug `animicro`. The user never pastes a license key — they click **Connect**, authenticate on the LicenSuite dashboard, pick a license, and the dashboard redirects back with a one-time `token`. The plugin exchanges that token for a long-lived `connection_id + connection_secret` pair stored in `wp_options` (secret AES-256-CBC encrypted at rest). Endpoints:
  - `GET https://licensuite.vercel.app/plugin-connect?product=…&return=…&site_url=…&state=…` — dashboard page the plugin opens in a new tab.
  - `POST https://licensuite.vercel.app/api/plugin-connect/exchange` — body `{ token, site_uuid }`, returns `{ connection_id, connection_secret, license: { plan, expires_at, sites } }`.
  - `POST https://[ref].supabase.co/functions/v1/plugin-validate` — **two-layer auth**: `Authorization: Bearer <SUPABASE_ANON_KEY>` satisfies the Edge Function JWT verification layer, then the function reads `{ connection_id, connection_secret }` from the request body and matches them against `plugin_connections` server-side. Returns `{ valid, reason, plan: { slug, name, max_sites }, expires_at, sites }`. Cached in a transient for 24 h.
- **Local development bypass**: `Animicro_License_Manager::is_development_domain()` short-circuits `validate_connection()` on `localhost`, `*.local`, `*.test`, `*.localhost`, `*.invalid`, `*.example`, IPv6 loopback `::1`, and IPv4 private ranges (`127.x`, `10.x`, `192.168.x`, `172.16-31.x`). No network call, no Connect flow needed, full Pro feature unlock locally. Override via the `animicro_is_development_domain` filter (set to `__return_false`) to test the real Connect flow against a staging dashboard.
- **Premium gating**: `Animicro_License_Manager::is_premium()` derives the answer from current state on every call (no early-bail on a stored bool — that footgun caused 1.12.0–1.12.3 to lock-out users permanently after a transient cache hiccup). The premium-tier slug list is filterable via `animicro_premium_plan_slugs` (default `['pro', 'basic', 'agency', 'enterprise']`).
- **Connection secret at rest**: AES-256-CBC encrypted in `animicro_connection_secret` using a key derived from `AUTH_KEY` + `SECURE_AUTH_KEY`. The `connection_id` (a UUID, not sensitive) is stored plain. The Supabase anon key is hardcoded in the source — it's public by design (the LicenSuite frontend embeds the same key in its HTML), so a build-time injection pipeline would have been overengineering.
- **Plugin deactivation**: `Animicro::deactivate()` calls `clear_connection()` (delete connection_id, connection_secret, license_data, validation transients, deactivate_premium). Matches LicenSuite recommendation + Bricks/WP Rocket/Elementor prior art. The seat stays listed under "Connected sites" in the user's dashboard until they revoke it manually with one click — no public `plugin-self-revoke` endpoint exists yet.

## Key Files

| File | Role |
|------|------|
| `animicro.php` | Bootstrap, constants, activation |
| `includes/class-animicro.php` | Orchestrator, defaults, get_settings() |
| `includes/class-admin.php` | Menu (SVG menu icon as base64 data URL), REST API, enqueue admin assets, plugin_action_links |
| `includes/class-frontend.php` | Enqueue frontend assets, `animicroFrontData` (`advanced`, optional `smoothScroll`), builder-compat CSS via `wp_add_inline_style()` |
| `admin/src/components/SmoothScroll.tsx` | Pro settings UI for global smooth scroll |
| `admin/src/components/AdvancedSettings.tsx` | Free: reduced motion + debug mode |
| `frontend/src/smooth-scroll.js` | Lenis init (dynamic chunk) |
| `includes/class-compatibility.php` | get_editor_css(), BUILDER_EDITOR_CLASSES, MODULE_INITIAL_CSS |
| `includes/class-license-manager.php` | Validation, is_premium(), is_pro_module() |
| `frontend/src/core/config.js` | getElementConfig(el, moduleId) |
| `frontend/src/core/registry.js` | loadModules(), MODULES map |
| `admin/src/data/modules.ts` | MODULE_INFO, DATA_ATTRIBUTES, EASING_OPTIONS, MARGIN_OPTIONS |
| `tailwind.config.js` | Tailwind content scope; `theme.extend.colors.brand` for admin accent (`#A200FF` and related shades) |

## Admin branding

- **Accent**: React admin uses Tailwind `brand-*` utilities (see `tailwind.config.js`).
- **WP sidebar icon**: Built in `Animicro_Admin::register_menu()` as a minimal SVG string + `base64_encode` for the sixth argument of `add_menu_page()`.

## Data Attributes (data-am-*)

| Attribute | Type | Default | Used by |
|-----------|------|---------|---------|
| `data-am-duration` | float (s) | 0.6 | All |
| `data-am-delay` | float (s) | 0 | All |
| `data-am-easing` | string | ease-out | All |
| `data-am-margin` | string | -50px 0px | All |
| `data-am-loop` | bool | false | fade, scale, slide-*, blur — enable infinite looping |
| `data-am-loop-mode` | string | pingpong | fade, scale, slide-*, blur — `pingpong` (A→B→A) or `restart` (A→B, A→B) |
| `data-am-loop-delay` | float (s) | 0 | fade, scale, slide-*, blur — pause between iterations |
| `data-am-distance` | float (px) | 30 | slide-*, split, stagger, grid-reveal |
| `data-am-scale` | float | 0.95 | scale |
| `data-am-blur` | float (px) | 4 | blur |
| `data-am-stagger` | float (s) | 0.05–0.1 | stagger, split, text-reveal, grid-reveal |
| `data-am-speed` | float | 0.5 | parallax |
| `data-am-typing-speed` | float (s) | 0.06 | typewriter — forward typing speed |
| `data-am-back-speed` | float (s) | 0.03 | typewriter — deletion speed |
| `data-am-back-delay` | float (s) | 1.5 | typewriter — hold before deleting |
| `data-am-prefix` | string | (empty) | typewriter — static text before the rotating string |
| `data-am-suffix` | string | (empty) | typewriter — static text after the rotating string |
| `data-am-strings` | JSON / pipes | (element text) | typewriter — list of rotating strings (`"a\|b\|c"` or `'["a","b"]'`) |
| `data-am-loop` | bool | true | typewriter — cycle strings forever |
| `data-am-shuffle` | bool | false | typewriter — randomize order each cycle |
| `data-am-cursor` | string | `\|` | typewriter — custom cursor char, e.g. `▍` or `_` |
| `data-am-cursor-persist` | bool | true | typewriter — keep cursor blinking after typing ends |
| `data-am-origin` | string | center | grid-reveal only — `center`, corners, `top`/`right`/`bottom`/`left`, or `random` (on container) |
| `data-am-highlight-color` | hex / rgba / var(--…) | #fde68a | highlight |
| `data-am-highlight-direction` | string | left | highlight — `left`, `right`, `center` |
| `data-am-color-base` | hex / rgba / var(--…) | #cccccc | text-fill-scroll |
| `data-am-color-fill` | hex / rgba / var(--…) | #000000 | text-fill-scroll |
| `data-am-scroll-start` | int (%) | 62 | text-fill-scroll — scroll offset start |
| `data-am-scroll-end` | int (%) | 60 | text-fill-scroll — scroll offset end |

## Text Fill on Scroll (scroll-linked text)

- **Class**: `.am-text-fill-scroll` on a text element. The script splits `innerText` into words, wraps each in `.am-tfs-wrapper` with `.am-tfs-base` (muted) and `.am-tfs-fill` (target color, opacity animated).
- **Animation**: `scroll(animate(...), { target: el, offset: [...] })` per word; `colorBase`, `colorFill`, `scrollStart`, `scrollEnd` from `getElementConfig(el, 'text-fill-scroll')`.

## Highlight (typography)

- **Class**: `.am-highlight` on a text element. The script wraps content in `.am-highlight-inner`; a `::before` pseudo-element animates `scaleX` via CSS transition when the element enters the viewport (`inView`).
- **Config**: `highlightColor` (accepts hex, `rgba()`, `hsla()`, `var(--token)`), `highlightDirection` (`left` / `right` / `center`, maps to `transform-origin`); `data-am-highlight-color` and `data-am-highlight-direction` per-element overrides.
- **Alpha support**: the admin color picker accepts 8-char hex (`#fde68a80`), `rgba(…)`, and CSS variable tokens. The opacity slider is active for hex values; for `rgba()` or `var()` it is disabled because those carry their own alpha.
- **Double-init guard**: `data-am-highlight-ready="1"` prevents re-wrapping on HMR or repeated `init()` calls.
- **Note**: values of `duration` and `delay` coming from `data-am-*` attributes are clamped to `[0, 10]` at JS level, matching the PHP sanitizer.

## Typewriter (text)

- **Class**: `.am-typewriter` on any text element. The script builds a four-span structure — `<span.am-tw-prefix>` · `<span.am-tw-text>` · `<span.am-tw-suffix>` · `<span.am-tw-cursor aria-hidden>` — and mutates the text node inside `.am-tw-text` in place to avoid node churn.
- **Content sources**: `data-am-strings` (JSON array or `|`-separated list) defines the rotating strings; `data-am-prefix` / `data-am-suffix` wrap static text around them. When neither attribute is present the module falls back to the element's `textContent` as a single string (backward-compatible with 1.6).
- **State machine**: `IDLE → TYPING(i) → HOLDING(backDelay) → DELETING(i) → next index`. When `loop=true` it cycles forever; when `loop=false` it stops on the last string typed (no trailing delete).
- **Shuffle**: with `shuffle=true` the module reshuffles per cycle and guarantees no two consecutive cycles start with the same string.
- **Config keys** (module defaults, overridable per-element via `data-am-*`): `typingSpeed`, `backSpeed`, `delay` (start delay), `backDelay`, `loop`, `shuffle`, `cursorChar`, `cursorPersist`, `margin`.
- **Cursor persists by default** (1.7 breaking change): the blinking cursor stays after typing ends. Set `data-am-cursor-persist="false"` (or disable the admin toggle) for the legacy 1.6 fade-out behaviour.
- **Reduced motion**: when `prefers-reduced-motion: reduce` is set, renders `prefix + strings[0] + suffix` immediately without cursor or cycling.
- **Accessibility**: `aria-label` is set to `prefix + strings.join(", ") + suffix` once, so assistive tech announces the full phrase instead of each character. The cursor span is `aria-hidden`.
- **Double-init guard**: `data-am-typewriter-ready="1"` prevents re-running on HMR or repeated calls.
- **Clamping**: all numeric values (`typingSpeed`, `backSpeed`, `delay`, `backDelay`) are clamped at the JS layer to match the PHP sanitiser ranges.

Example — rotating strings:

```html
<h1 class="am-typewriter"
    data-am-prefix="We "
    data-am-strings="design|code|launch"
    data-am-suffix=" for you!"></h1>
```

## Loop (per-element, opt-in)

Entry modules `fade`, `scale`, `slide-up`, `slide-down`, `slide-left`, `slide-right`, `skew-up`, and `blur` accept three `data-am-*` attributes that hand Motion One's `repeat` options directly to `animate()`:

- `data-am-loop="true"` — enables infinite repeat.
- `data-am-loop-mode="pingpong"` (default) — Motion's `repeatType: 'reverse'`; the animation plays A→B→A→B. Use `"restart"` for `repeatType: 'loop'` (A→B, snap back to A, A→B…).
- `data-am-loop-delay="0.5"` — clamped to `[0, 10]` seconds, pause between iterations.

Implemented in `frontend/src/core/config.js` → `getLoopOptions(el)`, which returns an empty object when loop is disabled so callers can spread it unconditionally:

```js
animate(el, keyframes, { duration, delay, easing, ...getLoopOptions(el) });
```

Opt-in only: default entry-animation semantics (one-shot on scroll-in) are unchanged. Loop is automatically ignored under `prefers-reduced-motion: reduce` because the whole module runtime is skipped via `main.js`.

Not yet wired into: `highlight` (CSS transition), `stagger`, `grid-reveal`, `split`, `text-reveal`, `parallax`, `text-fill-scroll`, `typewriter` (typewriter already has its own richer loop system), `float`, `pulse` (already infinite by design).

## Continuous (Infinite) modules — `float`, `pulse`

Unlike entry modules, `float` and `pulse` start animating on `init()` without any viewport gating and run forever via Motion One's `repeat: Infinity`. They're meant for UI flourishes that should always be visible in motion (hero illustrations, CTA buttons, badges).

- **Float** (`.am-float`): `animate(el, { y: [0, -amplitude, 0] }, { duration, delay, easing, repeat: Infinity })`. Attributes: `data-am-amplitude` (px, default 12, clamp 1..100), `data-am-duration` (cycle length, default 3 s), `data-am-easing` (default `ease-in-out`), `data-am-delay` (initial delay, default 0).
- **Pulse** (`.am-pulse`): `animate(el, { scale: [1, scaleMax, 1] }, { duration, delay, easing, repeat: Infinity })`. Attributes: `data-am-scale-max` (default 1.05, clamp 1..2), `data-am-duration` (cycle length, default 1.5 s), `data-am-easing`, `data-am-delay`.
- **Reduced motion**: both modules short-circuit at init when `matchMedia('(prefers-reduced-motion: reduce)').matches`, so these animations never run for visitors who opt out of motion.
- **No initial-state CSS**: Float and Pulse map to empty strings in `MODULE_INITIAL_CSS` — the element stays visible, since there's no "hidden" state to animate from.
- **Double-init guard**: `data-am-float-init="1"` / `data-am-pulse-init="1"` prevents re-running on HMR.

## Skew Up (entry)

Entry animation in the Stripe / Vercel aesthetic: `animate(el, { opacity: [0, 1], y: [distance, 0], skewY: [skew, 0] })`. Wrapped in `inView()` like the other entry modules. Accepts standard `duration`, `delay`, `easing`, `margin`, plus `data-am-distance` (default 40) and `data-am-skew` (default 5°, clamp -45..45). Loop attributes (`data-am-loop…`) are honored via `getLoopOptions(el)`.

## Grid Reveal (spatial group)

- **Class**: `.am-grid-reveal` on the **container**; animates **direct children** only (`container.children`).
- **Config**: `getElementConfig(container, 'grid-reveal')` — `data-am-origin` on the same container as the class (not on children).
- **Timing**: Children are sorted by distance from the focal point; each gets `delay + rank * staggerDelay` so every item has a unique stagger (wave order preserved).

## Release pipeline

Animicro is built from a single source tree that produces two artefacts: the Free ZIP (published to wordpress.org via SVN) and the Pro ZIP (published as a GitHub Release asset, picked up by Pro installs through the in-dashboard updater).

- **Local build**: `scripts/build.sh` runs `npm run build` and stamps both `build/animicro/` (free) and `build/animicro-pro/` (pro), then zips them into `release/animicro-X.Y.Z.zip` and `release/animicro-pro-X.Y.Z.zip`. The pre-push git hook (`.githooks/pre-push`) re-runs this on every push so the local `release/` always mirrors the latest commit.
- **WP.org SVN release (Free)**: `scripts/release-wp.sh` rsyncs `build/animicro/` into the SVN trunk, commits, then `svn cp trunk tags/VERSION`. Standard WordPress.org flow.
- **GitHub Release (Pro)**: `.github/workflows/release-pro.yml` listens for `v*` tag pushes, rebuilds both ZIPs in CI, extracts the matching `## [VERSION]` section from `CHANGELOG.md` as release notes, and attaches the two ZIPs to a GitHub Release. The Pro plugin's `Animicro_Updater` (built on plugin-update-checker v5.6, vendored under `includes/lib/plugin-update-checker/`) polls the public repo daily and surfaces the new release as the standard WP "Update available" notice in `/wp-admin/plugins.php`.

Distribution and licensing are decoupled by design: the public ZIP is downloadable by anyone, but `Animicro_License_Manager` still gates Pro modules at runtime, so an unlicensed install renders the Pro tab locked exactly as it does today.

Release flow:

```bash
# 1. Bump ANIMICRO_VERSION in animicro.php and "version" in package.json.
# 2. Prepend a "## [X.Y.Z] - YYYY-MM-DD" block to CHANGELOG.md.
# 3. Commit.
git push origin main

# 4. Tag and push — this triggers the GitHub Release.
git tag vX.Y.Z
git push origin vX.Y.Z

# 5. (Free) Publish to wordpress.org SVN when ready.
bash scripts/release-wp.sh
```

The Pro side is fully automated from step 4 onward. Step 5 stays manual because WP.org reviews each release.

## Adding a New Animation Module

1. Create `frontend/src/modules/<name>.js` with `export function init()`.
2. Register in `frontend/src/core/registry.js` MODULES.
3. Add to `MODULE_INITIAL_CSS` in `class-compatibility.php` (initial hidden state).
4. Add to `MODULE_INFO` and `available_modules` in PHP/React.
5. If Pro: set `isPro: true` in MODULE_INFO; add to `PRO_MODULES` in class-license-manager.php.
6. If new settings keys are stored in options: whitelist them in `class-admin.php` `update_settings()` so REST save does not strip fields.
