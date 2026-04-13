=== Animicro ===
Contributors: jorgemml
Tags: animation, motion, css, performance, page-builder
Requires at least: 6.0
Tested up to: 6.9
Stable tag: 1.1.0
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

== Screenshots ==

1. Module dashboard with toggle switches and settings
2. Per-module configuration with live preview
3. Builder compatibility settings

== Changelog ==

= 1.1.0 =
* Freemium architecture: free plugin ships without any license code, Supabase calls, or premium gating at the PHP level
* New `ANIMICRO_PRO` constant controls pro/free behaviour at build time
* Pro module cards now link to animicro.com for upgrade instead of an internal license page
* Added `scripts/build.sh` to generate both free and pro ZIPs from a single source

= 1.0.3 =
* Freemium architecture: free version fully functional without license checks
* Improved builder compatibility

= 1.0.0 =
* Initial release

== Upgrade Notice ==

= 1.1.0 =
No breaking changes. Free users get the same 4 core modules. All premium code has been moved out of the free package.

= 1.0.3 =
Freemium restructure. No breaking changes for free users.
