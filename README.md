# Animicro

**Contributors:** jorgemml
**Tags:** animation, motion, css, performance, page-builder
**Requires at least:** 6.0
**Tested up to:** 6.9
**Stable tag:** 1.0.1
**Requires PHP:** 7.4
**License:** GPLv2 or later
**License URI:** https://www.gnu.org/licenses/gpl-2.0.html

Utility-first micro-animations for WordPress. Simple CSS classes, extreme performance.

## Description

Animicro lets you add high-end animations (Awwwards-style) with minimal performance impact. Enable modules in the panel, apply classes like `.am-fade`, `.am-scale`, or `.am-slide-up` in your Page Builder, and you're done. Fade, Scale, all slide modules, Blur, Stagger, Grid Reveal, Highlight, Text Fill on Scroll, Parallax, Split Text, Text Reveal, and Typewriter each have their own settings with a live preview so you can tune duration, easing, delay, speed, and (where applicable) scale factor, blur amount, distance, grid origin, highlight color, or scroll fill colors without leaving the admin.

**Philosophy**: Utility-first. No complex interfaces, no timelines. Just classes and `data-am-*` attributes.

Under **Animicro → Advanced** you can enable **Respect Reduced Motion** (skips JS-driven animations when the visitor prefers reduced motion) and **Debug Mode** (outlines `.am-*` elements and logs script timing in the browser console).

## Requirements

- WordPress 6.0+
- PHP 7.4+

## Installation

1. Download or clone the plugin to `wp-content/plugins/animicro/`
2. Run `npm install` and `npm run build` in the plugin root
3. Activate the plugin from the WordPress dashboard
4. Go to **Animicro** in the sidebar menu to configure modules

## Available modules

| Module | Class | Description | Plan |
|--------|-------|-------------|------|
| Fade | `.am-fade` | Smooth appearance with opacity | Free |
| Scale | `.am-scale` | Scales from small to full size | Free |
| Slide Up | `.am-slide-up` | Slides up when appearing | Free |
| Slide Down | `.am-slide-down` | Slides down when appearing | Free |
| Slide Right | `.am-slide-right` | Slides in from the left | Pro |
| Slide Left | `.am-slide-left` | Slides in from the right | Pro |
| Blur | `.am-blur` | Blur that clears as it appears | Pro |
| Stagger | `.am-stagger` | Animates container children in sequence | Pro |
| Grid Reveal | `.am-grid-reveal` | Reveals direct children from a focal point (spatial wave) | Pro |
| Highlight | `.am-highlight` | Marker-style highlight behind text on entry | Pro |
| Text Fill on Scroll | `.am-text-fill-scroll` | Fills text word by word as you scroll | Pro |
| Parallax | `.am-parallax` | Scroll-linked parallax movement | Pro |
| Split Text | `.am-split-chars` / `.am-split-words` | Splits and animates text by characters or words | Pro |
| Text Reveal | `.am-text-reveal` | Reveals text line by line with a sliding mask | Pro |
| Typewriter | `.am-typewriter` | Types text character by character with blinking cursor | Pro |

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
| `data-am-distance` | number (px) | 30 | Slide/stagger distance (slide-up, slide-down, slide-right, slide-left, split, stagger, grid-reveal) |
| `data-am-scale` | float | 0.95 | Starting scale (scale module) |
| `data-am-blur` | number (px) | 4 | Initial blur amount (blur module) |
| `data-am-stagger` | float (s) | 0.05 | Stagger delay between units (split, text-reveal, stagger, grid-reveal) |
| `data-am-origin` | string | center | Focal point for grid-reveal: `center`, corners, `top`/`right`/`bottom`/`left`, or `random` (container only) |
| `data-am-highlight-color` | string (hex) | #fde68a | Marker color (highlight module) |
| `data-am-highlight-direction` | string | left | Sweep direction: `left`, `right`, or `center` (highlight module) |
| `data-am-color-base` | string (hex) | #cccccc | Muted text color before fill (text-fill-scroll) |
| `data-am-color-fill` | string (hex) | #000000 | Color words transition to while scrolling (text-fill-scroll) |
| `data-am-scroll-start` | int (%) | 62 | Viewport line for scroll range start (text-fill-scroll) |
| `data-am-scroll-end` | int (%) | 60 | Viewport line for scroll range end (text-fill-scroll) |
| `data-am-speed` | float | 0.5 | Parallax movement intensity (parallax module) |
| `data-am-typing-speed` | float (s) | 0.06 | Delay per character (typewriter module) |

## Compatibility

Works with Elementor, Bricks, Breakdance, Oxygen, Divi and Gutenberg. Dynamic inline CSS adapts per builder so elements stay visible inside editors and animations only run on the live frontend. You can select multiple builders if you use more than one. See `docs/` for per-builder integration details.

## Pro License

Blur, Stagger, Grid Reveal, Highlight, Text Fill on Scroll, Parallax, Split Text, Text Reveal, Typewriter, Slide Right and Slide Left require a Pro license. **Smooth Scroll** (site-wide smooth scrolling) and the **Cheat Sheet** (classes and data attributes reference) are also Pro-only. Activate your license under **Animicro → License** or visit [animicro.com](https://animicro.com).

## Development

```bash
npm install
npm run build          # Build admin + frontend
npm run dev:admin      # Watch mode admin
npm run dev:frontend   # Watch mode frontend
```

## License

GPL-2.0-or-later
