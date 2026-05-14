# Changelog

All notable changes to Animicro are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.21.0] - 2026-05-13

### Added

- **`cursor` module (Pro)** — custom global cursor that replaces the system cursor. A `<div id="am-cursor">` is injected into `<body>` and follows the mouse with LERP-smoothed `requestAnimationFrame` interpolation. On hover over any element carrying `.am-cursor-expand`, the cursor grows to a configurable size, applies a glassmorphism style (`backdrop-filter: blur(N)px` + semi-transparent background), and optionally shows text from `data-am-cursor-text="View"`.
  - **Class**: `.am-cursor-expand` (the trigger class on hover targets).
  - **Per-element attributes**: `data-am-cursor-text` (string, optional) shown inside the expanded cursor; `data-am-cursor-size` (px, optional) overrides the global hover size for that specific element.
  - **Module-level settings** (admin global):
    - `size` (4..40 px, default 12) — base cursor diameter at rest.
    - `color` (hex, default `#000000`) — base background.
    - `hoverSize` (20..200 px, default 90) — expanded diameter.
    - `hoverColor` (hex, default `#0a0a0a`) — hover background base.
    - `hoverOpacity` (0..1, default 0.75) — alpha applied to hover color. Combined with `hoverBlur` produces glassmorphism.
    - `hoverBlur` (0..30 px, default 8) — `backdrop-filter: blur()` amount. Set to 0 to disable the glass effect.
    - `smoothness` (0.01..1, default 0.15) — per-frame lerp factor. Reuses the existing magnet sanitizer.
- **Mouse Interactions category now has three modules**: magnet (1.15.0, recategorized in 1.20.0), magnetic (1.20.0), cursor (1.21.0). Each operates independently; they can coexist on the same page without conflict.

### Wiring

- Frontend: `frontend/src/modules/cursor.js` (new, ~200 lines) with one global rAF loop, one passive `mousemove` listener, delegated `mouseover` / `mouseout` listeners for hover state, and a debounced `resize` listener that activates/deactivates across the 992px breakpoint. Registry entry in `frontend/src/core/registry.js`.
- PHP: `'cursor'` added to `Animicro::PRO_MODULES`, `available_modules`, and `module_settings` defaults. `Animicro_License_Manager::PRO_MODULES` also lists `'cursor'`. `class-compatibility.php::MODULE_INITIAL_CSS` has an empty entry; the special-case block in `get_editor_css()` emits the critical CSS (the `#am-cursor` element styles + `body.am-cursor-active { cursor: none !important }` + the text-input exception that preserves the I-beam in form fields for usability). `class-admin.php::update_settings()` gained six new sanitizer branches for `size` (clamp 4..40, cast int), `color` (sanitize_hex_color), `hoverSize` (clamp 20..200, cast int), `hoverColor` (sanitize_hex_color), `hoverOpacity` (clamp 0..1), and `hoverBlur` (clamp 0..30, cast int). `smoothness` reuses the magnet/magnetic branch.
- Admin React: `ModuleConfig` extended with `size?`, `color?`, `hoverSize?`, `hoverColor?`, `hoverOpacity?`, `hoverBlur?`. `DEFAULT_CURSOR_CONFIG` and a new `MODULE_INFO` entry under `category: 'mouse'`. `ModuleSettings.tsx` adds seven controls (Base size, Base color, Hover size, Hover color, Hover opacity, Hover blur, Smoothness), reuses the existing `ColorField` component for the two color pickers, and excludes cursor from the generic duration / delay / easing / margin blocks. Two new `DATA_ATTRIBUTES` rows: `data-am-cursor-text` and `data-am-cursor-size`.

### Safety / accessibility

- **`prefers-reduced-motion: reduce`**: `init()` bails out completely — no listeners, no rAF, no overrides to the native cursor. The system cursor stays visible and usable.
- **Touch-only devices** (`(pointer: coarse) AND NOT (pointer: fine)`): cursor never activates. Touch users get the native experience.
- **Screens < 992px**: cursor auto-disables. Reactive: drag the browser window across the breakpoint and the cursor activates / deactivates cleanly (debounced 120ms to avoid thrashing).
- **Builder editors** (Bricks / Elementor / etc.): `main.js::isInBuilder()` short-circuit. No cursor inside the editor preview.
- **Page hidden**: the browser auto-pauses `requestAnimationFrame` while the tab is inactive.
- **Text input usability**: `cursor: none !important` is overridden by `cursor: text !important` for `input[type=text|email|password|search|url|tel|number]` and `textarea`, so the I-beam stays visible inside form fields where users expect it.
- **`pointer-events: none`** on `#am-cursor` so it never intercepts clicks. All form / link interactions pass through normally.
- **`will-change: transform, width, height`** for GPU compositing.

## [1.20.0] - 2026-05-13

### Added

- **`magnetic` module (Pro)** — local pull-to-cursor interaction for buttons, icons and links. When the visitor's pointer enters the configured radius around an element's centre, the element is translated toward the cursor by a percentage of the cursor-to-centre distance. When the cursor exits the radius, the lerp target snaps back to `(0, 0)` and the element drifts elastically home. The classic Awwwards-style "premium feel" interaction.
  - **Class**: `.am-magnetic`.
  - **Per-element attributes**: `data-am-range` (NEW, 20..600 px, default 100 — attraction radius around the element's centre). `data-am-strength` (reuses magnet's sanitizer, 1..100, default 30 — % of distance to pull). `data-am-smoothness` (reuses magnet's, 0.01..1, default 0.15 — lerp factor per frame). `data-am-axis` (reuses magnet's, `x`/`y`/`both`, default `both` — axis lock).
  - **Module-level settings** (admin global): all four fields as defaults.
- **New admin category `mouse` — "Mouse Interactions"** in `MODULE_CATEGORIES`, positioned between `continuous` and `text`. Description: *"Cursor-driven effects: elements that react to mouse position"*. Groups cursor-related modules naturally (current: magnet + magnetic; future candidates: cursor-follower, magnetic-links, etc.).

### Changed

- **Magnet (existing module) moved category** from `continuous` to `mouse`. Zero behavioural changes — same code, same defaults, same data-am-* attributes, same sanitizers. The card just renders under "Mouse Interactions" in the Modules dashboard now instead of "Continuous (Infinite)". Users who already had Magnet activated in pre-1.20 installs find their `active_modules` and `module_settings.magnet` intact after the update — only the visual placement changed.

### Wiring

- Frontend: `frontend/src/modules/magnetic.js` (new, ~150 lines). One global pointermove listener (passive), one rAF loop, scroll + resize listeners to refresh cached `cx`/`cy` per element (avoids `getBoundingClientRect()` per tick). Registry entry in `frontend/src/core/registry.js`.
- PHP: `'magnetic'` added to `Animicro::PRO_MODULES`, `available_modules` (next to `magnet`), and `module_settings` defaults. `Animicro_License_Manager::PRO_MODULES` also lists `'magnetic'`. `class-compatibility.php::MODULE_INITIAL_CSS` has an empty entry (no initial-hide — element starts in its natural position). `class-admin.php::update_settings()` gained ONE new sanitizer branch (`range`, `clamp_float` 20..600); `strength` / `smoothness` / `axis` reuse the magnet sanitizers verbatim.
- Admin React: `ModuleConfig` extended with `range?: number`. `ModuleCategory` type extended with `'mouse'`. `MODULE_CATEGORIES` array gets the new entry. `DEFAULT_MAGNETIC_CONFIG` added; `magnet` MODULE_INFO entry recategorized to `'mouse'`. `ModuleSettings.tsx`: imports `DEFAULT_MAGNETIC_CONFIG`, adds it to the `DEFAULTS` map, renders four magnetic-specific controls (Range, Strength, Smoothness, Axis 3-button), and excludes magnetic from the generic duration / delay / easing / margin blocks. `DATA_ATTRIBUTES` rows updated: `data-am-strength` / `data-am-smoothness` / `data-am-axis` now list both `magnet` and `magnetic` as users; new row for `data-am-range`.

### Safety / accessibility

- **`prefers-reduced-motion: reduce`**: `init()` bails out completely — no listeners, no rAF.
- **Touch-only devices** (`(pointer: coarse) AND NOT (pointer: fine)`): skip. Hybrid laptops with trackpad + touchscreen still get the effect.
- **Builder editors**: `main.js::isInBuilder()` short-circuit.
- **Page hidden**: browser auto-pauses rAF.
- **Init dedup** via `data-am-magnetic-ready="1"`.
- **`pointermove` listener** (passive: true) unifies mouse / pen input. Touch-only is already filtered before the listener is attached.

## [1.19.0] - 2026-05-13

### Added

- **`clip-reveal` module (Pro)** — premium image reveal via `clip-path` animation. The element starts 100% clipped (`clip-path: inset(100%)` via critical inline CSS) and reveals to fully visible when it enters the viewport. Seven shape presets:
  - `curtain-down` (`inset(0 0 100% 0) → inset(0)`) — top to bottom curtain.
  - `curtain-up` (`inset(100% 0 0 0) → inset(0)`) — bottom to top curtain.
  - `curtain-left` (`inset(0 100% 0 0) → inset(0)`) — left to right curtain.
  - `curtain-right` (`inset(0 0 0 100%) → inset(0)`) — right to left curtain.
  - `center-h` (`inset(0 50% 0 50%) → inset(0)`) — vertical line splits sideways.
  - `center-v` (`inset(50% 0 50% 0) → inset(0)`) — horizontal line splits up + down.
  - `circle` (`circle(0% at 50% 50%) → circle(150% at 50% 50%)`) — circle expands from center. The 150% final radius overdraws any rectangle's half-diagonal (max ~71% for a square; wider for extreme aspect ratios), guaranteeing the element ends fully visible.
