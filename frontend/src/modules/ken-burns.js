import { animate } from 'motion';
import { parseEasing } from '../core/config.js';

/**
 * Ken Burns — slow, infinite, oscillating zoom for hero images.
 *
 * Architecturally identical to pulse.js: a single `animate()` call per
 * element with keyframe `[1, scale, 1]` and `repeat: Infinity`. Only the
 * defaults differ — Ken Burns runs at 15s with a scale of 1.15 for the
 * "documentary" cinematic feel, vs pulse's 1.5s × 1.05 "breathing-fast"
 * effect. Same module rather than a pulse preset because semantically
 * they're distinct features and users discover them under different
 * names.
 *
 * Tip: the parent should have `overflow: hidden` so the zoomed image
 * stays clipped to its frame. Most hero sections in builders ship with
 * that already; for raw HTML the user is responsible.
 *
 * Class:     .am-ken-burns
 *
 * Attributes (per-element overrides on top of admin defaults):
 *   data-am-duration  float (s),  default 15,        clamp 1..60
 *   data-am-scale     float,      default 1.15,      clamp 1.01..3
 *   data-am-easing    string,     default 'ease-in-out'
 *   data-am-delay     float (s),  default 0,         clamp 0..10
 *
 * Honors `prefers-reduced-motion: reduce` by skipping the animation
 * entirely (the element stays at its natural scale = 1). Same pattern
 * as pulse.
 *
 * Builder editors: gated upstream by main.js — init() never runs.
 */

const globals = window.animicroFrontData || {};

function readFloat(raw, fallback) {
  if (raw === undefined || raw === null || raw === '') return fallback;
  const v = parseFloat(raw);
  return Number.isFinite(v) ? v : fallback;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function init() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const els = document.querySelectorAll('.am-ken-burns');
  if (!els.length) return;

  const mod = (globals.moduleSettings && globals.moduleSettings['ken-burns']) || {};
  const defDuration = readFloat(mod.duration, 15);
  const defScale    = readFloat(mod.scale,    1.15);
  const defEasing   = mod.easing || 'ease-in-out';
  const defDelay    = readFloat(mod.delay, 0);

  els.forEach((el) => {
    if (el.dataset.amKenBurnsInit === '1') return;
    el.dataset.amKenBurnsInit = '1';

    const duration = clamp(readFloat(el.dataset.amDuration, defDuration), 1,    60);
    const scale    = clamp(readFloat(el.dataset.amScale,    defScale),    1.01,  3);
    const delay    = clamp(readFloat(el.dataset.amDelay,    defDelay),    0,    10);
    const ease     = parseEasing(el.dataset.amEasing || defEasing);

    // GPU compositing — the element gets its own layer so the per-frame
    // transform writes don't trigger paint on the rest of the page.
    el.style.willChange = 'transform';

    animate(
      el,
      { scale: [1, scale, 1] },
      { duration, delay, ease, repeat: Infinity }
    );
  });
}
