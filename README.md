# Animicro

Utility-first micro-animations for WordPress powered by [Motion One](https://motion.dev/). Simple CSS classes, extreme performance.

## Description

Animicro lets you add high-end animations (Awwwards-style) with minimal performance impact. Enable modules in the panel, apply classes like `.am-fade` or `.am-slide-up` in your Page Builder, and you're done. Fade settings include a live preview so you can tune duration, easing, and delay without leaving the admin.

**Philosophy**: Utility-first. No complex interfaces, no timelines. Just classes and `data-*` attributes.

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
| Slide Up | `.am-slide-up` | Slides up when appearing | Free |
| Slide Down | `.am-slide-down` | Slides down when appearing | Free |
| Scale | `.am-scale` | Scales from small to full size | Free |
| Blur | `.am-blur` | Blur that clears as it appears | Pro |
| Stagger | `.am-stagger` | Animates container children in sequence | Pro |
| Parallax | `.am-parallax` | Scroll-linked parallax movement | Pro |
| Split Text | `.am-split` | Splits and animates text by letters/words | Pro |

## Basic usage

```html
<!-- Simple fade -->
<div class="am-fade">Content that appears smoothly</div>

<!-- With custom attributes -->
<div class="am-fade" data-duration="1" data-delay="0.3" data-easing="ease-in-out">
  Content with custom duration and delay
</div>
```

## Data attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-duration` | float (s) | 0.6 | Animation duration |
| `data-delay` | float (s) | 0 | Delay before starting |
| `data-easing` | string | ease-out | Easing curve |
| `data-margin` | string | -50px 0px | Activation margin (inView) |

## Compatibility

Works with Elementor, Bricks, Breakdance, Oxygen and Gutenberg. Dynamic inline CSS adapts per builder so elements stay visible inside editors and animations only run on the live frontend. You can select multiple builders if you use more than one.

## Pro License

Blur, Stagger, Parallax and Split Text modules require a Pro license. Activate it under **Animicro → License**.

## Development

```bash
npm install
npm run build          # Build admin + frontend
npm run dev:admin      # Watch mode admin
npm run dev:frontend   # Watch mode frontend
```

## License

GPL-2.0-or-later
