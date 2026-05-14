import { animate, inView } from 'motion';
import { getElementConfig } from '../core/config.js';

/**
 * Flip X / Flip Y — 3D card-flip entry animation. The element appears
 * rotating on its own axis (rotateX for `.am-flip-x`, rotateY for
 * `.am-flip-y`) from the configured angle back to 0°. Classic AOS-era
 * effect for pricing grids, testimonials, feature cards.
 *
 * Two module ids dispatched by the registry to this same file. `init(name)`
 * receives the module id and picks the axis. Same pattern as slide.js.
 *
 * Per-element data-am-*:
 *   data-am-angle     float (deg), default 180, clamp -720..720
 *   data-am-duration  float (s),   default 0.8
 *   data-am-delay     float (s),   default 0
 *   data-am-easing    string,      default 'ease-out'
 *                     (Tip: `cubic-bezier(0.34, 1.56, 0.64, 1)` gives
 *                     a satisfying "back-out bounce" at the end of the
 *                     flip — looks great for cards.)
 *   data-am-margin    string,      default '-50px 0px'
 *
 * Module-level settings (admin global): same fields, used as defaults
 * when the element doesn't carry the data-am-* attribute.
 *
 * Why `transformPerspective: 1000`: without perspective, a 3D rotation
 * looks flat (matrix projected to 2D with no depth). Motion v12 supports
 * `transformPerspective` as a fixed-value property that gets injected
 * into the composed inline transform as `perspective(1000px)`, applied
 * locally to the element without touching the parent or doing DOM wraps.
 *
 * prefers-reduced-motion and builder editors are handled upstream by
 * main.js — this init() never runs in either case.
 */

function readFloat(raw, fallback) {
  if (raw === undefined || raw === null || raw === '') return fallback;
  const v = parseFloat(raw);
  return Number.isFinite(v) ? v : fallback;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function init(name) {
  // name comes from registry.js — either 'flip-x' or 'flip-y'.
  const selector = `.am-${name}`;
  const axis = name === 'flip-y' ? 'rotateY' : 'rotateX';

  const els = document.querySelectorAll(selector);
  if (!els.length) return;

  els.forEach((el) => {
    if (el.dataset.amFlipInit === '1') return;
    el.dataset.amFlipInit = '1';

    const cfg = getElementConfig(el, name);

    // cfg.angle reads data-am-angle + module setting + fallback 180 via
    // getElementConfig. Belt-and-braces clamp here so a malformed attribute
    // can't break things.
    const angle = clamp(readFloat(el.dataset.amAngle, cfg.angle ?? 180), -720, 720);

    inView(el, () => {
      animate(
        el,
        {
          opacity: [0, 1],
          [axis]: [angle, 0],
          // Motion v12: this injects `perspective(1000px)` into the
          // composed transform so the rotation reads as 3D. Without it,
          // rotateX/Y looks flat. We pin it to a fixed number (no
          // keyframe array) so it stays the same throughout the animation.
          transformPerspective: 1000,
        },
        {
          duration: cfg.duration,
          delay:    cfg.delay,
          ease:     cfg.easing,
        }
      );
      el.classList.add('am-animated');
    }, { margin: cfg.margin });
  });
}
