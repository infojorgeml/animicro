=== Animicro ===
Contributors: jorgemml
Tags: animation, motion, css, performance, page-builder
Requires at least: 6.0
Tested up to: 6.9
Stable tag: 1.6.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Utility-first micro-animations for WordPress. Simple CSS classes, extreme performance.

== Description ==

Animicro lets you add high-end animations (Awwwards-style) with minimal performance impact. Enable modules in the panel, apply classes like `.am-fade`, `.am-scale`, or `.am-slide-up` in your Page Builder, and you're done.

**Philosophy**: Utility-first. No complex interfaces, no timelines. Just classes and `data-am-*` attributes.

= Free modules =

* **Fade** (`.am-fade`) — Smooth appearance with opacity
* **Scale** (`.am-scale`) — Scales from small to full size
* **Slide Up** (`.am-slide-up`) — Slides up when appearing
* **Slide Down** (`.am-slide-down`) — Slides down when appearing
* **Highlight** (`.am-highlight`) — Animated marker highlight behind text on entry
* **Typewriter** (`.am-typewriter`) — Types text character by character with a blinking cursor

Each module has its own settings panel with live preview so you can tune duration, easing, delay, and activation margin without leaving the admin.

= Pro modules (available with Animicro Pro) =

Blur, Stagger, Grid Reveal, Text Fill on Scroll, Parallax, Split Text, Text Reveal, Slide Right, and Slide Left. Plus Smooth Scroll and a Cheat Sheet reference panel. Learn more at [animicro.com](https://animicro.com).

= Builder compatibility =

Works with Elementor, Bricks, Breakdance, Oxygen, Divi, and Gutenberg. Dynamic inline CSS adapts per builder so elements stay visible inside editors and animations only run on the live frontend.

= Advanced =

Under **Animicro → Advanced** you can enable **Respect Reduced Motion** (skips JS-driven animations when the visitor prefers reduced motion) and **Debug Mode** (outlines `.am-*` elements and logs script timing in the browser console).

== Installation ==

1. Upload the `animicro` folder to `/wp-content/plugins/`
2. Activate the plugin from the WordPress dashboard
3. Go to **Animicro** in the sidebar menu to configure modules

== Frequently Asked Questions ==

= Can I combine multiple animation classes on one element? =

No. Use only one animation class per element. Combining `.am-fade` with `.am-slide-up` on the same element can cause flicker.

= How do I override settings per element? =

Use `data-am-*` attributes. For example: `data-am-duration="1"`, `data-am-delay="0.3"`, `data-am-easing="ease-in-out"`.

= What is Animicro Pro? =

Animicro Pro is a separate plugin that replaces the free version and unlocks 11 additional animation modules plus Smooth Scroll and a Cheat Sheet. Visit [animicro.com](https://animicro.com) to learn more.

== External Services ==

This plugin does not connect to any external services. All animation logic runs
locally in the visitor's browser using JavaScript bundled with the plugin.

No data is collected, transmitted, or stored outside your WordPress installation.

== Source Code ==

This plugin includes compiled JavaScript and CSS built with Vite from React (admin panel) and vanilla JS (frontend animations). The full, uncompressed source code is available at:

https://github.com/infojorgeml/animicro

== Screenshots ==

1. Module dashboard with toggle switches and settings
2. Per-module configuration with live preview
3. Builder compatibility settings

== Changelog ==

= 1.6.0 =
* Highlight: fixed delay bug where a stray `data-am-delay` attribute on the page could produce absurdly long delays (e.g. 20 s). Delay and duration are now clamped in JS. Marker moved from `::after` to `::before` with `display: inline-block` for accurate width tracking inside all builders. Double-init guard added.
* Typewriter: now respects `prefers-reduced-motion` (shows full text immediately with no animation). Cursor CSS moved out of runtime style injection into the stylesheet. New `data-am-cursor` attribute for a custom cursor character. Double-init guard added.
* Admin: color pickers for Highlight and Text Fill on Scroll now support opacity (alpha slider + 8-char hex) and CSS variable tokens such as `var(--brand-100)`.

= 1.5.0 =
* No user-facing changes in the free tier. Internal restructuring to align the free and Pro codebases.

= 1.4.0 =
* Security: REST API settings endpoint now verifies nonce on write requests (CSRF hardening)
* Security: Numeric animation settings (duration, delay, distance, scale, typingSpeed) clamped to safe ranges
* Security: margin setting validated against CSS shorthand whitelist
* Security: Module IDs validated as CSS-safe identifiers before CSS injection
* Performance: admin menu SVG icon pre-encoded as constant (eliminates runtime base64 computation)
* Performance: animicro_settings option now stored with autoload=false
* Reliability: manifest read failures now logged to PHP error log when WP_DEBUG is enabled
* Filter: animicro_upgrade_url filter added for white-label customisation

= 1.3.0 =
* WordPress.org compliance: free package contains only free functionality (no gated Pro code in the distributed plugin)
* Removed automatic deactivation of other plugins
* readme.txt: Source Code section linking to GitHub for full uncompressed sources
* Release ZIPs use versioned filenames (animicro-X.Y.Z.zip)

= 1.2.0 =
* Highlight and Typewriter modules moved to the Free tier — available to all users without a Pro license
* Dynamic builder-compatibility CSS now injected via wp_add_inline_style() (WP.org Plugin Check compliant)
* Free plugin row shows an "Upgrade" link pointing to animicro.com
* Added External Services disclosure section
* Minor internal hardening of script type injection

= 1.1.0 =
* Architecture improvements: free plugin ships without any license code or premium gating
* Module cards link to animicro.com for upgrade information
* Build tooling improvements

= 1.0.3 =
* Freemium architecture: free version fully functional without license checks
* Improved builder compatibility

= 1.0.0 =
* Initial release

== Upgrade Notice ==

= 1.6.0 =
Bug fix for Highlight delay and Typewriter reduced-motion support. Recommended update.

= 1.5.0 =
Internal restructuring only. No breaking changes for free users.

= 1.4.0 =
Security and performance hardening. Recommended update for all users.

= 1.3.0 =
Compliance and packaging update for the WordPress.org directory. No breaking changes for free users.

= 1.2.0 =
Free users gain two new modules: Highlight and Typewriter. No breaking changes.

= 1.1.0 =
No breaking changes. Free users get the same core modules.

= 1.0.3 =
Freemium restructure. No breaking changes for free users.
