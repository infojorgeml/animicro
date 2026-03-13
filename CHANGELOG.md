# Changelog

All notable changes to Animicro are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.3.3]: https://github.com/infojorgeml/animicro/compare/v0.3.2...v0.3.3
[0.3.2]: https://github.com/infojorgeml/animicro/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/infojorgeml/animicro/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/infojorgeml/animicro/compare/v0.2.9...v0.3.0
[0.2.7]: https://github.com/infojorgeml/animicro/compare/v0.2.6...v0.2.7
[0.2.6]: https://github.com/infojorgeml/animicro/compare/v0.2.5...v0.2.6
[0.2.5]: https://github.com/infojorgeml/animicro/compare/v0.2.0...v0.2.5
[0.2.0]: https://github.com/infojorgeml/animicro/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/infojorgeml/animicro/releases/tag/v0.1.1
