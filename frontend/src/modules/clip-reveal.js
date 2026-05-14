import { animate, inView } from 'motion';
import { getElementConfig } from '../core/config.js';

/**
 * Clip Reveal — premium image reveal via clip-path. The element starts
 * fully clipped (invisible via critical inline CSS: `clip-path: inset(100%)`)
 * and animates to fully visible (`inset(0)` or `circle(150%)`) when it
 * enters the viewport. Seven preset shapes cover the typical Awwwards-
 * style reveal patterns (curtain in 4 directions, center-split horizontal
 * + vertical, expanding circle).
 *
 * Works on any element (images, sections, cards), not just `<img>`.
 *
 * Per-element data-am-*:
 *   data-am-shape    enum (default from admin global, falls back to 'curtain-down')
 *                    one of: curtain-down, curtain-up, curtain-left,
 *                            curtain-right, center-h, center-v, circle
 *   data-am-duration float (s)  default 0.8
 *   data-am-delay    float (s)  default 0
 *   data-am-easing   string     default ease-out
 *   data-am-margin   string     default '-50px 0px'
 *
 * Module-level setting (admin panel):
 *   shape  — default shape for elements that don't specify data-am-shape.
 *
 * Why no inline clip-path is applied before the inView fires: keeping
 * the critical CSS rule `clip-path: inset(100%)` active means the
 * element stays 100% clipped until Motion's `animate()` writes the
 * first frame (which sets inline clip-path to the `from` state). That
 * way there's no intermediate "sliver visible" moment between init and
 * animation start.
 *
 * Reduced motion + JS disabled fallback: handled at the CSS layer
 * (see class-compatibility.php). Both `@media (prefers-reduced-motion:
 * reduce)` and `@media (scripting: none)` force `clip-path: none` so
 * the image is fully visible without animation if either is the case.
 *
 * Builder editors: gated upstream by main.js — init() never runs.
 */

const SHAPES = {
  'curtain-down':  ['inset(0 0 100% 0)',     'inset(0)'],
  'curtain-up':    ['inset(100% 0 0 0)',     'inset(0)'],
  'curtain-left':  ['inset(0 100% 0 0)',     'inset(0)'],
  'curtain-right': ['inset(0 0 0 100%)',     'inset(0)'],
  'center-h':      ['inset(0 50% 0 50%)',    'inset(0)'],
  'center-v':      ['inset(50% 0 50% 0)',    'inset(0)'],
  // circle radius 150% overdraws any rectangle's half-diagonal (max ≈71%
  // for a square; wider for extreme aspect ratios), guaranteeing the
  // element is fully visible at the end of the animation.
  'circle':        ['circle(0% at 50% 50%)', 'circle(150% at 50% 50%)'],
};

const DEFAULT_SHAPE = 'curtain-down';

export function init() {
  const els = document.querySelectorAll('.am-clip-reveal');
  if (!els.length) return;

  const mod = (window.animicroFrontData && window.animicroFrontData.moduleSettings)
    ? (window.animicroFrontData.moduleSettings['clip-reveal'] || {})
    : {};
  const defaultShape = (mod.shape && SHAPES[mod.shape]) ? mod.shape : DEFAULT_SHAPE;

  els.forEach((el) => {
    if (el.dataset.amClipRevealInit === '1') return;
    el.dataset.amClipRevealInit = '1';

    const cfg = getElementConfig(el, 'clip-reveal');

    const rawShape = el.dataset.amShape;
    const shapeKey = (rawShape && SHAPES[rawShape]) ? rawShape : defaultShape;
    const [from, to] = SHAPES[shapeKey];

    el.classList.add('is-ready');

    inView(el, () => {
      animate(
        el,
        { clipPath: [from, to] },
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
