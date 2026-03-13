# Animicro

Utility-first micro-animations for WordPress powered by [Motion One](https://motion.dev/). Simple CSS classes, extreme performance.

## Description

Animicro lets you add high-end animations (Awwwards-style) with minimal performance impact. Enable modules in the panel, apply classes like `.am-fade`, `.am-scale`, or `.am-slide-up` in your Page Builder, and you're done. Fade, Scale, all slide modules, Blur, Stagger, Split Text, Text Reveal, and Typewriter each have their own settings with a live preview so you can tune duration, easing, delay, and (where applicable) scale factor, blur amount, or distance without leaving the admin.

**Philosophy**: Utility-first. No complex interfaces, no timelines. Just classes and `data-am-*` attributes.

## Requirements

- WordPress 6.0+
- PHP 7.4+

## Installation

1. Download or clone the plugin to `wp-content/plugins/Animicro/`
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
| `data-am-distance` | number (px) | 30 | Slide/stagger distance (slide-up, slide-down, slide-right, slide-left, stagger) |
| `data-am-scale` | float | 0.95 | Starting scale (scale module) |
| `data-am-blur` | number (px) | 4 | Initial blur amount (blur module) |
| `data-am-stagger` | float (s) | 0.05 | Stagger delay between units (split, text-reveal, stagger) |
| `data-am-typing-speed` | float (s) | 0.06 | Delay per character (typewriter module) |

## Compatibility

Works with Elementor, Bricks, Breakdance, Oxygen and Gutenberg. Dynamic inline CSS adapts per builder so elements stay visible inside editors and animations only run on the live frontend. You can select multiple builders if you use more than one.

## Pro License

Blur, Stagger, Parallax, Split Text, Text Reveal, Typewriter, Slide Right and Slide Left require a Pro license. The Cheat Sheet (classes and data attributes reference) is also Pro-only. Activate your license under **Animicro → License** or visit [animicro.com](https://animicro.com).

## Development

```bash
npm install
npm run build          # Build admin + frontend
npm run dev:admin      # Watch mode admin
npm run dev:frontend   # Watch mode frontend
```

## License

GPL-2.0-or-later
