# Animicro

**Contributors:** jorgemml
**Tags:** animation, motion, css, performance, page-builder
**Requires at least:** 6.0
**Tested up to:** 6.9
**Stable tag:** 1.17.0
**Requires PHP:** 7.4
**License:** GPLv2 or later
**License URI:** https://www.gnu.org/licenses/gpl-2.0.html

Utility-first micro-animations for WordPress. Simple CSS classes, extreme performance.

## Description

Animicro lets you add high-end animations (Awwwards-style) with minimal performance impact. Enable modules in the panel, apply classes like `.am-fade`, `.am-scale`, or `.am-slide-up` in your Page Builder, and you're done. Each module has its own settings panel with a live preview so you can tune duration, easing, delay, and activation margin without leaving the admin.

**Philosophy**: Utility-first. No complex interfaces, no timelines. Just classes and `data-am-*` attributes.

Under **Animicro → Advanced** you can enable **Respect Reduced Motion** (skips JS-driven animations when the visitor prefers reduced motion) and **Debug Mode** (outlines `.am-*` elements and logs script timing in the browser console).

## Requirements

- WordPress 6.0+
- PHP 7.4+

## Installation

1. Download or clone the plugin to `wp-content/plugins/animicro/`
2. Run `pnpm install` and `pnpm run build` in the plugin root
3. Activate the plugin from the WordPress dashboard
4. Go to **Animicro** in the sidebar menu to configure modules

## Available modules

| Module | Class | Description |
|--------|-------|-------------|
| Fade | `.am-fade` | Smooth appearance with opacity |
| Scale | `.am-scale` | Scales from small to full size |
| Slide Up | `.am-slide-up` | Slides up when appearing |
| Slide Down | `.am-slide-down` | Slides down when appearing |
| Slide Left | `.am-slide-left` | Slides in toward the left (from the right edge) |
| Slide Right | `.am-slide-right` | Slides in toward the right (from the left edge) |
| Skew Up | `.am-skew-up` | Slides up with a slight skew that straightens as it stops |
| Float | `.am-float` | Infinite soft up/down floating motion (continuous) |
| Pulse | `.am-pulse` | Infinite gentle scale pulse — breathing-like (continuous) |
| Highlight | `.am-highlight` | Marker-style highlight behind text on entry |
| Typewriter | `.am-typewriter` | Types text character by character with blinking cursor |
| Zoom Hover | `.am-hover-zoom` | Image scales up on hover (parent needs `overflow: hidden`) |
| Magnet (Pro) | `.am-magnet` | Element drifts smoothly toward the mouse with LERP inertia |
| Scatter Text (Pro) | `.am-scatter-chars` / `.am-scatter-words` | Characters or words fly in from random positions and converge |
| Scramble Text (Pro) | `.am-scramble` | Text decodes character by character with a glitch wave |

Additional modules are available with [Animicro Pro](https://animicro.com).

## Basic usage

Use only one animation class per element. Do not combine `.am-fade` with `.am-slide-up` (or other entry animations) on the same element — it can cause flicker.

```html
<!-- Simple fade -->
<div class="am-fade">Content that appears smoothly</div>

<!-- With custom attributes -->
<div class="am-fade" data-am-duration="1" data-am-delay="0.3" data-am-easing="ease-in-out">
  Content with custom duration and delay
</div>
```

## Data attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-am-duration` | float (s) | 0.6 | Animation duration |
| `data-am-delay` | float (s) | 0 | Delay before starting |
| `data-am-easing` | string | ease-out | Easing curve |
| `data-am-margin` | string | -50px 0px | Activation margin (inView) |
| `data-am-distance` | number (px) | 30 | Slide distance (slide-up, slide-down) |
| `data-am-scale` | float | 0.95 | Starting scale (scale module) |
| `data-am-amplitude` | float (px) | 12 | Peak vertical travel (float module) |
| `data-am-scale-max` | float | 1.05 | Peak scale (pulse module) |
| `data-am-skew` | float (deg) | 5 | Starting skew angle (skew-up module) |
| `data-am-highlight-color` | string (hex) | #fde68a | Marker color (highlight module) |
| `data-am-highlight-direction` | string | left | Sweep direction: `left`, `right`, or `center` (highlight module) |
| `data-am-typing-speed` | float (s) | 0.06 | Delay per character (typewriter module) |
| `data-am-zoom-scale` | float | 1.08 | Hover scale (hover-zoom module, clamp 1.01–2.0) |
| `data-am-speed` | float | 0.5 / 0.2 | Travel intensity (parallax = 0.5, img-parallax = 0.2) |
| `data-am-strength` | float | 15 | Magnet pull strength as % of mouse-to-centre offset (clamp 1–100) |
| `data-am-smoothness` | float | 0.08 | Magnet lerp factor per frame (clamp 0.01–1; lower = more inertia) |
| `data-am-axis` | string | both | Magnet axis filter: `x`, `y`, or `both` |

## Compatibility

Works with Elementor, Bricks, Breakdance, Oxygen, Divi and Gutenberg. Dynamic inline CSS adapts per builder so elements stay visible inside editors and animations only run on the live frontend. You can select multiple builders if you use more than one.

## Development

```bash
pnpm install
pnpm run build          # Build admin + frontend
pnpm run dev:admin      # Watch mode admin
pnpm run dev:frontend   # Watch mode frontend
```

> This project uses **pnpm exclusively** (pinned via `packageManager` in `package.json`). Do not use `npm` or `npx` — there is no `package-lock.json`, only `pnpm-lock.yaml`.

### Release build

```bash
bash scripts/build.sh  # Generates release/animicro.zip
```

## License

GPL-2.0-or-later
