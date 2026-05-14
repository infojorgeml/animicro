/**
 * Magnetic — local pull-to-cursor effect for buttons / icons / links.
 *
 * When the visitor's pointer enters the configured radius around an
 * element's centre, the element is pulled toward the cursor by a
 * configurable percentage of the distance. When the cursor exits the
 * radius, the lerp target snaps back to 0 and the element drifts home
 * elastically. The classic Awwwards-style "premium feel" interaction
 * for hero CTAs and nav links.
 *
 * Different from `.am-magnet` (which is global, viewport-centred,
 * always-on drifting). Magnetic is LOCAL: only reacts to nearby cursor
 * positions, no effect when the cursor is far away.
 *
 * Class:        .am-magnetic
 *
 * Per-element data-am-* attributes:
 *   data-am-range       20..600 px,    default 100   attraction radius
 *   data-am-strength    1..100 (%),    default 30    % of cursor-to-centre
 *                                                    distance to pull
 *   data-am-smoothness  0.01..1,       default 0.15  lerp factor per frame
 *   data-am-axis        x | y | both,  default both  axis filter
 *
 * Module-level settings (admin panel global) — same fields, used as
 * defaults for elements that don't carry the data-am-* attribute.
 *
 * Architecture:
 *   - Single global pointermove listener (passive).
 *   - Single global rAF loop.
 *   - Single global scroll + resize listeners to refresh cached element
 *     centres (cx, cy) — getBoundingClientRect is too costly to call
 *     60×N times per second.
 *
 * Defence in depth:
 *   - prefers-reduced-motion: bail out completely, no listeners, no rAF.
 *   - Touch-only devices (coarse pointer AND not fine): skip — no useful
 *     mouse signal. Hybrid devices (touchscreen + trackpad) still work.
 *   - Builder editors: main.js short-circuit handles this upstream.
 *   - Init dedup: data-am-magnetic-ready="1" per element.
 *
 * Why pointermove vs mousemove: pointermove unifies mouse/pen/touch.
 * Touch-only devices are already filtered out by the pointer:coarse
 * check, so in practice this only listens to fine pointers.
 */

const items = [];
let mouseX = -99999;  // pre-mousemove: far away, no element activates
let mouseY = -99999;
let rafId = null;
let listenerAttached = false;

function safeFloat(raw, fallback) {
  if (raw === undefined || raw === null || raw === '') return fallback;
  const v = parseFloat(raw);
  return Number.isFinite(v) ? v : fallback;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isTouchOnly() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const fine   = window.matchMedia('(pointer: fine)').matches;
  return coarse && !fine;
}

function updateRects() {
  for (let i = 0; i < items.length; i++) {
    const r = items[i].el.getBoundingClientRect();
    items[i].cx = r.left + r.width  / 2;
    items[i].cy = r.top  + r.height / 2;
  }
}

function onPointerMove(e) {
  mouseX = e.clientX;
  mouseY = e.clientY;
}

function tick() {
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const dx = mouseX - it.cx;
    const dy = mouseY - it.cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let tx = 0;
    let ty = 0;

    if (dist < it.range) {
      // Inside the attraction radius: pull a fraction of the offset.
      // strength is a % (e.g. 30 = "move 30% of the way to the cursor").
      const pull = it.strength / 100;
      tx = it.axis === 'y' ? 0 : dx * pull;
      ty = it.axis === 'x' ? 0 : dy * pull;
    }
    // Outside the radius: tx/ty stay 0; the lerp pulls the element home.

    it.currentX += (tx - it.currentX) * it.smoothness;
    it.currentY += (ty - it.currentY) * it.smoothness;
    it.el.style.transform = `translate(${it.currentX}px, ${it.currentY}px)`;
  }
  rafId = requestAnimationFrame(tick);
}

export function init() {
  if (prefersReducedMotion()) return;
  if (isTouchOnly()) return;

  const els = document.querySelectorAll('.am-magnetic');
  if (!els.length) return;

  const mod = (window.animicroFrontData && window.animicroFrontData.moduleSettings)
    ? (window.animicroFrontData.moduleSettings.magnetic || {})
    : {};

  const defRange      = clamp(safeFloat(mod.range,      100),  20,   600);
  const defStrength   = clamp(safeFloat(mod.strength,   30),    1,   100);
  const defSmoothness = clamp(safeFloat(mod.smoothness, 0.15), 0.01,   1);
  const defAxisRaw    = (mod.axis || 'both').toString().toLowerCase();
  const defAxis       = ['x', 'y', 'both'].includes(defAxisRaw) ? defAxisRaw : 'both';

  els.forEach((el) => {
    if (el.dataset.amMagneticReady === '1') return;
    el.dataset.amMagneticReady = '1';

    const range      = clamp(safeFloat(el.dataset.amRange,      defRange),     20,   600);
    const strength   = clamp(safeFloat(el.dataset.amStrength,   defStrength),   1,   100);
    const smoothness = clamp(safeFloat(el.dataset.amSmoothness, defSmoothness), 0.01,  1);
    const axisRaw    = (el.dataset.amAxis || defAxis).toString().toLowerCase();
    const axis       = ['x', 'y', 'both'].includes(axisRaw) ? axisRaw : 'both';

    // GPU compositing — each magnetic element gets its own layer so
    // per-frame transform writes stay off the main thread.
    el.style.willChange = 'transform';

    items.push({ el, range, strength, smoothness, axis,
                 cx: 0, cy: 0, currentX: 0, currentY: 0 });
  });

  if (!items.length) return;

  updateRects();

  if (!listenerAttached) {
    document.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('scroll',  updateRects, { passive: true });
    window.addEventListener('resize',  updateRects, { passive: true });
    listenerAttached = true;
  }

  if (rafId === null) {
    rafId = requestAnimationFrame(tick);
  }
}
