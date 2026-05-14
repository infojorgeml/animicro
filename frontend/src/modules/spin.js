/**
 * Spin — continuous rotation that speeds up momentarily with scroll.
 * Continuous, Pro module. Per-element direction + speed; global default
 * direction / speed / scrollBoost from the admin panel.
 *
 * Class:        .am-spin
 *
 * Per-element data-am-* attributes:
 *   data-am-direction   "left" | "right"  (default from admin, default "right")
 *   data-am-speed       1..360 deg/sec    (default from admin, default 30)
 *
 * Module-level settings (admin panel global):
 *   spinDirection   "left" | "right"      (default "right")
 *   spinSpeed       1..360 deg/sec        (default 30)
 *   scrollBoost     0..20                 (default 5). Multiplier of the
 *                                         per-frame scroll velocity that
 *                                         adds to baseSpeed. 0 = scroll
 *                                         has no effect, only baseline.
 *
 * Architecture: single global rAF loop + single global scroll listener +
 * single global IntersectionObserver. The loop only ticks when there are
 * visible items; the rAF auto-pauses when the page is hidden (browser
 * default). Decay of the scroll velocity is ~8%/frame, so the boost
 * dissipates in ~150ms — feels like a natural "nudge".
 *
 * Why a manual loop instead of Motion's animate({ repeat: Infinity }):
 * Motion can't modulate speed per frame from outside the animation. We
 * need (baseSpeed + scrollVelocity * scrollBoost) every frame, so we
 * compute the transform manually.
 *
 * Builder editors + reduced motion: gated upstream by main.js — init()
 * never runs in either case.
 */

const items = [];
const visible = new Set();

let scrollVelocity = 0;
let lastScrollY = 0;
let lastTimestamp = 0;
let rafId = null;
let scrollBoost = 5;
let io = null;
let scrollListenerAttached = false;

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

function onScroll() {
  const dy = Math.abs(window.scrollY - lastScrollY);
  lastScrollY = window.scrollY;
  // Cap dy so a giant programmatic scrollTo doesn't make the badges spin
  // wildly for half a second; we want a "real-time" feel.
  const capped = Math.min(dy, 80);
  // Take the max so quick consecutive scroll events stack naturally,
  // rather than the decayed value being overwritten by a small one.
  if (capped > scrollVelocity) scrollVelocity = capped;
}

function tick(now) {
  // Compute frame delta in seconds so rotation stays visually constant
  // even if the browser drops frames under load.
  const deltaMs = lastTimestamp ? (now - lastTimestamp) : 16;
  lastTimestamp = now;
  const deltaSec = deltaMs / 1000;

  // Exponential decay of the scroll velocity (~8%/frame).
  scrollVelocity *= 0.92;
  if (scrollVelocity < 0.1) scrollVelocity = 0;

  const boost = scrollVelocity * scrollBoost;

  visible.forEach((item) => {
    const speedNow = item.baseSpeed + boost;
    item.rotation = (item.rotation + speedNow * item.dirSign * deltaSec) % 360;
    item.el.style.transform = `rotate(${item.rotation}deg)`;
  });

  if (visible.size > 0) {
    rafId = requestAnimationFrame(tick);
  } else {
    // Nothing on-screen to animate — pause the loop until something
    // becomes visible again. ensureLoop() restarts it.
    rafId = null;
    lastTimestamp = 0;
  }
}

function ensureLoop() {
  if (rafId === null && visible.size > 0) {
    lastTimestamp = 0;
    rafId = requestAnimationFrame(tick);
  }
}

export function init() {
  if (prefersReducedMotion()) return;

  const els = document.querySelectorAll('.am-spin');
  if (!els.length) return;

  const mod = (window.animicroFrontData && window.animicroFrontData.moduleSettings)
    ? (window.animicroFrontData.moduleSettings.spin || {})
    : {};

  scrollBoost = clamp(safeFloat(mod.scrollBoost, 5), 0, 20);
  const defaultDir = (mod.spinDirection === 'left') ? 'left' : 'right';
  const defaultSpeed = clamp(safeFloat(mod.spinSpeed, 30), 1, 360);

  els.forEach((el) => {
    if (el.dataset.amSpinReady === '1') return;
    el.dataset.amSpinReady = '1';

    const speed = clamp(safeFloat(el.dataset.amSpeed, defaultSpeed), 1, 360);
    const dirRaw = (el.dataset.amDirection || defaultDir).toString().toLowerCase();
    const dirSign = dirRaw === 'left' ? -1 : 1;

    // GPU compositing hint — each spinning element gets its own layer so
    // per-frame transform writes stay off the main thread.
    el.style.willChange = 'transform';

    items.push({ el, baseSpeed: speed, dirSign, rotation: 0 });
  });

  if (!items.length) return;

  // IntersectionObserver: only tick items that are currently in (or near)
  // the viewport. rootMargin: 50px so the rotation feels "alive" the
  // instant the badge crosses into view, not 1 frame later.
  if (typeof IntersectionObserver === 'function') {
    io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const item = items.find((it) => it.el === entry.target);
        if (!item) return;
        if (entry.isIntersecting) visible.add(item);
        else visible.delete(item);
      });
      ensureLoop();
    }, { rootMargin: '50px' });

    items.forEach((it) => io.observe(it.el));
  } else {
    // Very old browsers without IO — fall back to "always visible".
    items.forEach((it) => visible.add(it));
  }

  if (!scrollListenerAttached) {
    lastScrollY = window.scrollY;
    window.addEventListener('scroll', onScroll, { passive: true });
    scrollListenerAttached = true;
  }

  ensureLoop();
}
