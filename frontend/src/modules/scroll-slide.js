/**
 * Scroll Slide — scroll-linked horizontal drift. As the visitor scrolls
 * vertically, the element translates horizontally across the viewport.
 * Classic "newspaper strip" / "ticker tape" effect for Hero headlines
 * and section dividers.
 *
 * Two sibling classes dispatched from the registry to this same file:
 *   .am-scroll-slide-left   — element drifts from +100% (off-screen
 *                              right) to -60% (off-screen left) as the
 *                              page scrolls down. Classic direction.
 *   .am-scroll-slide-right  — inverse: -100% → +60% (left → right).
 *
 * Per-element attribute:
 *   data-am-speed    float, default 1, clamp 0.1..3
 *                    Travel multiplier. 0.5 = subtle drift, 3 = wild
 *                    sweep that pushes the element fully off-screen.
 *
 * Architecture: single scroll listener (passive, rAF-throttled) +
 * single IntersectionObserver that maintains a Set of currently
 * visible items. Each tick walks the visible Set, reads
 * getBoundingClientRect, computes progress, writes transform. Items
 * far off-screen aren't recalculated.
 *
 * Mapping:
 *   progress = clamp(1 - (rect.top + rect.height/2) / (vh + rect.height), 0, 1)
 *   tx       = (from + progress * range) * speed
 *   left:  from=+100, range=-160  →  +100% to -60%
 *   right: from=-100, range=+160  →  -100% to +60%
 *
 * The asymmetric 100 → -60 mapping (rather than ±80) is deliberate:
 * it biases the cross-viewport sweep slightly toward the leaving side,
 * which produces the "premium drift" feel seen in Awwwards portfolios.
 *
 * prefers-reduced-motion + builder editors: handled upstream by
 * main.js — this init() never runs in either case.
 */

const items = [];
const visible = new Set();
let ticking = false;
let scrollListenerAttached = false;
let io = null;

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

function tick() {
  const vh = window.innerHeight;
  visible.forEach((item) => {
    const rect = item.el.getBoundingClientRect();
    let progress = 1 - (rect.top + rect.height / 2) / (vh + rect.height);
    if (progress < 0) progress = 0;
    else if (progress > 1) progress = 1;

    let tx;
    if (item.direction === 'right') {
      // -100% → +60% as the page scrolls down.
      tx = (-100 + progress * 160) * item.speed;
    } else {
      // +100% → -60% as the page scrolls down (classic).
      tx = (100 + progress * -160) * item.speed;
    }
    item.el.style.transform = `translateX(${tx}%)`;
  });
  ticking = false;
}

function scheduleTick() {
  if (!ticking && visible.size > 0) {
    requestAnimationFrame(tick);
    ticking = true;
  }
}

function onScrollOrResize() {
  scheduleTick();
}

export function init(name) {
  if (prefersReducedMotion()) return;

  const direction = name === 'scroll-slide-right' ? 'right' : 'left';
  const selector = `.am-${name}`;

  const els = document.querySelectorAll(selector);
  if (!els.length) return;

  const mod = (window.animicroFrontData && window.animicroFrontData.moduleSettings)
    ? (window.animicroFrontData.moduleSettings[name] || {})
    : {};
  const defSpeed = clamp(safeFloat(mod.speed, 1), 0.1, 3);

  els.forEach((el) => {
    if (el.dataset.amScrollSlideInit === '1') return;
    el.dataset.amScrollSlideInit = '1';

    const speed = clamp(safeFloat(el.dataset.amSpeed, defSpeed), 0.1, 3);

    // GPU compositing — each scroll-slide element gets its own layer so
    // per-frame transform writes stay off the main thread.
    el.style.willChange = 'transform';

    items.push({ el, direction, speed });
  });

  if (!items.length) return;

  // IntersectionObserver: only tick items currently in (or near) the
  // viewport. rootMargin: 50% so we update slightly before the element
  // enters / leaves, avoiding visible "snap" at the edge.
  if (typeof IntersectionObserver === 'function') {
    if (io === null) {
      io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const item = items.find((it) => it.el === entry.target);
          if (!item) return;
          if (entry.isIntersecting) visible.add(item);
          else visible.delete(item);
        });
        scheduleTick();
      }, { rootMargin: '50% 0px' });
    }
    items.forEach((it) => {
      // io.observe is idempotent on the same node — safe across re-inits
      // for either flip-direction sharing the same items[] array.
      io.observe(it.el);
    });
  } else {
    // Old browsers: treat everything as visible. The cost is one extra
    // rAF per scroll event per element, but the IO target is universally
    // supported (caniuse > 99%) so this fallback is theoretical.
    items.forEach((it) => visible.add(it));
  }

  if (!scrollListenerAttached) {
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    scrollListenerAttached = true;
  }

  // Initial position update so the element doesn't flash at its natural
  // CSS layout for a frame before the first scroll event.
  requestAnimationFrame(tick);
}