- **Class**: `.am-clip-reveal`. Works on any element (`<img>`, `<section>`, `<div>`), not only images.
- **API**: per-element `data-am-shape="..."` (one of the seven values; falls back to the global default if invalid). Standard `data-am-duration` (default 0.8s — slightly longer than fade because clip-path looks more cinematic slow), `-easing` (especially `cubic-bezier(0.65, 0, 0.35, 1)` for that premium smooth feel), `-delay`, `-margin` all work via `getElementConfig`.
- **Why critical CSS instead of JS-applied initial state**: keeping `clip-path: inset(100%)` active until Motion's `animate()` writes the first frame means the element stays 100% clipped between init and animation start — no intermediate "sliver visible" flash. Motion's first frame sets the inline `clip-path` to the variant's `from` state (e.g. `inset(0 0 100% 0)`), overriding the critical CSS, and then interpolates to `to`.
- **Two `@media` fallbacks** at the CSS layer guarantee the image stays visible under hostile conditions:
  - `@media (prefers-reduced-motion: reduce) { .am-clip-reveal { clip-path: none !important; } }` — visitor opted out of motion; `main.js` short-circuits before loading modules, so JS never reaches the element. Without this rule the image would stay clipped (invisible) forever.
  - `@media (scripting: none) { .am-clip-reveal { clip-path: none !important; } }` — same logic for JS-disabled environments. Same pattern as page-curtain.

### Wiring

- Frontend: `frontend/src/modules/clip-reveal.js` (new, ~85 lines) with a 7-entry SHAPES table + `init()` doing inView gating + per-element `animate()` call. Registry entry in `frontend/src/core/registry.js`.
- PHP: `'clip-reveal'` added to `Animicro::PRO_MODULES`, `available_modules` (placed in the Media block alongside hover-zoom / img-parallax), and `module_settings` defaults (`shape: 'curtain-down'`, plus the standard duration/easing/delay/margin). `Animicro_License_Manager::PRO_MODULES` also lists `'clip-reveal'`. `class-compatibility.php::MODULE_INITIAL_CSS` carries `'clip-reveal' => 'clip-path:inset(100%);will-change:clip-path;'`, plus a special-case in `get_editor_css()` that emits the three rules (critical + reduced-motion fallback + scripting:none fallback). `class-admin.php::update_settings()` gained one sanitizer branch for `shape` with a 7-value allow-list.
- Admin React: `ModuleConfig` extended with `shape?: string`. `DEFAULT_CLIP_REVEAL_CONFIG` and a new `MODULE_INFO` entry under `category: 'media'`. `ModuleSettings.tsx` adds a Shape select dropdown with three `<optgroup>` sections (Curtain / Center split / Circle) so the 7 options are visually grouped.

### Safety / accessibility

- **`prefers-reduced-motion: reduce`**: `main.js` short-circuits; the `@media` fallback in critical CSS forces `clip-path: none` so the image is fully visible.
- **JS disabled**: `@media (scripting: none)` fallback applies; image stays visible.
- **Builder editors** (Bricks / Elementor / etc.): the frontend selector chain in `class-compatibility.php::get_frontend_selector()` excludes editor body classes, so the critical CSS doesn't apply inside the editor preview — image renders normally.
- **Init dedup**: `data-am-clip-reveal-init="1"` flag per element prevents double-registration.
- **`is-ready` semantic flip**: added synchronously after sanity checks pass, before `inView` fires, so any future CSS rule scoped to `.am-clip-reveal.is-ready` has the same lifecycle as split / text-reveal / scatter.

## [1.18.0] - 2026-05-13

### Added

- **`spin` module (Pro)** — continuous rotation that accelerates momentarily when the visitor scrolls, then decays back to the baseline. The Awwwards-style circular-badge effect. Per-element direction (`data-am-direction="left|right"`) and baseline speed (`data-am-speed`, deg/sec). Default direction / speed / scroll-boost configured globally from the admin panel.
  - **Architecture**: single global `requestAnimationFrame` loop + single global `scroll` listener (passive) + single global `IntersectionObserver`. Only elements currently in (or near) the viewport are ticked each frame; when none are visible, the rAF loop is paused entirely (`rafId = null`) and resumed via `ensureLoop()` when an element re-enters the viewport. CPU cost off-screen ≈ 0.
  - **Why a manual rAF loop instead of Motion's `animate({ repeat: Infinity })`**: Motion can't modulate animation speed per frame from outside the animation; we need `(baseSpeed + scrollVelocity * scrollBoost)` every frame. Same precedent as magnet.
  - **Frame-delta correct**: rotation is computed in degrees-per-**second** scaled by `deltaSec = (now - lastTimestamp) / 1000`, not by a fixed per-frame step. This keeps the visual speed constant under variable frame rates (e.g. 30fps under heavy load still looks the same as 60fps).
  - **Decay**: scroll velocity multiplies by `0.92` each frame (~8%/frame, ~150ms half-life) — the boost dissipates smoothly into the baseline.
  - **Cap**: `scrollVelocity` is capped at `min(dy, 80)` per `scroll` event so a giant programmatic `scrollTo()` doesn't spin the badges wildly.
  - **GPU compositing**: `will-change: transform` applied to each element so per-frame transform writes stay off the main thread.

### Wiring

- Frontend: `frontend/src/modules/spin.js` (new, ~140 lines). Registry entry in `frontend/src/core/registry.js`.
- PHP: `'spin'` added to `Animicro::PRO_MODULES`, `available_modules` (placed inside the "continuous" section), and `module_settings` defaults. Fields are `spinSpeed: 30.0`, `spinDirection: 'right'`, `scrollBoost: 5.0` (plus the standard inert duration/easing/delay/margin). Names are **`spinSpeed`** / **`spinDirection`** (not `speed` / `direction`) on purpose: the existing `speed` REST sanitizer clamps to `-5..5` (parallax) and the existing `direction` sanitizer's allow-list is `fade/slide-up/slide-down` (page-curtain). Using distinct keys avoids silent collisions. `Animicro_License_Manager::PRO_MODULES` also lists `'spin'`. `class-compatibility.php::MODULE_INITIAL_CSS` has an empty entry — no initial-hide rule (element starts in its natural position). `class-admin.php::update_settings()` gained three sanitizer branches: `clamp_float` 1..360 for `spinSpeed`, allow-list (`left`/`right`) for `spinDirection`, `clamp_float` 0..20 for `scrollBoost`.
- Admin React: `ModuleConfig` extended with `spinSpeed? / spinDirection? / scrollBoost?`. `DEFAULT_SPIN_CONFIG` and a new `MODULE_INFO` entry under `category: 'continuous'`. `ModuleSettings.tsx`: three new controls (Speed slider 1–360°/s, Direction 2-button selector CW/CCW with `↻`/`↺` glyphs, Scroll boost slider 0–20). Spin is excluded from the generic duration / delay / easing / margin / distance blocks (all inert for this module). New rows in `DATA_ATTRIBUTES` for `data-am-speed` (extended to include spin's deg/sec semantics) and `data-am-direction` (new row, dedicated to spin's left/right).

### Safety / graceful degradation

- **`prefers-reduced-motion: reduce`**: `init()` bails out completely — no listener, no observer, no rAF. Elements stay in their natural (unrotated) position.
- **Builder editors** (Bricks / Elementor / etc.): `main.js::isInBuilder()` short-circuits before module loading.
- **Page hidden** (tab switched away): the browser pauses `requestAnimationFrame` automatically, so the rotation freezes and resumes seamlessly when the tab comes back. No extra code required.
- **IntersectionObserver fallback**: very old browsers without IO get a "always visible" fallback so they still see the effect.
- **Init dedup**: `data-am-spin-ready="1"` flag per element prevents double-registration if the registry re-runs (HMR, late-injected DOM).
- **Lenis smooth scroll** (existing Pro feature): unaffected — Lenis still emits real `scroll` events that the listener catches.

## [1.17.0] - 2026-05-13

### Added

