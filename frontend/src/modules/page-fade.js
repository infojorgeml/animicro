import { animate } from 'motion';
import { parseEasing } from '../core/config.js';

/**
 * Page Fade — animates <body> from opacity:0 → 1 on page load.
 *
 * The "hidden state" is established BEFORE the first paint via critical
 * inline CSS injected by includes/class-compatibility.php (a body class
 * `am-page-fade-init` that sets opacity:0). PHP adds that class via the
 * `body_class` filter only on the real frontend (skipped inside builder
 * editors). This module animates the body back to opacity:1 once
 * DOMContentLoaded fires, then cleans up the class + inline style so
 * nothing lingers in the DOM.
 *
 * Honors `prefers-reduced-motion: reduce` by removing the class
 * immediately without animating. Honors builder editors via the
 * top-level isInBuilder() check in main.js (this init() never runs
 * inside one).
 *
 * No per-element data-am-* attributes — settings come from the global
 * moduleSettings.page-fade dict.
 */

const globals = window.animicroFrontData || {};

export function init() {
  const body = document.body;
  if (!body) return;

  // Belt + braces: if the body class isn't there, nothing was hidden,
  // nothing to do.
  if (!body.classList.contains('am-page-fade-init')) return;

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

  // We can't drop the body class BEFORE animating because the critical
  // CSS sets opacity:0 through it. Instead override with an inline style
  // for the animation, then clean up both at the end.
  body.style.opacity = '0';
  body.classList.remove('am-page-fade-init');

  animate(body, { opacity: [0, 1] }, { duration, delay, ease }).finished
    .then(() => {
      body.style.removeProperty('opacity');
    })
    .catch(() => {
      // If the animation is interrupted, still leave the body visible.
      body.style.removeProperty('opacity');
    });
}
