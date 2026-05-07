=== Animicro ===
Contributors: jorgemml
Tags: animation, motion, css, performance, page-builder
Requires at least: 6.0
Tested up to: 6.9
Stable tag: 1.12.6
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
* **Slide Left** (`.am-slide-left`) — Slides in toward the left (from the right edge)
* **Slide Right** (`.am-slide-right`) — Slides in toward the right (from the left edge)
* **Skew Up** (`.am-skew-up`) — Slides up with a slight skew that straightens as it stops (Stripe / Vercel-style)
* **Float** (`.am-float`) — Infinite soft up/down floating motion (continuous)
* **Pulse** (`.am-pulse`) — Infinite gentle scale pulse — breathing-like (continuous)
* **Highlight** (`.am-highlight`) — Animated marker highlight behind text on entry
* **Typewriter** (`.am-typewriter`) — Types text character by character with a blinking cursor
* **Zoom Hover** (`.am-hover-zoom`) — Image scales up smoothly on hover (parent needs `overflow: hidden`)

Each module has its own settings panel with live preview so you can tune duration, easing, delay, and activation margin without leaving the admin.

= Pro modules (available with Animicro Pro) =

Blur, Stagger, Grid Reveal, Text Fill on Scroll, Parallax, Image Parallax (window effect), Split Text, and Text Reveal. Plus Smooth Scroll and a Cheat Sheet reference panel. Learn more at [animicro.com](https://animicro.com).

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

= 1.12.6 =
* Updated the underlying Motion animation library from 11.18.x to 12.38.0. ~12 months of upstream bug fixes plus better hardware acceleration on scroll-linked animations (Parallax, Image Parallax, Text Fill on Scroll). Bundle size grows by ~3 KB gzipped on the main animation chunk; per-module chunks unchanged. No API or CSS class changes — your existing markup keeps working as-is.

= 1.12.5 =
* Animicro Pro: synced internal docs and tightened the licensing flow to match LicenSuite v4. Plugin deactivation now cleans the local connection (matches Bricks / WP Rocket / Elementor); the seat stays listed under "Connected sites" in the LicenSuite dashboard until the user revokes it manually. Dropped the v1.11.x → v1.12.x migration scaffolding (no installations to migrate). No user-facing changes in the free tier.

= 1.12.4 =
* Animicro Pro: critical fix for the v3 Connect flow. The validation calls to LicenSuite were being rejected by the Supabase JWT layer before the function code ran ("Last check: Never" in the dashboard), so Pro modules never unlocked even after a successful Connect. The plugin now sends the public Supabase anon key in the Authorization header (to satisfy JWT verification) and the per-site connection secret in the request body (where the function reads it). No user-facing changes in the free tier.

= 1.12.3 =
* Animicro Pro: fixes a bug introduced by the v3 Connect migration where the License page showed "License active, Plan: PRO" but Pro modules stayed locked in the modules grid. The premium check now always re-derives the answer from current connection state instead of trusting a possibly-stale internal flag, and the premium-tier list is now filterable so custom dashboard plans (e.g. `agency`, `studio`) can unlock Pro features without a code change. No user-facing changes in the free tier.

= 1.12.2 =
* Animicro Pro: license panel now shows the plan name as configured by the operator on the LicenSuite dashboard (e.g. "Pro", "Agency", "Enterprise 50 sites"), instead of an uppercased slug. Internal upgrade to LicenSuite v4.0 plan shape (rich object with `slug` + `name` + `max_sites`). No user-facing changes in the free tier.

= 1.12.1 =
* Hotfix for Animicro Pro: the License page could crash with a blank screen right after a successful Connect when the LicenSuite server returned the `plan` field as an object instead of a plain string. The plugin now normalizes the plan shape on the PHP side and the React UI is defensive against any shape. No user-facing changes in the free tier.

= 1.12.0 =
* No user-facing changes in the free tier. Animicro Pro migrates to the LicenSuite v3 Connect flow: instead of pasting a license key, users click a "Connect" button to link their account from the LicenSuite dashboard. Existing Pro users will see a one-time "Reconnect" banner after the upgrade.

= 1.11.3 =
* **Cleaner admin UX**: third-party admin notices (SEO plugins, security tools, etc.) are now suppressed on the Animicro settings screens. They keep showing on every other `/wp-admin/` page — they just no longer break the Animicro panel layout. This is the standard practice in plugins like Bricks, Elementor and ACF Pro.

= 1.11.2 =
* No user-facing changes in the free tier. Internal release-pipeline tooling: GitHub Actions now publishes a Release with the built ZIPs on every `v*` tag, and Animicro Pro gains in-dashboard auto-updates from those Releases. Free updates continue to flow through wordpress.org as usual.

= 1.11.1 =
* No user-facing changes in the free tier. Internal compatibility update for the licence backend used by Animicro Pro (multi-site licensing, automatic seat release on plugin deactivation, local-development bypass on `localhost` / `*.local` / `*.test`).

= 1.11.0 =
* New Free module: **Zoom Hover** (`.am-hover-zoom`) — image scales up on hover. Tunable via `data-am-zoom-scale`. Parent needs `overflow: hidden`.
* New Pro module: **Image Parallax** (`.am-img-parallax`) — "window effect" that translates the inner `<img>` on scroll inside an `overflow: hidden` frame.
* New admin category: **Media & Images**.

= 1.10.3 =
* No user-facing changes in the free tier. Internal consistency pass: deduplicated the `data-am-loop` row in the Pro Cheat Sheet, simplified the frontend module loader, and added `.am-parallax` to the base visibility selector for consistency.

= 1.10.2 =
* No user-facing changes in the free tier. Internal hardening and reliability improvements for Pro-only modules (Text Reveal, Text Fill on Scroll).

= 1.10.1 =
* Accessibility: entry animations no longer stay hidden when the admin enables **Respect Reduced Motion** and the visitor prefers reduced motion. The CSS safety net now forces the final visible state (matching the no-JS behaviour).
* Docs: Slide Left / Slide Right descriptions rephrased for clarity.
* Internal: removed a dead fallback branch in skew-up.js.

= 1.10.0 =
* New Free module: **Skew Up** (`.am-skew-up`) — entry animation that slides up with a slight skew and straightens as it stops (Stripe / Vercel-style).
* New Free category: **Continuous (Infinite)** — animations that loop forever with no viewport trigger.
* New Free module: **Float** (`.am-float`) — infinite soft up/down floating motion. Perfect for 3D illustrations, icons, and hero art. Tunable via `data-am-amplitude` and `data-am-duration` (cycle length).
* New Free module: **Pulse** (`.am-pulse`) — infinite gentle scale pulse, breathing-like. Great for badges, CTAs, and call-to-action buttons. Tunable via `data-am-scale-max` and `data-am-duration` (cycle length).
* Float and Pulse respect `prefers-reduced-motion: reduce` and skip the animation entirely for visitors who opt out of motion.

= 1.9.0 =
* Slide Left (`.am-slide-left`) and Slide Right (`.am-slide-right`) are now part of the Free tier. Free users get four slide directions (up, down, left, right) out of the box. No configuration change needed if you're upgrading — just enable them from the Animicro → Modules panel.

= 1.8.0 =
* Loop support on entry animations — `fade`, `scale`, `slide-up`, `slide-down`, `slide-left`, `slide-right` and `blur` now accept `data-am-loop="true"` to repeat forever. Use `data-am-loop-mode` (`pingpong` default, or `restart`) and `data-am-loop-delay` to fine-tune. Loop is opt-in per element and automatically skipped under `prefers-reduced-motion: reduce`.

= 1.7.0 =
* Typewriter: major upgrade — rotating strings via `data-am-strings` (pipe- or JSON-separated), with `data-am-prefix` / `data-am-suffix` wrapping the rotating word. State machine types forward, holds, deletes, and cycles through the list. New controls: Back speed, Back delay, Loop, Shuffle, Cursor character, Cursor persist.
* Typewriter: **breaking change** — the cursor now stays blinking after typing ends by default (classic typewriter look). Set `data-am-cursor-persist="false"` (or disable the admin toggle) to restore the 1.6 fade-out behaviour.
* Typewriter: accessibility improved — `aria-label` exposes the full `prefix + strings.join(", ") + suffix` so screen readers announce the complete phrase once instead of per-character.
* Admin: the Typewriter settings panel now exposes Typing speed, Back speed, Back delay, Cursor character, Loop, Shuffle and Cursor persist toggles, with a live rotating preview.

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

= 1.12.6 =
Motion library upgraded from 11.18.x to 12.38.0 — better scroll-linked perf and 12 months of bug fixes. ~3 KB gzipped bundle growth. No breaking changes for your markup.

= 1.12.5 =
Pro licensing tightened to match LicenSuite v4 final. No user-facing changes in the free tier.

= 1.12.4 =
Critical fix for the Pro license validation flow. Strongly recommended for Pro users on 1.12.0–1.12.3.

= 1.12.3 =
Pro license bugfix: Pro modules now unlock correctly after Connect on every install. No user-facing changes in the free tier.

= 1.12.2 =
Pro license panel now shows the operator-configured plan name (e.g. "Agency"). No user-facing changes in the free tier.

= 1.12.1 =
Hotfix for the Pro license page crash after Connect. No user-facing changes in the free tier.

= 1.12.0 =
Internal change to the Pro licensing system (Connect flow replaces paste-the-key). Free users are unaffected. Pro users will see a one-time Reconnect banner.

= 1.11.3 =
Suppresses third-party admin notices on Animicro settings screens for a cleaner panel. No breaking changes.

= 1.11.2 =
Internal release-tooling update. No user-facing changes in the free tier.

= 1.11.1 =
Internal compatibility update for the Pro licence backend. No user-facing changes in the free tier.

= 1.11.0 =
New Free module Zoom Hover for image cards plus a new Media & Images category. No breaking changes.

= 1.10.3 =
Internal consistency pass. No user-facing changes in the free tier.

= 1.10.2 =
No user-facing changes in the free tier. Internal hardening for Pro modules.

= 1.10.1 =
Accessibility fix: entry animations no longer stay hidden when Respect Reduced Motion is enabled. Recommended update.

= 1.10.0 =
Three new Free animations: Skew Up (entry), Float and Pulse (new Continuous category). No breaking changes.

= 1.9.0 =
Slide Left and Slide Right are now Free. No breaking changes.

= 1.8.0 =
New opt-in loop support on fade, scale, slide-* and blur. No breaking changes.

= 1.7.0 =
Typewriter gains rotating strings (prefix + strings + suffix), back-speed, back-delay, loop, shuffle and a persistent cursor by default. Breaking: cursor no longer fades out — set data-am-cursor-persist="false" to restore the old behaviour.

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
