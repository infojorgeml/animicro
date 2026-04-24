import { animate } from 'motion';

/**
 * Float: infinite vertical bob. Continuous — no viewport gating.
 * Honors `prefers-reduced-motion: reduce` by doing nothing.
 *
 * Attributes:
 *   data-am-amplitude  float px   (default 12, clamp 1..100)
 *   data-am-duration   float s    (cycle length, default 3, clamp 0.1..30)
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

  const els = document.querySelectorAll('.am-float');
  if (!els.length) return;

  const mod = (globals.moduleSettings && globals.moduleSettings.float) || {};
  const defAmp       = readFloat(mod.amplitude, 12);
  const defDuration  = readFloat(mod.duration, 3);
  const defEasing    = mod.easing || 'ease-in-out';
  const defDelay     = readFloat(mod.delay, 0);

  els.forEach((el) => {
    if (el.dataset.amFloatInit === '1') return;
    el.dataset.amFloatInit = '1';

    const amp      = clamp(readFloat(el.dataset.amAmplitude, defAmp), 1, 100);
    const duration = clamp(readFloat(el.dataset.amDuration, defDuration), 0.1, 30);
    const delay    = clamp(readFloat(el.dataset.amDelay, defDelay), 0, 10);
    const easing   = el.dataset.amEasing || defEasing;

    animate(
      el,
      { y: [0, -amp, 0] },
      { duration, delay, easing, repeat: Infinity }
    );
  });
}
