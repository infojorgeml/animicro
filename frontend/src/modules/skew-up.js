import { animate, inView } from 'motion';
import { getElementConfig, getLoopOptions } from '../core/config.js';

/**
 * Skew Up: Stripe / Vercel-style entry. Slides up + skewed, straightens on stop.
 *
 * Attributes (in addition to standard duration/delay/easing/margin):
 *   data-am-distance  float px    (default 40)
 *   data-am-skew      float deg   (starting skewY angle, default 5, clamp -45..45)
 */

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function init() {
  const els = document.querySelectorAll('.am-skew-up');
  if (!els.length) return;

  const globals = window.animicroFrontData || {};
  const mod = (globals.moduleSettings && globals.moduleSettings['skew-up']) || {};
  const defSkew = Number.isFinite(parseFloat(mod.skew)) ? parseFloat(mod.skew) : 5;

  els.forEach((el) => {
    const cfg  = getElementConfig(el, 'skew-up');
    const loop = getLoopOptions(el);

    const distance = cfg.distance != null ? cfg.distance : 40;
    const rawSkew = parseFloat(el.dataset.amSkew);
    const skew = clamp(Number.isFinite(rawSkew) ? rawSkew : defSkew, -45, 45);

    inView(el, () => {
      animate(
        el,
        { opacity: [0, 1], y: [distance, 0], skewY: [skew, 0] },
        { duration: cfg.duration, delay: cfg.delay, easing: cfg.easing, ...loop }
      );
    }, { margin: cfg.margin });
  });
}
