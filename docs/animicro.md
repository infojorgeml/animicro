# Animicro — Development Reference

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
| Animation | Motion One (~3.8kb); optional Lenis (smooth scroll, Pro, separate chunk) |
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
- **Modules**: `fade`, `slide-up`, `slide-down`, `slide-left`, `slide-right`, `scale`, `blur`, `stagger`, `grid-reveal`, `highlight`, `text-fill-scroll`, `parallax`, `split`, `text-reveal`, `typewriter`. Each exports `init()`.
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
- **PHP**: `class-frontend.php` skips printing hide CSS when `?bricks=run` in URL (Bricks iframe).

Builder body classes: `elementor-editor-active`, `bricks-is-builder`, `breakdance`, `oxygen-builder-body`, `et_pb_pagebuilder_layout`, `block-editor-page`.

## Pro License

- **Pro modules**: blur, stagger, grid-reveal, highlight, text-fill-scroll, parallax, split, slide-right, slide-left, text-reveal, typewriter. Locked in UI and frontend when `!Animicro_License_Manager::is_premium()`.
- **Cheat Sheet** and **Smooth Scroll** tabs are Pro-only.
- License validation via Supabase; product slug `animicro`.

## Key Files

| File | Role |
|------|------|
| `animicro.php` | Bootstrap, constants, activation |
| `includes/class-animicro.php` | Orchestrator, defaults, get_settings() |
| `includes/class-admin.php` | Menu (SVG menu icon as base64 data URL), REST API, enqueue admin assets, plugin_action_links |
| `includes/class-frontend.php` | Enqueue frontend assets, `animicroFrontData` (`advanced`, optional `smoothScroll`), print_dynamic_css |
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
| `data-am-distance` | float (px) | 30 | slide-*, split, stagger, grid-reveal |
| `data-am-scale` | float | 0.95 | scale |
| `data-am-blur` | float (px) | 4 | blur |
| `data-am-stagger` | float (s) | 0.05–0.1 | stagger, split, text-reveal, grid-reveal |
| `data-am-speed` | float | 0.5 | parallax |
| `data-am-typing-speed` | float (s) | 0.06 | typewriter |
| `data-am-origin` | string | center | grid-reveal only — `center`, corners, `top`/`right`/`bottom`/`left`, or `random` (on container) |
| `data-am-highlight-color` | string (hex) | #fde68a | highlight |
| `data-am-highlight-direction` | string | left | highlight — `left`, `right`, `center` |
| `data-am-color-base` | string (hex) | #cccccc | text-fill-scroll |
| `data-am-color-fill` | string (hex) | #000000 | text-fill-scroll |
| `data-am-scroll-start` | int (%) | 62 | text-fill-scroll — scroll offset start |
| `data-am-scroll-end` | int (%) | 60 | text-fill-scroll — scroll offset end |

## Text Fill on Scroll (scroll-linked text)

- **Class**: `.am-text-fill-scroll` on a text element. The script splits `innerText` into words, wraps each in `.am-tfs-wrapper` with `.am-tfs-base` (muted) and `.am-tfs-fill` (target color, opacity animated).
- **Animation**: `scroll(animate(...), { target: el, offset: [...] })` per word; `colorBase`, `colorFill`, `scrollStart`, `scrollEnd` from `getElementConfig(el, 'text-fill-scroll')`.

## Highlight (typography)

- **Class**: `.am-highlight` on a text element. The script wraps content in `.am-highlight-inner`; a `::after` pseudo-element animates `scaleX` via CSS transition when the element enters the viewport (`inView`).
- **Config**: `highlightColor`, `highlightDirection` (maps to `transform-origin`); `data-am-highlight-color` and `data-am-highlight-direction` on the same element as the class.

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