- **`scramble` module (Pro)** — Matrix/cyberpunk "decoding" text reveal. Each character cycles through random symbols from a hardcoded charset (mix of ASCII glitch + alphanumeric: `!@#$%^&*()_+-=[]{}|;:,.<>?/~0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ`) and locks to its final value left-to-right when the element enters the viewport.
  - **Algorithm**: `init()` captures `textContent` as the source of truth, sets `aria-label` on the parent (so screen readers announce the final phrase once instead of spamming mutations), splits with `[...text]` so multi-codepoint glyphs survive as units, computes `revealAt[i] = nonSpaceIndex(i) * staggerDelay` per non-whitespace character (LTR wave; spaces always show as spaces and never scramble — preserves layout), then ticks every `scrambleSpeed` seconds via `setTimeout`. On each tick: characters past their `revealAt` show their real value, others show a random symbol from `CHARSET`. The loop stops when every character is past its `revealAt`.
  - **Class**: `.am-scramble` (no variant suffix — text-decoding by word doesn't have a sensible visual interpretation).
  - **Per-element attributes** (via `getElementConfig`): `data-am-delay`, `data-am-stagger`, `data-am-margin`.
  - **Module-level settings** (admin panel global, NO per-element overrides — same utility-first pattern as scatter): `scrambleSpeed` (0.02–0.5s, default 0.05s) for the random-char swap rate. The charset is hardcoded and not exposed via UI in v1.

### Wiring

- Frontend: `frontend/src/modules/scramble.js` (new, ~135 lines). Registry entry in `frontend/src/core/registry.js`.
- PHP: `'scramble'` added to `Animicro::PRO_MODULES`, `available_modules`, and `module_settings` defaults (`staggerDelay: 0.04`, `scrambleSpeed: 0.05`; `duration`/`easing` kept as inert keys to satisfy the REST loop shape). `Animicro_License_Manager::PRO_MODULES` lists `'scramble'`. `class-compatibility.php::MODULE_INITIAL_CSS` has a single empty entry — no initial-hide CSS needed because the text starts visible in the DOM and we mutate `textContent` in place. `class-admin.php::update_settings()` REST handler gained one sanitizer branch (`clamp_float` 0.02–0.5 for `scrambleSpeed`); `staggerDelay`/`delay`/`margin` reuse the shared branches.
- Admin React: `ModuleConfig` extended with `scrambleSpeed?: number`. `DEFAULT_SCRAMBLE_CONFIG` and a new `MODULE_INFO` entry under `category: 'text'` in `admin/src/data/modules.ts`. `ModuleSettings.tsx`: `scramble` added to the existing Stagger delay block (with a scramble-specific copy: "controls how fast the decode wave races across"), and a new Scramble speed slider (0.02–0.2s, step 0.01). Duration and easing controls are hidden for this module — they don't apply to a discrete-tick reveal.

### Safety / accessibility

- **`aria-label`** set on the parent at init time so screen readers see the final phrase, not the noise.
- **`prefers-reduced-motion: reduce`**: the module renders the original text immediately, no ticking, no scrambling. Same behaviour as typewriter.
- **Builder editors** (Bricks / Elementor / Breakdance / Oxygen / Divi): `main.js::isInBuilder()` short-circuits before `init()` runs.
- **Init dedup**: `data-am-scramble-ready="1"` flag prevents double-init on hot reload / re-enqueue.
- **Cancel hook**: `el._amScrambleStop()` is exposed for tests / HMR / programmatic control. Sets the cancel flag, clears the pending timeout, and restores the original text in place.
- **Whitespace preservation**: spaces are never scrambled (they always show as the actual space character), which keeps the visual layout stable through the entire reveal and prevents the "swimming" effect of a random character occupying a space position.

## [1.16.0] - 2026-05-13

### Added

- **`scatter` module (Pro)** — random-origin text reveal. `.am-scatter-chars` splits the element's text into per-character spans, `.am-scatter-words` does it per-word. At init time, each span gets an inline `transform: translate(rand_x, rand_y) rotate(rand_deg)` placing it at a random offset from its final position (±radius px on both axes, ±rotateMax degrees). When the parent element enters the viewport (gated by Motion's `inView()` with `cfg.margin`), every span animates back to `(x: 0, y: 0, rotate: 0, opacity: 1)` with a staggered per-span delay (`i * cfg.staggerDelay + cfg.delay`).
  - **Why per-span `animate()` instead of a single collective call**: `split-text.js` can use `animate(spans, ...)` + Motion's `stagger()` because every span shares the same keyframes. Scatter needs DIFFERENT initial transforms per span, so we loop and call `animate()` once per span with manually computed delays. Cost: N calls instead of 1 — trivial for typical text (50–200 spans). Motion manages each as an independent timeline.
  - **Utility-first API by design**: there are NO module-specific `data-am-*` attributes for `radius` or `rotateMax`. Those are configured **globally** from the admin panel and apply to every `.am-scatter-*` element on the site. Same mental model as `.am-fade` / `.am-pulse` / `.am-float`. Per-element `data-am-duration`, `-easing`, `-delay`, `-stagger`, `-margin` still work via the shared `getElementConfig()` API. Rationale: per-element numeric attributes for two physics parameters (radius + rotation) were judged to be more friction than they were worth — most sites only need one scatter "vibe", and the admin panel slider is faster than memorising a clamp range.

### Wiring

- Frontend: `frontend/src/modules/scatter.js` (new, ~95 lines) — copies `splitIntoSpans()` algorithm from `split-text.js` and adds the per-span random-start + lerp-to-final logic. Registry entry in `frontend/src/core/registry.js`.
- PHP: `'scatter'` added to `Animicro::PRO_MODULES`, `available_modules`, and `module_settings` defaults (with `radius: 200.0`, `rotateMax: 45.0`, plus the standard duration/easing/delay/margin/staggerDelay). `Animicro_License_Manager::PRO_MODULES` also lists `'scatter'`. `class-compatibility.php::MODULE_INITIAL_CSS` has new entries for `'scatter-chars'` and `'scatter-words'` (both `opacity:0;will-change:opacity,transform;`), plus a special-case in `get_editor_css()` that emits the four standard rules (.am-scatter-chars, .am-scatter-words, both with `.is-ready` overrides) mirroring the existing split block. `class-admin.php::update_settings()` REST handler gained two sanitizer branches: `clamp_float` 50..500 for `radius`, `clamp_float` 0..90 for `rotateMax`.
- Admin React: `ModuleConfig` extended with `radius?: number; rotateMax?: number;`. `DEFAULT_SCATTER_CONFIG` added to `admin/src/data/modules.ts`, plus a `MODULE_INFO` entry under `category: 'text'` with `cssClass: '.am-scatter-chars .am-scatter-words'`. `ModuleSettings.tsx` adds two new controls (Scatter distance slider 50–500px, Rotation slider 0–90°) and includes `scatter` in the existing Stagger delay block.

### Safety / graceful degradation

- **Pre-set inline transforms before `inView`**: each span's random start state is applied immediately at split time (via `style.transform`), so there's no first-paint flash of un-scattered text. Critical CSS keeps the parent `.am-scatter-*` at `opacity: 0` until JS adds `.is-ready` (which `splitIntoSpans` does synchronously). Each span itself also starts at `opacity: 0` inline.
- **`prefers-reduced-motion: reduce`**: gated upstream by `main.js` — the module's `init()` never runs when the global toggle is on. Net effect: `splitIntoSpans()` doesn't fire, so the text stays in its original (untouched) DOM. No invisible-text risk.
- **Builder editors** (Bricks / Elementor / Breakdance / Oxygen / Divi): never run because `main.js::isInBuilder()` short-circuits before module loading.
- **`aria-label`** is set on the parent element to preserve the original text for screen readers before the DOM is rewritten. Each generated span carries `aria-hidden="true"`. Same accessibility model as `split-text.js`.

## [1.15.0] - 2026-05-13

### Added

- **`magnet` module (Pro)** — `.am-magnet` elements drift smoothly toward the mouse position using LERP interpolation. A single global `requestAnimationFrame` loop ticks every active element each frame, lerping their `currentX/Y` toward a target derived from the mouse offset to the viewport centre. One mousemove listener total regardless of element count.
  - Three module-specific attributes, all per-element-overridable:
    - `data-am-strength` (float `1`–`100`, default `15`): travel distance as a percentage of the mouse-to-centre offset.
    - `data-am-smoothness` (float `0.01`–`1`, default `0.08`): per-frame lerp factor. Lower = more inertia / drag, higher = more snappy.
    - `data-am-axis` (enum `x` / `y` / `both`, default `both`): restrict translation to one axis.
  - Why a manual rAF loop instead of Motion's `animate()`: Motion needs a target known at call time; here the target changes every frame (follows cursor). Same precedent as `parallax` which uses Motion's `scroll()` helper instead of `animate()`.
  - `will-change: transform` applied so each magnet element gets its own compositor layer — keeps the per-frame transform writes off the main thread.

### Safety / graceful degradation

- **Touch-only devices** (`(pointer: coarse)` matches AND `(pointer: fine)` does NOT): the module's `init()` bails out completely — no listener, no rAF. Hybrid laptops with both trackpad and touchscreen still get the effect.
- **`prefers-reduced-motion: reduce`**: double-gated. The global `main.js` short-circuit already prevents `loadModules()` from running when reduced motion is on, and `init()` checks again for defence in depth (no transform writes, element stays where its CSS placed it).
- **Builder editors** (Bricks / Elementor / Breakdance / Oxygen / Divi): never run because `main.js::isInBuilder()` short-circuits before module loading.
- **Single global state**: one `mousemove` listener, one rAF loop, one shared `items[]` array — no per-element timers/listeners, no duplicate inits (`data-am-magnet-init="1"` deduplication flag per element).

### Wiring (where things landed)

- Frontend: `frontend/src/modules/magnet.js` (new, ~120 lines), entry in `frontend/src/core/registry.js`.
- PHP: `'magnet'` added to `Animicro::PRO_MODULES` and `available_modules` in `class-animicro.php`; module settings defaults declared there too (`strength: 15`, `smoothness: 0.08`, `axis: 'both'`). `Animicro_License_Manager::PRO_MODULES` also lists `'magnet'`. `class-compatibility.php::MODULE_INITIAL_CSS` has an empty entry — magnet doesn't need an initial-hide rule (element starts in its natural position). `class-admin.php::update_settings()` REST handler gained three sanitizer branches: `clamp_float` 1–100 for `strength`, `clamp_float` 0.01–1 for `smoothness`, and an allow-list check (`x` / `y` / `both`) for `axis`.
- Admin React: `ModuleConfig` interface extended with `strength?: number; smoothness?: number; axis?: string;`. `admin/src/data/modules.ts` ships `DEFAULT_MAGNET_CONFIG` plus a new `MODULE_INFO` entry under `category: 'continuous'` and three new `DATA_ATTRIBUTES` rows for the cheat sheet. `admin/src/components/ModuleSettings.tsx` renders three new controls (Strength range slider, Smoothness range slider, Axis 3-button selector) and excludes `magnet` from the generic Duration / Delay / Easing / Margin sliders — they're inert for this module.

