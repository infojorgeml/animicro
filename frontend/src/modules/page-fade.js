import { animate } from 'motion';
import { parseEasing } from '../core/config.js';

/**
 * Page Fade — animates <body> from opacity:0 → 1 on page load.
 *
 * Primary path (no-flash): includes/class-compatibility.php emits a
 * critical inline rule that sets `body.am-page-fade-init { opacity: 0 }`,
 * and includes/class-frontend.php adds that class to the <body> via the
 * `body_class` filter. Result: the body is hidden before the first paint,
 * and this module animates it back to 1 once DOMContentLoaded fires.
 *
 * Fallback path: if the body class never made it onto <body> (for example
 * a theme that hard-codes its own <body class="..."> instead of calling
 * `body_class()`, or some output-buffer plugin that strips classes), the
 * body would already be visible. Rather than no-op, we still run a
 * JS-only fade-in: hide → reflow → animate in. There's a tiny initial
 * flash because the browser already painted the body once, but it's
 * still a much better experience than the module silently doing nothing.
 *
 * Honors `prefers-reduced-motion: reduce`: removes the class and inline
 * opacity immediately without animating.
 *
 * Honors builder editors: main.js short-circuits before init() runs.
 * PHP also avoids adding the body class inside builders, so the fallback
 * path doesn't trigger there either.
 */

const globals = window.animicroFrontData || {};

export function init() {
  const body = document.body;
  if (!body) return;

  // prefers-reduced-motion: reveal immediately, no animation.
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    body.classList.remove('am-page-fade-init');
    body.style.removeProperty('opacity');
    return;
  }

  const mod = (globals.moduleSettings && globals.moduleSettings['page-fade']) || {};
  const duration = Number.isFinite(+mod.duration) ? +mod.duration : 0.6;
  const delay    = Number.isFinite(+mod.delay)    ? +mod.delay    : 0;
  const ease     = parseEasing(mod.easing || 'easeOut');

  // Whether the critical-CSS path actually hid the body. If yes, we just
  // need to animate back to 1. If no, the body is already visible and
  // we'll have to briefly hide it before animating (small flash).
  const wasHiddenByCriticalCss = body.classList.contains('am-page-fade-init');

  // Drop the class so the static `opacity:0` rule no longer applies;
  // we'll drive opacity via inline style for the animation.
  body.classList.remove('am-page-fade-init');
  body.style.opacity = '0';

  // If we're in the fallback path, force a reflow so the browser
  // registers the opacity:0 before the animation starts. Otherwise
  // some engines coalesce the 0 → 1 transition into a single paint.
  if (!wasHiddenByCriticalCss) {
    // eslint-disable-next-line no-unused-expressions
    body.offsetHeight;
  }

  animate(body, { opacity: [0, 1] }, { duration, delay, ease }).finished
    .then(() => {
      body.style.removeProperty('opacity');
    })
    .catch(() => {
      // If the animation is interrupted, still leave the body visible.
      body.style.removeProperty('opacity');
    });
}
