/**
 * Magnet — elements drift smoothly toward the mouse position using LERP.
 * Continuous (no viewport gating). Pro module.
 *
 * Each element's target translate is computed every frame from the mouse
 * offset to the viewport centre, scaled by `strength`. We interpolate from
 * the current offset toward the target by a `smoothness` factor, which
 * produces the classic "inertia" / drag feel: low smoothness = heavy /
 * draggy; high smoothness = snappy / jittery.
 *
 * Single global mousemove listener + single rAF loop, regardless of how
 * many `.am-magnet` elements are on the page — cost scales linearly with
 * element count (one transform write per element per frame).
 *
 * Why a manual rAF loop instead of Motion's animate(): Motion needs a
 * target known at call time. Here the target changes every frame
 * (follows the cursor), so animate() doesn't fit. Same reason `parallax`
 * uses Motion's scroll() helper instead of animate().
 *
 * Attributes:
 *   data-am-strength    float    (default 15, clamp 1..100)
 *                       % of the mouse-to-centre offset the element travels.
 *   data-am-smoothness  float    (default 0.08, clamp 0.01..1)
 *                       Lerp factor per frame. Lower = more inertia.
 *   data-am-axis        enum     (default 'both' — 'x' | 'y' | 'both')
 *                       Restrict movement to a single axis.
 *
 * Defence in depth:
 *   - main.js short-circuits before init() if reducedMotion is on. We
 *     check again here for safety against future wiring changes.
 *   - Touch-only devices (no fine pointer) get skipped — magnet without
 *     a mouse signal is dead weight. Hybrid laptops with both trackpad
 *     and touchscreen still get the effect.
 */

const globals = window.animicroFrontData || {};
const ALLOWED_AXES = ['x', 'y', 'both'];

function readFloat(raw, fallback) {
  if (raw === undefined || raw === null || raw === '') return fallback;
  const v = parseFloat(raw);
  return Number.isFinite(v) ? v : fallback;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// Module-scoped state — single shared loop + listener for all instances.
let mouseX = 0;
let mouseY = 0;
let items = [];
let rafId = null;
let mouseListenerAttached = false;

function onMouseMove(e) {
  mouseX = e.clientX - window.innerWidth  / 2;
  mouseY = e.clientY - window.innerHeight / 2;
}

function tick() {
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const tx = it.axis === 'y' ? 0 : (mouseX * it.strength) / 100;
    const ty = it.axis === 'x' ? 0 : (mouseY * it.strength) / 100;
    it.currentX += (tx - it.currentX) * it.smoothness;
    it.currentY += (ty - it.currentY) * it.smoothness;
    it.el.style.transform = `translate(${it.currentX}px, ${it.currentY}px)`;
  }
  rafId = requestAnimationFrame(tick);
}

export function init() {
  // prefers-reduced-motion: bail out completely. Elements stay in place
  // because we never write a transform — preserves whatever CSS layout
  // the theme had originally.
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  // Touch-only devices: skip. Hybrid devices (fine pointer present) still
  // get the effect — they can drive the cursor with a trackpad.
  if (window.matchMedia) {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const fine   = window.matchMedia('(pointer: fine)').matches;
    if (coarse && !fine) return;
  }

  const els = document.querySelectorAll('.am-magnet');
  if (!els.length) return;

  const mod = (globals.moduleSettings && globals.moduleSettings.magnet) || {};
  const defStrength   = readFloat(mod.strength, 15);
  const defSmoothness = readFloat(mod.smoothness, 0.08);
  const defAxisRaw    = (mod.axis || 'both').toString().toLowerCase();
  const defAxis       = ALLOWED_AXES.includes(defAxisRaw) ? defAxisRaw : 'both';

  els.forEach((el) => {
    if (el.dataset.amMagnetInit === '1') return;
    el.dataset.amMagnetInit = '1';

    const strength   = clamp(readFloat(el.dataset.amStrength,   defStrength),   1,    100);
    const smoothness = clamp(readFloat(el.dataset.amSmoothness, defSmoothness), 0.01, 1);
    const axisRaw    = (el.dataset.amAxis || defAxis).toString().toLowerCase();
    const axis       = ALLOWED_AXES.includes(axisRaw) ? axisRaw : 'both';

    // GPU compositing hint — the element is animated on every frame, so
    // promoting it to its own layer avoids per-frame layout/paint cost.
    el.style.willChange = 'transform';

    items.push({ el, strength, smoothness, axis, currentX: 0, currentY: 0 });
  });

  if (!items.length) return;

  if (!mouseListenerAttached) {
    document.addEventListener('mousemove', onMouseMove, { passive: true });
    mouseListenerAttached = true;
  }

  if (rafId === null) {
    rafId = requestAnimationFrame(tick);
  }
}