## [1.14.2] - 2026-05-13

### Added

- **Plugin icon for the WP-admin "Update Plugins" screen** (`assets/icon-128x128.png`). The vendored plugin-update-checker library (PUC v5p6) auto-discovers files in `assets/` matching its naming convention (`icon-128x128.png` / `icon-256x256.png` / `icon.svg` / `banner-*.png`) and injects their URLs into WordPress's `update_plugins` site transient via `setIconsFromLocalAssets()`. WP then renders our logo in `/wp-admin/update-core.php` instead of the generic gray plug placeholder. Zero changes to `class-updater.php` required — the support was already there, we just needed to ship an icon file.
- **`scripts/build.sh::copy_shared()`** now copies the `assets/` directory into both the Free and Pro ZIPs (`cp -r "$ROOT/assets" "$TARGET/assets"`) so the icon actually reaches installed sites. `scripts/build_release_zip.py` already walked the directory by default, no change needed.

### Changed

- **Toolchain migrated from npm to pnpm** (no product changes; build output is byte-equivalent). `package-lock.json` deleted, `pnpm-lock.yaml` committed. `package.json` now pins `packageManager: pnpm@11.1.1` plus `engines: { node: ">=20", pnpm: ">=11" }` and declares `pnpm.onlyBuiltDependencies: ["esbuild"]` so esbuild's postinstall (which downloads its native binary) is allowed under pnpm 11's strict default. A `pnpm-workspace.yaml` was also added with `allowBuilds: { esbuild: true }` for compatibility with pnpm's preferred modern format. CI workflow (`.github/workflows/release-pro.yml`) now uses `pnpm/action-setup@v4` and `pnpm install --frozen-lockfile` / `pnpm run build` instead of npm equivalents. Local hooks (`.githooks/pre-push`), the build script and the Python release script all migrated to `pnpm`. Docs (README.md, docs/animicro.md, docs/release-checklist.md) updated with a "pnpm only — do not use npm/npx" notice.
- **`.distignore`**: `package-lock.json` swapped for `pnpm-lock.yaml`, `.npmrc` added defensively.

## [1.14.1] - 2026-05-12

### Changed

- **Page Curtain — theatre-curtain direction semantics.** Slide-up and slide-down now enter and leave through OPPOSITE sides, matching the real-world metaphor of a stage curtain falling from above to cover the scene and then rising away to reveal the next one. Previous behaviour (both halves moving in the same direction) felt mechanical and repetitive. New keyframes:
  - `slide-up`   — exit: cortina FALLS from above (`y -100% → 0`). entry: cortina RISES upward (`y 0 → -100%`).
  - `slide-down` — exit: cortina RISES from below (`y 100% → 0`).  entry: cortina FALLS downward (`y 0 → 100%`).
  - `fade` is symmetric and unchanged.

### Added

- **Logo picker uses the WordPress media library.** The plain text input for `logoUrl` in the Page Curtain settings has been replaced with a "Select image…" button that opens the standard WP media frame via `window.wp.media()`. Once an image is chosen, the picker shows a thumbnail preview plus "Change" / "Remove" controls. The URL is still shown beneath the preview in monospace so power users can verify what's saved.
  - `Animicro_Admin::enqueue_assets()` now calls `wp_enqueue_media()` on the main settings page (not on the License screen) so the React component can rely on `window.wp.media` being available.
  - `admin/src/types.ts` declares a narrow TypeScript interface for `window.wp.media` covering only the methods we actually call (`on`, `open`, `state().get('selection').first().toJSON()`). Avoids pulling Backbone types into the project.
  - Graceful fallback: if `wp.media` is unavailable for any reason (script error, restricted environment), the picker falls back to `window.prompt()` so the user can still paste a URL by hand.

## [1.14.0] - 2026-05-12

### Added

- **New "Page Transitions" admin tab** (`admin/src/components/PageTransitions.tsx`) with a single new Free module that animates an overlay across navigations. Lives between the Modules tab and Cheat Sheet in the tab navigation. Added to `FREE_MODULES` in `class-license-manager.php` and to `available_modules` + `module_settings` defaults in `class-animicro.php`.
- **`page-curtain` module — symmetric entry + exit transition.** When active, the module does two things:
  - **Entry**: includes/class-frontend.php injects `<div id="am-page-curtain">` via the `wp_body_open` hook before the first paint (covered by critical CSS from `class-compatibility.php`). The JS module animates the overlay OUT once `DOMContentLoaded` fires.
  - **Exit**: the JS module installs a capture-phase document `click` listener. When the visitor clicks an internal link that passes the safety filter (same-origin, no modifier keys, no `target="_blank"`, not a `#anchor`, no `download` attr, no `mailto:`/`tel:`/`sms:`/`javascript:`, no `class="no-curtain"` / `data-no-curtain` opt-out), the module prevents the default navigation, creates a fresh overlay, animates it IN until it covers the viewport, and **only then** does `window.location.href = url`. The new page paints, the entry animation runs, and the cycle continues.
  - Three directions, mirrored between entry and exit so the cortina appears to keep moving in the same direction across the navigation boundary: `fade` (opacity), `slide-up` (cortina rises), `slide-down` (cortina descends).
  - Configurable background color (defaults to `#000000`) and optional logo URL (centered, capped at 200×200).
- **Three new fields on `ModuleConfig`** TypeScript interface: `direction?`, `bgColor?`, `logoUrl?`. New default `DEFAULT_PAGE_CURTAIN_CONFIG` in `admin/src/data/modules.ts`. New module-category value `'page'` added to `ModuleCategory` (intentionally NOT added to `MODULE_CATEGORIES` array — page transitions live in their own tab, the category exists only so `PageTransitions.tsx` can filter `MODULE_INFO`).
- **TabNav**: `'page-transitions'` added to `TabId` union and `TABS` array (between modules and cheatsheet). No Pro gating — the module is Free.

### Safety / graceful degradation

- **Builder editors**: the module detects via the existing URL-detection layer (`?bricks=run`, `?elementor-preview`, etc.) — PHP doesn't output the overlay inside any builder editor, and the JS module's `init()` doesn't run there either. Editor stays clean, no clicks are intercepted.
- **`prefers-reduced-motion: reduce`**: the JS module removes any existing overlay immediately and **never registers the click interceptor** — the visitor gets normal browser navigation, no animation.
- **`@media (scripting: none)`** safety net in the inline CSS hides the curtain if JavaScript is disabled — page stays usable instead of being permanently hidden behind an overlay.
- **`wp_body_open()` missing in old themes**: the JS module falls back to creating the overlay element itself (small initial flash because the page paints once before being covered, but the configured transition still runs).
- **bfcache (browser back button)**: a `pageshow` listener with `event.persisted === true` strips any post-click exit overlay that was cached with the page, so the restored page is immediately usable.
- **Double-click guard**: an `exitInProgress` flag prevents a second click from spawning a second overlay animation while one is already running.
- **Per-link opt-out**: `<a class="no-curtain">` or `<a data-no-curtain>` skips interception — useful for download links, ajax-driven UIs, or anything that wants to stay "instant".
- **Cross-origin links, `target="_blank"`, modifier-key clicks, middle/right clicks**: never intercepted. Default browser behaviour preserved.

### Design notes

- **Replaces what an earlier draft of 1.14.0 shipped as two separate modules** (`page-fade` + `page-curtain`). The `page-fade` module was removed entirely (file deleted, registry entry removed, body_class filter removed, MODULE_INFO entry removed, DEFAULT_PAGE_FADE_CONFIG removed, critical CSS special-case removed) because the symmetric curtain covers both use cases: with `direction: 'fade'` and your site's background color as `bgColor`, you get a fade-in effect on page entry plus a matching fade-out on exit. If the user wants only the entry fade, they can configure it identically and accept that internal navigation also triggers the symmetric exit — that's an explicit design choice, not a bug.
- **Why intercept clicks instead of using the View Transitions API**: VT is Chromium/Safari-only and Firefox is still implementing it (as of 2026-05). A JS-based interceptor works in every modern browser without polyfill or capability detection.
- **Why animate to completion BEFORE navigating**: if we kicked off `window.location.href` in parallel with the animation, the browser would tear down the page mid-animation and the cortina would look choppy. Awaiting `animate(...).finished` first costs `duration` seconds of perceived delay but produces a clean, deliberate motion.

### Notes for future iterations

- View Transitions API enhancement (browser-native cross-fade for Chromium/Safari, falls back to JS for the others) is a potential future addition.
- Persistent overlay across navigations (rather than create-on-click + remove-on-finish) could be a smoother experience on slow connections — but it requires deeper coordination with the new page's first-paint cycle.

## [1.13.0] - 2026-05-07

### Removed

