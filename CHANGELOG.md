# Changelog

All notable changes to Animicro are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- **Data attributes**: `data-duration`, `data-delay`, `data-easing`, `data-margin` per element

### Technical

- PHP 7.4+, WordPress 6.0+
- Vite 6 for admin (React + TypeScript + Tailwind) and frontend (Vanilla JS) build
- REST API: `animicro/v1/settings`, `animicro/v1/license/status`, `animicro/v1/license/save`

[0.2.0]: https://github.com/infojorgeml/animicro/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/infojorgeml/animicro/releases/tag/v0.1.1
