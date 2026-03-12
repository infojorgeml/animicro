# Animicro — Development Reference

Utility-first micro-animations for WordPress powered by [Motion One](https://motion.dev/). This document describes the architecture and conventions for developers and AI assistants.

## Overview

- **Philosophy**: Utility-first. No timelines or complex UIs. Users enable modules in the admin panel and apply CSS classes (`.am-fade`, `.am-slide-up`, etc.) and `data-am-*` attributes in their Page Builder.
- **Goal**: High-end animations (Awwwards-style) with minimal performance impact, compatible with popular builders.
- **Prefixes**: PHP functions/handles/globals use `animicro_`. CSS classes use `.am-`. Data attributes use `data-am-*`.

## Tech Stack

| Layer | Stack |
|-------|-------|
| Backend | PHP 7.4+ OOP |
| Admin UI | React 19, TypeScript, Tailwind CSS, Vite |
| Frontend | Vanilla JS (ES Modules), CSS, Vite |
| Animation | Motion One (~3.8kb) |
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

1. **Settings** stored in `animicro_settings` (options API). Includes `active_modules`, `active_builders`, `module_settings`.
2. **Admin** passes `animicroData` via `wp_add_inline_script` (REST URL, nonce, settings, builders, isPremium, etc.).
3. **Frontend** receives `animicroFrontData` with `modules` (active list) and `moduleSettings` (per-module defaults).
4. **Per-element** `data-am-*` attributes override module defaults. See `frontend/src/core/config.js` → `getElementConfig(el, moduleId)`.

## Frontend Modules

- **Entry**: `frontend/src/main.js` → `loadModules(activeModules)` from `core/registry.js`.
- **Modules**: `fade`, `slide-up`, `slide-down`, `scale`, `blur`, `stagger`, `parallax`, `split`. Each exports `init()`.
- **Config**: `getElementConfig(el, moduleId)` merges `el.dataset.am*` with `moduleSettings[moduleId]` and fallbacks.
- **Code splitting**: Dynamic `import()` per module; only active modules load.

## Builder Compatibility

- **Admin**: Integrations tab — multiselect of builders (None, Elementor, Bricks, Breakdance, Oxygen, Gutenberg).
- **CSS**: `includes/class-compatibility.php` → `get_editor_css()` generates rules like `body:not(.bricks-is-builder) .am-fade { opacity: 0; }` so elements stay visible in editors.
- **JS**: `frontend/src/main.js` checks `?bricks=run` (and similar) to skip loading animation modules in builder preview.
- **PHP**: `class-frontend.php` skips printing hide CSS when `?bricks=run` in URL (Bricks iframe).

Builder body classes: `elementor-editor-active`, `bricks-is-builder`, `breakdance-builder`, `oxygen-builder-body`, `block-editor-page`.

## Pro License

- **Pro modules**: blur, stagger, parallax, split. Locked in UI and frontend when `!Animicro_License_Manager::is_premium()`.
- **Cheat Sheet** tab is Pro-only.
- License validation via Supabase; product slug `animicro`.

## Key Files

| File | Role |
|------|------|
| `animicro.php` | Bootstrap, constants, activation |
| `includes/class-animicro.php` | Orchestrator, defaults, get_settings() |
| `includes/class-admin.php` | Menu, REST API, enqueue admin assets, plugin_action_links |
| `includes/class-frontend.php` | Enqueue frontend assets, print_dynamic_css |
| `includes/class-compatibility.php` | get_editor_css(), BUILDER_EDITOR_CLASSES, MODULE_INITIAL_CSS |
| `includes/class-license-manager.php` | Validation, is_premium(), is_pro_module() |
| `frontend/src/core/config.js` | getElementConfig(el, moduleId) |
| `frontend/src/core/registry.js` | loadModules(), MODULES map |
| `admin/src/data/modules.ts` | MODULE_INFO, DATA_ATTRIBUTES, EASING_OPTIONS, MARGIN_OPTIONS |

## Data Attributes (data-am-*)

| Attribute | Type | Default | Used by |
|-----------|------|---------|---------|
| `data-am-duration` | float (s) | 0.6 | All |
| `data-am-delay` | float (s) | 0 | All |
| `data-am-easing` | string | ease-out | All |
| `data-am-margin` | string | -50px 0px | All |
| `data-am-distance` | float (px) | 30 | slide-up, slide-down |
| `data-am-scale` | float | 0.95 | scale |
| `data-am-blur` | float (px) | 4 | blur |
| `data-am-stagger` | float (s) | 0.1 | stagger, split |
| `data-am-speed` | float | 0.5 | parallax |
| `data-am-split` | chars \| words | chars | split |

## Adding a New Animation Module

1. Create `frontend/src/modules/<name>.js` with `export function init()`.
2. Register in `frontend/src/core/registry.js` MODULES.
3. Add to `MODULE_INITIAL_CSS` in `class-compatibility.php` (initial hidden state).
4. Add to `MODULE_INFO` and `available_modules` in PHP/React.
5. If Pro: set `isPro: true` in MODULE_INFO; add to `PRO_MODULES` in class-license-manager.php.