- **"Integrations" admin tab + the underlying `active_builders` setting.** The tab let users multi-select which page builders they used (Elementor / Bricks / Breakdance / Oxygen / Divi / Gutenberg) — supposedly to control which `:not()` exclusions were chained into the inline "hide initially" selector. Investigation surfaced that the toggle had **no observable effect for normal users**: the URL-detection layer (`?bricks=run`, `?elementor-preview`, `?breakdance=builder`, `?ct_builder=true`, `?et_fb=1` in `Animicro_Frontend::is_builder_editor()` and `frontend/src/main.js::isInBuilder()`) already short-circuits the entire CSS injection inside any mainstream builder editor, and on the live frontend none of the editor body classes are present so the `:not()` chain is satisfied regardless of which combination is configured. The toggle changed the *shape* of the selector but never the *outcome* anyone could see.
- **`Animicro_Compatibility::get_available_builders()`** removed (was only consumed by the now-deleted React `Integrations.tsx` component).
- **`active_builders` field from `Animicro::get_default_settings()`** and the legacy `active_builder` (singular, pre-v1.0) → `active_builders` migration in `get_settings()`. Existing `wp_options` rows with `active_builders` set become inert dead data — no active deletion on upgrade, so a hypothetical downgrade to 1.12.x would still find the configured value intact.
- **`'builders'` field from the `animicroData` localized payload** in `Animicro_Admin::enqueue_assets()`.
- **`active_builders` from `AnimicroSettings` and `builders` from `AnimicroData`** TypeScript interfaces. `toggleBuilder` removed from the `useSettings` hook return shape.
- **`'integrations'` from the `TabId` union and `TABS` array** in `admin/src/components/TabNav.tsx`.
- **`admin/src/components/Integrations.tsx`** deleted (~50 lines).

### Changed

- **`Animicro_Compatibility::get_editor_css()` no longer accepts an `$active_builders` parameter.** The selector is now a fixed `body:not(.wp-admin):not(.elementor-editor-active):not(.bricks-is-builder):not(.breakdance):not(.oxygen-builder-body):not(.et_pb_pagebuilder_layout):not(.block-editor-page)` that excludes every known editor at all times. This was the de-facto behaviour for any user who left the toggle empty or on "None" (which was the default).
- **`docs/animicro.md` Builder Compatibility section** rewritten to describe the two-layer protection model (URL detection as primary, body-class exclusion as defense in depth) and the historical context for why the admin toggle is gone.

### Notes

- No frontend animation behaviour changes. CSS classes, `data-am-*` attributes, module loading semantics, easing translation — all identical to 1.12.9.
- For any plugin code that consumed `Animicro_Compatibility::get_editor_css( $modules, $builders )` externally with two arguments: the second argument is now ignored (extra args are tolerated by PHP without error). To future-proof, drop the second arg.

## [1.12.9] - 2026-05-07

### Fixed

- **`parseEasing()` missed the hyphenated forms `back-out`, `back-in`, `back-in-out`, `circ-out`, `circ-in`, `circ-in-out`** introduced as dropdown values in 1.12.8. Side-by-side smoke testing surfaced this immediately — Bounce Out and Snap Out looked identical to Ease Out because both were silently falling back to the default `'easeOut'` after the alias lookup missed. Root cause: when adding the camelCase aliases to the parser in 1.12.7, the hyphenated CSS-style equivalents were only added for `ease-in/out/in-out` (the original 4-option set), and 1.12.8 added new dropdown values without corresponding hyphenated aliases. Fix: extended the aliases map with `back-out → backOut`, `circ-out → circOut`, and the four other hyphenated `circ-*`/`back-*` forms so the parser recognises every shape the dropdown can emit.
- **Visible result**: Bounce Out now actually overshoots past the destination and settles back (the Motion bezier is `[0.33, 1.53, 0.69, 0.99]`, with Y=1.53 giving ~53% overshoot). Snap Out has its sharper deceleration curve as designed (Motion bezier `[0.55, 0, 1, 0.45]`).

## [1.12.8] - 2026-05-07

### Added

- **Three new easing options in the admin dropdown** — palette goes from 4 to 7 curves. The translation layer added in 1.12.7 (`parseEasing` in `frontend/src/core/config.js`) already supported all of Motion's named easings, so this release is purely a UI change in `admin/src/data/modules.ts::EASING_OPTIONS`:
  - **`ease-in`** ("Ease In") — slow start, fast end. Useful for exit-style animations or chained sequences where this element comes after another.
  - **`back-out`** ("Bounce Out") — slight overshoot then settles. Visually distinctive — great for CTAs, badges, notifications. Maps to Motion's `backOut` via `parseEasing`.
  - **`circ-out`** ("Snap Out") — sharper deceleration than `ease-out`, feels modern and snappy. Popular in design system trends (Linear, Vercel-style). Maps to Motion's `circOut`.
- **No changes to existing easing values.** Users with `data-am-easing="ease-out"` or any other current value keep working unchanged.

## [1.12.7] - 2026-05-02

### Fixed

- **Easing curves never applied — latent bug from v1.0 fixed across all animation modules.** The four easing options in the admin dropdown (Ease Out, Ease In Out, Linear, Premium Apple-like cubic-bezier) were producing visually identical animations because two underlying issues stacked:
  1. **Wrong option key**: every module passed `easing: cfg.easing` to Motion's `animate()` call. Motion's API expects `ease:`, not `easing:` — the rename happened during the Motion One → Motion library rebrand, and we never followed. Motion silently ignored the unknown option and fell back to its built-in default ease.
  2. **Wrong values**: even with the correct key, the values we shipped (`'ease-out'`, `'ease-in-out'`, `'cubic-bezier(0.25, 0.4, 0.25, 1)'`) didn't match Motion's accepted strings (`'easeOut'`, `'easeInOut'`, `[0.25, 0.4, 0.25, 1]` array). Only `'linear'` matched by coincidence.
- **Fix**: new `parseEasing()` helper in `frontend/src/core/config.js` translates user-facing CSS-style strings + camelCase aliases + `cubic-bezier(a, b, c, d)` strings into Motion's accepted shapes. Applied at the boundary in `getElementConfig()` so all 13 modules using the shared config get correct easing automatically. Three modules (`float`, `pulse`, `hover-zoom`) read `el.dataset.amEasing` directly and now import + apply `parseEasing` themselves. Renamed the `easing:` property → `ease:` at every `animate()` call site (15 call sites across 15 module files).
- **`highlight` not affected**: it pipes the easing string into a CSS custom property consumed by a CSS `transition` rule, and CSS natively accepts `'ease-out'`, `'ease-in-out'`, `'linear'`, `'cubic-bezier(...)'`. Highlight has been working correctly the whole time.
- **`typewriter` not affected**: doesn't use Motion easing (uses `setTimeout` for character-by-character timing).
- **Backwards compatibility**: any user with `data-am-easing="ease-out"` (or any other CSS-style value) in their existing markup keeps working — the translator accepts CSS-style aliases as input. The dropdown values in the admin UI are unchanged.

### Notes

- **Visual change on existing installs is intentional and expected.** Before 1.12.7, every animation used Motion's built-in default ease (closest to `'easeInOut'`) regardless of what users picked. After 1.12.7, animations actually use the configured easing. Most settings will look subtly different; the cubic-bezier "Premium (Apple-like)" curve in particular is now noticeably smoother because it never applied at all before. If users prefer the previous look, picking `'ease-in-out'` in the admin gets them closest to the old default.
- New PUBLIC export: `parseEasing(input)` from `frontend/src/core/config.js`. Used by `float`/`pulse`/`hover-zoom` and reusable by any future module that reads `el.dataset.amEasing` directly without going through `getElementConfig()`.

## [1.12.6] - 2026-05-02

### Changed

- **Motion upgraded from `^11.18.0` → `^12.37.0`** (resolved to **12.38.0** at install time). 12 months of upstream patches accumulated since the original 11.18.x pin in early 2025. Audit before bumping confirmed:
  - The only breaking change in Motion 12.0 affects gesture callback signatures — `inView`, `press`, and `hover` callbacks now receive the target element as the first argument. Animicro uses `inView` in 11 modules (fade, scale, slide-*, skew-up, blur, stagger, grid-reveal, split-text, text-reveal, highlight, typewriter), but **all 11 call sites already ignore the callback arguments** (`() => { … }`), so the change is a no-op for us.
  - `animate()`, `scroll()`, `stagger()` API surface unchanged.
  - Easing strings (`'ease-out'`, `'linear'`, etc.) unchanged.
- **Bundle size delta**: the main Motion chunk grew from 19.59 KB → 22.11 KB gzipped (+~2.5 KB / +13%). Per-module chunks unchanged. Net cost: ~3 KB extra on every page-load that uses Animicro animations. Acceptable trade for the upstream improvements; relevant scroll-linked modules (`parallax`, `img-parallax`, `text-fill-scroll`) get hardware-accelerated `start`/`end` offsets, which should compensate at runtime.

### Notes

- No API changes. CSS classes, `data-am-*` attributes, and module-loading semantics are identical.
- The Motion upgrade was a `package.json` caret bump only — no code changes were needed in `frontend/src/`.

## [1.12.5] - 2026-05-02

### Changed

- **Pro — Plugin deactivation now clears the local connection.** `Animicro::deactivate()` calls `Animicro_License_Manager::clear_connection()` (delete `connection_id`, `connection_secret`, `license_data`, validation transients, deactivate premium). Matches the LicenSuite v4 doc recommendation and the prior art of Bricks / WP Rocket / Elementor. The previous behaviour (just set a transient that fired a "go to dashboard to revoke" notice) was mostly inert — the transient could only be consumed if the user re-activated the plugin, which is the wrong moment for the message. The seat stays listed under "Connected sites" in the user's LicenSuite dashboard until they revoke it manually with one click; the plugin no longer pretends to manage that side of the lifecycle.
- **Pro — `docs/WORDPRESS_INTEGRATION.md` synced with the upstream LicenSuite v4 final release.** The doc now correctly states that `/plugin-validate` requires `Authorization: Bearer <SUPABASE_ANON_KEY>` (Supabase JWT layer) plus `connection_id` + `connection_secret` in the request body. Resolves the v3 doc contradiction that caused the 1.12.0 → 1.12.3 auth bug.
- **Pro — `docs/licensing.md` rewritten** for v4 + added "How we discovered the auth flow" sidebar with the live `curl` probes that surfaced the bug. Consolidated §7.1 (deactivation behaviour) with the new clear-on-deactivate pattern.
- **Pro — `docs/animicro.md`** Pro Licence section tightened: removed the "auto-revoke deferred" note (no longer relevant — the LicenSuite recommendation is "don't auto-revoke, clean locally").

