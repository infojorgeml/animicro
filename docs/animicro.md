# Animicro — Development Reference

**Release:** 1.10.2 (2026-04-24). See CHANGELOG for history.

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

1. **Settings** stored in `animicro_settings` (options API). Includes `active_modules`, `active_builders`, `module_settings`, `smooth_scroll` (Pro), and `advanced` (`reducedMotion`, `debugMode`).
2. **Admin** passes `animicroData` via `wp_add_inline_script` (REST URL, nonce, settings, builders, isPremium, etc.).
3. **Frontend** receives `animicroFrontData` with `modules` (active list), `moduleSettings` (per-module defaults), and `advanced`. If Pro and smooth scroll is enabled, `smoothScroll` is included with Lenis options (`lerp`, `duration`, `smoothWheel`, `wheelMultiplier`, `anchors`).
4. **Per-element** `data-am-*` attributes override module defaults. See `frontend/src/core/config.js` → `getElementConfig(el, moduleId)`.

## Frontend Modules

- **Entry**: `frontend/src/main.js` → `loadModules(activeModules)` from `core/registry.js`.
- **Modules**: `fade`, `slide-up`, `slide-down`, `slide-left`, `slide-right`, `skew-up`, `scale`, `blur`, `float`, `pulse`, `stagger`, `grid-reveal`, `highlight`, `text-fill-scroll`, `parallax`, `split`, `text-reveal`, `typewriter`. Each exports `init()`.
- **Config**: `getElementConfig(el, moduleId)` merges `el.dataset.am*` with `moduleSettings[moduleId]` and fallbacks.
- **Code splitting**: Dynamic `import()` per module; only active modules load. **Smooth scroll** (`frontend/src/smooth-scroll.js`) is loaded only when `animicroFrontData.smoothScroll` is present (Pro + enabled in settings).

## Smooth Scroll (Pro, global)

- Not a per-element module: no CSS class on content. Enable in **Animicro → Smooth Scroll** (Pro tab).
- **Frontend**: `main.js` dynamically imports `./smooth-scroll.js`, which initializes Lenis with the options from PHP and imports `lenis/dist/lenis.css` in that chunk.
- **Builder detection**: Same URL checks as `main.js` — Lenis does not start inside Bricks, Elementor, Breakdance, Oxygen, or Divi builder previews.

## Advanced (global, Free)

- Tab order: **Advanced** is the last tab (after Integrations).
- **Respect Reduced Motion**: When on (default) and `prefers-reduced-motion: reduce` matches, `main.js` returns early (no `loadModules`, no Lenis). Complemented by CSS in `style.css` under `@media (prefers-reduced-motion: reduce)`.
- **Debug Mode**: When on, `console.time`/`timeEnd` around `loadModules`, and a red dashed outline on elements matching `[class*="am-"]`.

## Builder Compatibility

- **Admin**: Integrations tab — multiselect of builders (None, Elementor, Bricks, Breakdance, Oxygen, Divi, Gutenberg).
- **CSS**: `includes/class-compatibility.php` → `get_editor_css()` generates rules like `body:not(.bricks-is-builder) .am-fade { opacity: 0; }` so elements stay visible in editors.
- **JS**: `frontend/src/main.js` checks `?bricks=run` (and similar) to skip loading animation modules in builder preview.
- **PHP**: `class-frontend.php` uses `is_builder_editor()` to skip registering the inline CSS when a builder iframe URL param is detected.

Builder body classes: `elementor-editor-active`, `bricks-is-builder`, `breakdance`, `oxygen-builder-body`, `et_pb_pagebuilder_layout`, `block-editor-page`.

## Pro License

- **Free modules**: fade, scale, slide-up, slide-down, slide-left, slide-right, skew-up, float, pulse, highlight, typewriter.
- **Pro modules**: blur, stagger, grid-reveal, text-fill-scroll, parallax, split, text-reveal. Locked in UI and frontend when `!Animicro_License_Manager::is_premium()`.
- **Cheat Sheet** and **Smooth Scroll** tabs are Pro-only.
- License validation via Supabase; product slug `animicro`.

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

## Adding a New Animation Module

1. Create `frontend/src/modules/<name>.js` with `export function init()`.
2. Register in `frontend/src/core/registry.js` MODULES.
3. Add to `MODULE_INITIAL_CSS` in `class-compatibility.php` (initial hidden state).
4. Add to `MODULE_INFO` and `available_modules` in PHP/React.
5. If Pro: set `isPro: true` in MODULE_INFO; add to `PRO_MODULES` in class-license-manager.php.
6. If new settings keys are stored in options: whitelist them in `class-admin.php` `update_settings()` so REST save does not strip fields.
