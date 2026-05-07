import { animate } from 'motion';
import { parseEasing } from '../core/config.js';

/**
 * Pulse: infinite soft scale breathing. Continuous — no viewport gating.
 * Honors `prefers-reduced-motion: reduce` by doing nothing.
 *
 * Attributes:
 *   data-am-scale-max  float      (peak scale, default 1.05, clamp 1..2)
 *   data-am-duration   float s    (cycle length, default 1.5, clamp 0.1..30)
 *   data-am-easing     string     (default 'ease-in-out')
 *   data-am-delay      float s    (initial delay, default 0)
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

  const els = document.querySelectorAll('.am-pulse');
  if (!els.length) return;

  const mod = (globals.moduleSettings && globals.moduleSettings.pulse) || {};
  const defScaleMax = readFloat(mod.scaleMax, 1.05);
  const defDuration = readFloat(mod.duration, 1.5);
  const defEasing   = mod.easing || 'ease-in-out';
  const defDelay    = readFloat(mod.delay, 0);

  els.forEach((el) => {
    if (el.dataset.amPulseInit === '1') return;
    el.dataset.amPulseInit = '1';

    const scaleMax = clamp(readFloat(el.dataset.amScaleMax, defScaleMax), 1, 2);
    const duration = clamp(readFloat(el.dataset.amDuration, defDuration), 0.1, 30);
    const delay    = clamp(readFloat(el.dataset.amDelay, defDelay), 0, 10);
    const ease     = parseEasing(el.dataset.amEasing || defEasing);

    animate(
      el,
      { scale: [1, scaleMax, 1] },
      { duration, delay, ease, repeat: Infinity }
    );
  });
}