### Removed

- **Pro — Migration scaffolding for v1.11.x → v1.12.x.** Confirmed with the operator that no Pro sites exist on the legacy paste-the-key flow, so the dead code can go: `Animicro_License_Manager::is_pending_reconnect()`, the `animicro_pending_reconnect` option, the `animicro_license_key` legacy detection, the `pending_reconnect` payload branch in `validate_connection()`, the `pending_reconnect` reason from `get_error_message()`, the `pending_reconnect` field from the `/license/status` REST payload, the `PendingReconnectCard` React component (~35 lines), and the `'pending_reconnect'` literal from `LicenseStatus.state`. The defensive `delete_option( 'animicro_license_key' )` and `delete_option( 'animicro_pending_reconnect' )` calls inside `persist_connection()` and `uninstall.php` stay — cheap insurance against any rogue dev install that still has those rows.
- **Pro — Stale "auto-revoke pending" follow-up note** removed from `docs/animicro.md` and `docs/licensing.md`.

## [1.12.4] - 2026-05-02

### Fixed

- **Pro — `/plugin-validate` requests were being silently rejected by Supabase's JWT layer.** Symptom: a successful Connect created the row in LicenSuite (the dashboard showed the connected site), the plugin's License page showed "License active, Plan: PRO" (rendered from the `/exchange` payload), but the modules grid kept Pro features locked indefinitely and the LicenSuite "Last check" column stayed at `Never`. Live tested with `curl`:
  - Sending `Authorization: Bearer <connection_secret>` (what the v3 doc's code example showed) → HTTP 401 `UNAUTHORIZED_INVALID_JWT_FORMAT`. The Edge Function never ran. The connection_secret is not a JWT.
  - Sending `Authorization: Bearer <SUPABASE_ANON_KEY>` (what the same doc's §URLs section actually said) → HTTP 200, function executes.
  - Fix: send the public Supabase anon key in `Authorization` to satisfy JWT verification, and move the per-site `connection_secret` into the request body alongside `connection_id` so the function can do its own auth after Supabase clears the request.
- **`is_premium()` now serves cached state instead of treating a transient network failure as "not premium".** Combined with the auth fix above, a single failing `/plugin-validate` round-trip no longer locks Pro features — `validate_connection()` already serves the last known good state on `WP_Error`; this commit ensures `is_premium()` honours that fallback.

### Added

- **`invalid_connection_id` reason added to the recoverable-error list.** Treated like `revoked_or_not_found`: the plugin clears credentials so the user can reconnect cleanly. Translated user-facing message included in `get_error_message()`.
- **Hardcoded Supabase anon key** in `class-license-manager.php` (with `ANIMICRO_SUPABASE_ANON_KEY` constant + `animicro_supabase_anon_key` filter overrides for forks). The build-time injection (`__ANIMICRO_SUPABASE_ANON_KEY__` placeholder + `sed` swap + `ANIMICRO_SUPABASE_ANON_KEY` GH secret) was overengineering for a value that is public by design — the LicenSuite frontend itself embeds the same key in every page-load. Rotation, when needed, will go through a regular plugin release like any other source change.

### Removed

- The build-time anon-key injection block had already been deleted in 1.12.0; this release keeps it gone. `scripts/build.sh`, `.github/workflows/release-pro.yml` and `.githooks/pre-push` all stay free of the anon-key requirement.

## [1.12.3] - 2026-04-29

### Fixed

- **Pro — License page showed "active" but Pro modules stayed locked.** Two-bug compound:
  1. **`is_premium()` short-circuited on a stored boolean.** The static check read the `animicro_premium_active` option as a hot-path guard and returned `false` if it was `false`, never reaching the live validation. Any path that briefly set the flag to `false` (a 1.11.x → 1.12.x migration with corrupt cached data, a disconnect mid-pageload, etc.) left the plugin permanently locked even after the underlying connection became healthy. Refactored to always derive the answer from current state: `is_pending_reconnect()` → `has_connection() / is_dev_mode()` → `validate_connection()` (uses the daily transient, no extra round-trip in the hot path) → `is_premium_slug()`. The stored flag is still kept in sync via `activate_premium()` / `deactivate_premium()` for any external code that introspects it.
  2. **`validate_connection()` success branch required `reason === 'ok'`.** LicenSuite v4 doesn't always echo the `reason` field on success, so the gate was failing silently and `activate_premium()` was never called even when the licence was perfectly valid. Now only requires `valid: true`.

### Added

- **`animicro_premium_plan_slugs` filter** for operators with custom dashboard plans. Default list: `['pro', 'basic', 'agency', 'enterprise']`. To extend:
  ```php
  add_filter( 'animicro_premium_plan_slugs', function ( $slugs ) {
      $slugs[] = 'studio';
      return $slugs;
  } );
  ```
  Backed by a new `Animicro_License_Manager::is_premium_slug( ?string $slug ): bool` static helper, used at every gating site.

## [1.12.2] - 2026-04-29

### Changed

- **Pro — Adopted LicenSuite v4.0 rich plan shape end-to-end.** The previous 1.12.1 hotfix flattened the v4 `plan` object (`{ slug, name, max_sites, sort_order }`) down to just the slug string and uppercased it for display. That worked but threw away the operator-configured display `name`. 1.12.2 keeps the rich shape:
  - **PHP `normalize_payload()`** now produces the canonical `plan: { slug, name, max_sites }` object regardless of input shape (legacy v3 string `"pro"` is wrapped to `{ slug: 'pro', name: 'Pro', max_sites: null }`; v4 objects are passed through with type-safe coercion).
  - **`Animicro_License_Manager::plan_slug()`** new public static helper that pulls the slug from any plan shape (legacy string, v4 object, null) — used by every gating site (`is_premium()`, the `/plugin-validate` post-processing branch).
  - **React `formatPlanLabel()`** now prefers `plan.name` (the operator-configured display string from the dashboard, e.g. "Agency", "Enterprise 50 sites") over the slug uppercased. Falls back to title-cased slug, then plain "Pro".
  - **`LicenseStatus.plan` typed** as `{ slug, name, max_sites } | string | null` to mirror the canonical shape while keeping the legacy-string fallback path.
- **Dev mode payload** updated to the new shape: `plan: { slug: 'pro', name: 'Pro (Dev)', max_sites: null }`.

This is purely additive over 1.12.1 — both releases prevent the original `plan.toUpperCase` crash; 1.12.2 also surfaces nicer plan names in the UI.

## [1.12.1] - 2026-04-29

### Fixed

- **Pro — License page crashed (blank screen) right after Connect.** The LicenSuite v3 server returns the `plan` field as a rich object (`{ slug, name, id }`) instead of the plain string the 1.12.0 React code assumed, so `status.plan.toUpperCase()` threw `TypeError: s.plan.toUpperCase is not a function` and the whole admin chrome went white. Two-layer fix:
  - **PHP**: new `Animicro_License_Manager::normalize_payload()` coerces `plan` to a string (preferring `slug`, then `name`, then `id`), `expires_at` to an ISO string or null, and `sites` to `{ used:int, max:int|null, unlimited:bool }`. Applied at every persist point (`handle_callback()` after `/exchange` and `validate_connection()` after `/plugin-validate`).
  - **TypeScript**: `LicensePage.tsx` gains a `formatPlanLabel()` helper that gracefully handles strings, `{ slug | name | id }` objects, and any other shape — no more crashes regardless of what the server returns. `LicenseStatus.plan` typed as `string | { slug?, name?, id? } | null` to mirror reality.

## [1.12.0] - 2026-04-29

### Changed

- **Pro — Migrated to LicenSuite v3.0 Connect flow.** The licence backend dropped the v2 paste-the-key model (where users had to copy a `XXXX-XXXX-…` string into a textbox) in favour of an OAuth-style Connect flow modeled after Elementor Pro / WP Rocket. The user clicks **Connect** in the Animicro Pro license page, the LicenSuite dashboard opens in a new tab, they log in (with 2FA if enabled), pick the license to bind to this site, and the dashboard redirects back with a one-time `token`. The plugin exchanges that token for a long-lived `connection_id + connection_secret` pair (both encrypted at rest) and validates daily against `POST /functions/v1/plugin-validate` using the secret as the Bearer token. No license keys ever touch the WordPress UI.
- **`includes/class-license-manager.php`** rewritten end-to-end. New methods: `get_connect_url()`, `handle_callback()`, `validate_connection()`, `clear_connection()`, `is_pending_reconnect()`. Same shape preserved for the rest of the plugin: `is_premium()`, `is_pro_module()`, `activate_premium()`/`deactivate_premium()`, encryption helpers, `is_development_domain()` filter (still bypasses the network call on `localhost` / `*.local` / `*.test` / private IPs).
- **`includes/class-admin.php`** REST routes: dropped `POST /license/save` (no more pasting); added `GET /license/connect-url` (returns the dashboard URL the React UI opens) and `POST /license/disconnect` (clears local credentials). `GET /license/status` payload now returns `{ state, is_premium, is_dev, pending_reconnect, has_connection, connection_id, plan, expires_at, sites, connect_error }`. New `admin_init` handler `maybe_handle_connect_callback()` catches the dashboard redirect (`?page=animicro-license&action=connect-callback&token=…&state=…`), verifies the WP nonce, runs the token-for-secret exchange, and redirects to a clean license page.
- **`admin/src/components/LicensePage.tsx`** rewritten as a four-state machine: `dev` (local-development unlocked card), `pending_reconnect` (orange "Reconnect required" banner for legacy v1.11.x users), `connected` (green status card with plan, expires, sites), `disconnected` (primary "Connect to your account" button).
- **Build pipeline cleanup.** The build no longer needs an anon-key placeholder. `scripts/build.sh` drops the `__ANIMICRO_SUPABASE_ANON_KEY__` swap and the `.env.build` requirement. `.github/workflows/release-pro.yml` drops the `ANIMICRO_SUPABASE_ANON_KEY` secret. `.githooks/pre-push` no longer fails when `.env.build` is missing.

### Added

- **Migration banner for 1.11.x users.** On the first admin pageload after upgrading, the plugin detects a leftover `animicro_license_key` option and an absent `animicro_connection_id`, sets the `animicro_pending_reconnect` flag, and locks Pro features until the user clicks the orange Reconnect button. Once the new flow completes, the legacy key option is wiped and Pro reactivates.
- **Deactivation reminder notice.** Because LicenSuite v3 does not yet expose a public `plugin-self-revoke` endpoint that accepts the connection_secret, the plugin cannot release the seat on the server when the user deactivates the plugin. Instead, a dismissible info notice appears on the next admin pageload telling the user to revoke the connection from their LicenSuite dashboard if they want to free the seat. Will be replaced with a real auto-revoke call in a follow-up patch when the upstream endpoint ships.

### Removed

- **`POST /license/save` REST route** and the `save_license()` handler. Replaced by the Connect flow.
- **`save_license_key()`, `validate_license()`, `deactivate_license()`** in `Animicro_License_Manager` (v2-only methods).
- **`__ANIMICRO_SUPABASE_ANON_KEY__` placeholder + build-time injection.** v3 does not need a build-time secret.
- **`licenseKey` field from `animicroData`** localized object — the React admin no longer needs the stored key for any UI state.

### Migration

For users upgrading from 1.11.x: open `wp-admin/admin.php?page=animicro-license`. You will see an orange "Reconnect required" banner. Click **Reconnect now** — your LicenSuite dashboard opens in a new tab. Log in, pick the license already associated with your account, and you'll be redirected back to this site with the new connection live. Total time: ~30 seconds. Your existing license stays valid; the migration is purely about the connection mechanism.

## [1.11.3] - 2026-04-29

### Changed

- **Suppress third-party admin notices on Animicro screens.** WordPress fires `admin_notices`, `all_admin_notices`, `user_admin_notices` and `network_admin_notices` on every backend page, which means SEO plugins (Slim SEO, Yoast, Rank Math), security tools, cache plugins, etc. inject their banners into our React admin chrome and break the layout. Plugins like ASE intercept some of these but not all (Slim SEO, for instance, uses a custom rendering path that ASE misses). New `Animicro_Admin::suppress_admin_notices()` runs on `in_admin_header` (priority 1, after `current_screen` is set, before WP starts firing the queue) and calls `remove_all_actions()` on the four notice hooks when the current screen is one of ours (`toplevel_page_animicro` or `animicro_page_animicro-license`). Visitors keep seeing those notices everywhere else in `/wp-admin/`. Standard practice in Bricks, Elementor, ACF Pro, Yoast Premium, etc.

## [1.11.2] - 2026-04-28

### Added

- **Pro — Auto-updates from GitHub Releases.** New `includes/class-updater.php` wraps [YahnisElsts/plugin-update-checker](https://github.com/YahnisElsts/plugin-update-checker) v5.6 (vendored under `includes/lib/plugin-update-checker/`, MIT). The Pro plugin now polls the public `infojorgeml/animicro` repo once per day, picks up newer GitHub Releases tagged `v*`, and surfaces them as the standard WordPress "Update available" notice in `/wp-admin/plugins.php`. Click → WP downloads the matching `animicro-pro-X.Y.Z.zip` asset and installs it like any other plugin. Licence and update flows are intentionally decoupled — distribution is open, runtime gating still happens via `Animicro_License_Manager`.
- **GitHub Actions — `release-pro.yml`.** New workflow triggers on `v*` tag pushes: installs deps, runs `npm run build`, runs `scripts/build.sh` (same Free + Pro ZIP builder used by the local pre-push hook), extracts the matching `## [VERSION]` section from `CHANGELOG.md` as release notes, and publishes a GitHub Release with both ZIPs attached. Free still ships through wordpress.org SVN — this workflow does not touch SVN.

### Changed

- **`scripts/build.sh`** — Pro build now copies `includes/class-updater.php` and `includes/lib/plugin-update-checker/` into `build/animicro-pro/`. Free build still excludes both (the shared `copy_shared` helper has never copied them).
- **`scripts/build_release_zip.py`** — explicitly skips `includes/class-updater.php` and `includes/lib/plugin-update-checker/` when generating the WP.org Free ZIP.
- **`animicro.php`** — when `ANIMICRO_PRO === true`, requires `class-updater.php` and calls `Animicro_Updater::init( __FILE__ )`. Guarded by `is_readable()` so a misbuilt Pro ZIP without the library never breaks WP admin.

## [1.11.1] - 2026-04-28

### Changed

- **Pro — License manager updated for LicenSuite v2.0.0.** The licensing backend introduced multi-site licensing and a new `/license-deactivate` endpoint. `includes/class-license-manager.php` now:
  - Calls `/license-deactivate` on plugin deactivation (`Animicro::deactivate()`) and uninstall (`uninstall.php`) so the seat is released automatically and the user can move the licence to another site without contacting support. Fire-and-forget, never blocks the WP flow.
  - Releases the previous seat when the user pastes a new licence key in `save_license_key()` (blocking, best-effort).
  - Persists the v2 payload (`sites.used`, `sites.max`, `sites.unlimited`, `expires_at`) in `animicro_license_data` for `limit_reached` / `expired` / `disabled` / `product_mismatch` responses, instead of stripping the response down to a generic invalid.
  - Handles HTTP 429 → `rate_limited` and the new v2 reasons (`limit_reached`, `reserved_domain`, `invalid_license_format`, `invalid_product_format`, `invalid_domain`) with translated user-facing messages.

### Added

- **Pro — Local development bypass.** `Animicro_License_Manager::is_development_domain()` mirrors LicenSuite's reserved-domain rule (`localhost`, `::1`, `*.local`, `*.test`, `*.localhost`, `*.invalid`, `*.example`, IPv4 in `127.x` / `10.x` / `192.168.x` / `172.16-31.x`) and short-circuits `validate_license()` on those hosts: no network call, no seat consumed, full Pro feature unlock locally. Override via the `animicro_is_development_domain` filter for unusual setups (custom dev TLDs, public staging that should still validate normally, etc.).

### Fixed

- **Pro — `reserved_domain` no longer blocks development.** Before this release, working on a Pro plugin from `localhost` returned a hard `reserved_domain` error from the v2 server and disabled all Pro modules. The new bypass restores the previous developer experience without exposing a server-side workaround.

## [1.11.0] - 2026-04-24

### Added

- **New Free module: Zoom Hover (`.am-hover-zoom`).** Hover-driven utility animation. On `mouseenter` the element scales from `1` to `data-am-zoom-scale` (default `1.08`, clamp 1.01–2.0) and reverts on `mouseleave`. Designed for images inside service grids, blog cards and portfolio tiles. The parent must have `overflow: hidden` so the zoom stays clipped to the card frame — that's a builder-side concern, not injected by the module. Honors `prefers-reduced-motion: reduce` by attaching no listeners.
- **New Pro module: Image Parallax (`.am-img-parallax`).** "Window effect": the element box itself doesn't move — only the inner `<img>` (or first child) translates vertically inside its `overflow: hidden` frame as the container traverses the viewport. Driven by Motion One's `scroll()`. Tunable via `data-am-speed` (default `0.2`). More subtle than the existing `.am-parallax`, which moves the entire element box.
- **New admin category: Media & Images.** Added to `MODULE_CATEGORIES` in `admin/src/data/modules.ts`. Both new modules live here. The Modules dashboard now shows 6 categories.

### Changed

- `frontend/src/core/registry.js` — registered both new dynamic loaders.
- `frontend/src/style.css` — added `.am-hover-zoom` and `.am-img-parallax` to the base visibility, `prefers-reduced-motion`, and `scripting: none` selector lists for consistency.
- `includes/class-animicro.php` — added defaults for both modules + extended `available_modules` and `PRO_MODULES`.
- `includes/class-license-manager.php` — added `hover-zoom` to `FREE_MODULES`, `img-parallax` to `PRO_MODULES`.
- `includes/class-admin.php` — added `zoomScale` sanitization (clamp 1.01–2.0) in `update_settings()`.
- `admin/src/components/ModuleSettings.tsx` and `AnimationPreview.tsx` — added settings sliders and live previews.

## [1.10.3] - 2026-04-24

### Changed

- **Pro Cheat Sheet — deduplicated `data-am-loop` row.** `admin/src/data/modules.ts::DATA_ATTRIBUTES` previously had two entries for `data-am-loop` with different defaults (`false` for fade/scale/slide-*/blur, `true` for typewriter), which rendered as two contradictory rows in the Pro Cheat Sheet table. Merged into a single row with `defaultValue: 'false (true for typewriter)'` and a disambiguated `usedBy` string.

### Removed

- **Vestigial dedup Set in `frontend/src/core/registry.js`.** The `loaded` Set and surrounding `if (loaded.has(key)) ... else ...` branches both called `mod.init(name)` identically — browsers already cache resolved dynamic imports, so the manual dedup was a no-op. Simplified to a plain `await loader(); mod.init(name)` loop. Net effect: entry bundle `main.js` shrunk from 4.84 kB to 4.78 kB.

### Fixed

- **Consistency — `.am-parallax` added to the base visibility selector in `frontend/src/style.css`.** The "make visible in editors / no-JS fallback" block listed every module class except `.am-parallax`. No visual impact (parallax never gets `opacity: 0` injected via `MODULE_INITIAL_CSS`), but the omission was inconsistent with the other 17 modules.

## [1.10.2] - 2026-04-24

### Fixed

- **Text Reveal (Pro) — web-font cold-load correctness.** `frontend/src/modules/text-reveal.js` relied on `offsetTop` to split text into lines, but `main.js` runs at `DOMContentLoaded`, which fires before custom web fonts finish loading. On cold loads with Google Fonts / self-hosted fonts, the fallback-font metrics made every word collapse onto a single line, breaking the reveal. The module now waits for `document.fonts.ready` before splitting (with a direct fallback when the Font Loading API is unavailable). No API change.

### Security

- **Text Fill on Scroll (Pro) — XSS hardening.** `frontend/src/modules/text-fill-scroll.js` previously built its per-word wrappers by interpolating the element's `innerText` directly into an `innerHTML` template. Although `innerText` returns rendered plain text (not raw HTML), any visible text containing HTML-like characters — potentially introduced by bypassed-sanitization plugins, custom shortcodes, or meta fields — would be re-parsed as markup on injection. The module now constructs the wrapper/base/fill spans via `document.createElement` + `textContent`, eliminating the injection path entirely. No DOM shape change, no behavior change for well-formed content.

## [1.10.1] - 2026-04-24

### Fixed

- **Accessibility — reduced-motion visibility regression.** When the admin enabled **Advanced → Respect Reduced Motion** and the visitor preferred reduced motion, `frontend/src/main.js` short-circuited the module pipeline but the inline PHP CSS from `class-compatibility.php::MODULE_INITIAL_CSS` kept `.am-fade`, `.am-slide-*`, `.am-skew-up`, `.am-scale`, `.am-blur` at `opacity:0` / translated. Result: elements stayed invisible forever for those visitors. The `@media (prefers-reduced-motion: reduce)` block in `frontend/src/style.css` now forces `opacity: 1 !important; transform: none !important; filter: none !important;` on the same selector list — mirroring the already-correct `@media (scripting: none)` block. Motion One's JS-driven animations are still the active path when the admin toggle is off, so this fix is scoped to the opt-in reduced-motion short-circuit.

### Changed

- **Copy** — Slide Left / Slide Right descriptions rephrased from "Slides in from the right/left" to "Slides in toward the left/right (from the right/left edge)" across `admin/src/data/modules.ts`, `README.md`, `free/readme.txt`. Class names unchanged; no API change.

### Removed

- **Dead code in `frontend/src/modules/skew-up.js`** — replaced `const distance = cfg.distance != null ? cfg.distance : 40;` with `const distance = cfg.distance;`. `getElementConfig` always returns a number, so the fallback branch never fired. Runtime defaults remain server-driven via `window.animicroFrontData.moduleSettings['skew-up'].distance`.

## [1.10.0] - 2026-04-23

### Added

- **New Free module: Skew Up (`.am-skew-up`)** — Entry animation that slides up (`y: [40, 0]`) combined with a starting vertical skew (`skewY: [5, 0]`) that straightens as the element settles. Stripe / Vercel-style. Supports the standard duration/delay/easing/margin/loop attributes plus new `data-am-distance` (default 40) and `data-am-skew` (default 5°, clamp -45..45).
- **New admin category: Continuous (Infinite)** — Separates entry animations (one-shot on viewport-enter) from infinite loops. Added to `MODULE_CATEGORIES` between `entry` and `text`.
- **New Free module: Float (`.am-float`)** — Infinite soft up/down floating motion driven by Motion One's `repeat: Infinity`. For 3D illustrations, icons, hero art. Attributes: `data-am-amplitude` (default 12 px, clamp 1..100) and `data-am-duration` (cycle length, default 3 s).
- **New Free module: Pulse (`.am-pulse`)** — Infinite gentle scale pulse (`1 ↔ 1.05`). For badges, CTAs, WhatsApp-style buttons. Attributes: `data-am-scale-max` (default 1.05, clamp 1..2) and `data-am-duration` (cycle length, default 1.5 s).

### Notes

- Float and Pulse short-circuit under `prefers-reduced-motion: reduce` — they do not animate at all for visitors who opt out of motion. Skew Up inherits the global reduced-motion gate applied to entry animations.
- Float and Pulse do not wrap in `inView()` — they begin animating on module init and continue until the page is unloaded.
- PHP gating unchanged except for `FREE_MODULES` addition of `float`, `pulse`, `skew-up` and `available_modules` list in `class-animicro.php`. `PRO_MODULES` is unchanged.

## [1.9.0] - 2026-04-24

### Added

- **Slide Left and Slide Right promoted to the Free tier** — `.am-slide-left` and `.am-slide-right` are no longer gated behind Animicro Pro. Free users now get the full set of four entry directions (up / down / left / right) out of the box. Removed from `Animicro_License_Manager::PRO_MODULES` and `Animicro::PRO_MODULES`; added to `FREE_MODULES`. Admin `MODULE_INFO` flips `isPro: false` for both entries. No runtime changes — module code is unchanged.

## [1.8.0] - 2026-04-23

### Added

- **Loop on entry animations (opt-in)** — `fade`, `scale`, `slide-up`, `slide-down`, `slide-left`, `slide-right` and `blur` now support three new per-element attributes: `data-am-loop="true"` to enable, `data-am-loop-mode="pingpong"` (default, plays A→B→A→B) or `"restart"` (A→B, snap, A→B…), and `data-am-loop-delay` (0–10 s, pause between iterations). Powered by Motion One's native `repeat` / `repeatType` / `repeatDelay` options — zero runtime cost when disabled.
- **`getLoopOptions(el)` helper** in `frontend/src/core/config.js` — returns `{ repeat, repeatType, repeatDelay }` or an empty object when loop is off, so modules can spread it unconditionally into the `animate()` options.

### Notes

- Opt-in only: default entry-animation semantics (one-shot on scroll-in) are unchanged.
- Automatically skipped under `prefers-reduced-motion: reduce` (the entire runtime is already guarded upstream in `main.js`).
- Not wired into `highlight` (CSS transition), `stagger`, `grid-reveal`, `split`, `text-reveal`, `parallax`, or `text-fill-scroll` in this release — each has a different animation pattern and will be evaluated module-by-module. `typewriter` already has its own richer loop system (1.7).

## [1.7.0] - 2026-04-20

### Added

- **Typewriter rotating strings** — New `data-am-strings` attribute accepts either a pipe-separated list (`"design|code|launch"`) or a JSON array (`'["design","code","launch"]'`, for strings that contain a literal `|`). The module types each string, holds, deletes, and moves on to the next — the classic "We're good at: design / code / launch" landing-page pattern. `data-am-prefix` and `data-am-suffix` wrap static text around the rotating word.
- **Typewriter controls** — New module settings and `data-am-*` attributes: `backSpeed` / `data-am-back-speed` (deletion speed), `backDelay` / `data-am-back-delay` (hold before deleting), `loop` / `data-am-loop`, `shuffle` / `data-am-shuffle`, `cursorChar` (admin-wide default for the cursor character), `cursorPersist` / `data-am-cursor-persist`. All clamped and sanitised at the JS and PHP layers.
- **Typewriter admin panel** — 4 sliders (type speed, back speed, start delay, back delay), 3 toggles (loop, shuffle, cursor persist), a cursor-character text input, and a copy-paste HTML callout with example attributes. Live preview demos the rotating "We design / code / launch for you!" pattern as sliders move.

### Changed

- **Breaking: Typewriter cursor persists by default** — Previously the cursor faded out ~600 ms after the last character. It now stays blinking indefinitely (the signature typewriter look). To restore the 1.6 fade-out behaviour, add `data-am-cursor-persist="false"` on the element, or disable the "Cursor stays after typing" toggle in the admin panel.
- **Typewriter accessibility** — `aria-label` now exposes the full phrase `prefix + strings.join(", ") + suffix`, so assistive tech reads the stable meaning once instead of streaming character-by-character. The cursor span remains `aria-hidden="true"`.
- **Typewriter DOM structure** — The runtime now builds four spans inside the host element (`.am-tw-prefix`, `.am-tw-text`, `.am-tw-suffix`, `.am-tw-cursor`). Single-string usage without `data-am-strings`/`prefix`/`suffix` continues to work: the module falls back to `textContent` as a single string.

### Fixed

- Typewriter `typingSpeed` lower bound relaxed from `0.01` to `0.005` at JS + PHP layers for users who want near-instant typing.

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
