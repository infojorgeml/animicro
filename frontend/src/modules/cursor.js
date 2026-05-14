/**
 * Custom Cursor — replaces the system cursor with a custom circle that
 * follows the mouse with smooth lerp interpolation. On hover over any
 * element carrying `.am-cursor-expand`, the cursor grows, applies a
 * glassmorphism style (backdrop-filter blur + semi-transparent
 * background), and optionally shows text from `data-am-cursor-text`.
 *
 * Auto-active: the module does not require any class on <body>. If the
 * module is in active_modules, the cursor is injected globally on the
 * frontend (mirrors magnet / magnetic which are also global).
 *
 * Activation conditions (ALL must be true):
 *   - NOT prefers-reduced-motion: reduce
 *   - NOT touch-only (coarse pointer AND not fine pointer)
 *   - window.innerWidth >= 992
 *   - NOT builder editor (gated by main.js)
 *
 * Per-element data-am-* attributes (on .am-cursor-expand targets):
 *   data-am-cursor-text   string, optional   — text shown inside the
 *                                              expanded cursor on hover
 *   data-am-cursor-size   float (px), opt.   — override the global
 *                                              hoverSize for this
 *                                              element only
 *
 * Module-level settings (admin global):
 *   size          4..40 px,   default 12     base cursor diameter
 *   color         hex,         default #000   base cursor background
 *   hoverSize     20..200 px,  default 90     diameter when hover
 *   hoverColor    hex,         default #0a0a0a hover background base
 *                                              (alpha applied separately)
 *   hoverOpacity  0..1,        default 0.75   hover alpha — combined
 *                                              with blur gives glass
 *   hoverBlur     0..30 px,    default 8      backdrop-filter blur
 *                                              amount (0 = no glass)
 *   smoothness    0.01..1,     default 0.15   lerp factor per frame
 *
 * Hide native cursor: handled by critical CSS in class-compatibility.php
 * (`body.am-cursor-active { cursor: none !important }` with explicit
 * exceptions for text-input fields so the I-beam stays visible).
 */

const DESKTOP_BREAKPOINT = 992;
const HOVER_TEXT_FONT_SIZE = '16px';

const state = { x: 0, y: 0, targetX: 0, targetY: 0 };
let cursorEl = null;
let active = false;
let rafId = null;
let resizeTimer = null;
let settings = null;
let initialised = false;

function safeFloat(raw, fallback) {
  if (raw === undefined || raw === null || raw === '') return fallback;
  const v = parseFloat(raw);
  return Number.isFinite(v) ? v : fallback;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function sanitizeHex(raw, fallback) {
  if (typeof raw !== 'string') return fallback;
  const t = raw.trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(t) ? t : fallback;
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

function canActivate() {
  if (prefersReducedMotion()) return false;
  if (isTouchOnly()) return false;
  if (window.innerWidth < DESKTOP_BREAKPOINT) return false;
  return true;
}

function rgbaFromHex(hex, alpha) {
  // Accepts #rgb / #rrggbb. Returns the original string unchanged if
  // parsing fails (browser will accept a plain hex).
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return hex;
  let h = m[1];
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function buildCursorEl() {
  const el = document.createElement('div');
  el.id = 'am-cursor';
  // Inline override for the user-configurable size and base color.
  // Static positioning / transition / z-index live in the critical CSS.
  el.style.width  = settings.size + 'px';
  el.style.height = settings.size + 'px';
  el.style.background = settings.color;
  document.body.appendChild(el);
  return el;
}

function onMouseMove(e) {
  state.targetX = e.clientX;
  state.targetY = e.clientY;
}

function applyHover(target) {
  if (!cursorEl) return;
  const sizeAttr = parseFloat(target.dataset.amCursorSize);
  const size = Number.isFinite(sizeAttr)
    ? Math.max(20, Math.min(400, sizeAttr))
    : settings.hoverSize;
  const text = target.dataset.amCursorText || '';
  const blur = settings.hoverBlur > 0 ? `blur(${settings.hoverBlur}px)` : 'none';

  cursorEl.style.width  = size + 'px';
  cursorEl.style.height = size + 'px';
  cursorEl.style.background = rgbaFromHex(settings.hoverColor, settings.hoverOpacity);
  cursorEl.style.backdropFilter = blur;
  cursorEl.style.webkitBackdropFilter = blur;
  cursorEl.style.fontSize = text ? HOVER_TEXT_FONT_SIZE : '0px';
  cursorEl.textContent = text;
}

function clearHover() {
  if (!cursorEl) return;
  cursorEl.style.width  = settings.size + 'px';
  cursorEl.style.height = settings.size + 'px';
  cursorEl.style.background = settings.color;
  cursorEl.style.backdropFilter = 'none';
  cursorEl.style.webkitBackdropFilter = 'none';
  cursorEl.style.fontSize = '0px';
  cursorEl.textContent = '';
}

function onMouseOver(e) {
  const target = e.target && e.target.closest && e.target.closest('.am-cursor-expand');
  if (target) applyHover(target);
}

function onMouseOut(e) {
  const target = e.target && e.target.closest && e.target.closest('.am-cursor-expand');
  if (target) clearHover();
}

function tick() {
  state.x += (state.targetX - state.x) * settings.smoothness;
  state.y += (state.targetY - state.y) * settings.smoothness;
  if (cursorEl) {
    cursorEl.style.left = state.x + 'px';
    cursorEl.style.top  = state.y + 'px';
  }
  rafId = requestAnimationFrame(tick);
}

function activate() {
  if (active) return;
  cursorEl = buildCursorEl();
  document.body.classList.add('am-cursor-active');
  window.addEventListener('mousemove', onMouseMove, { passive: true });
  document.addEventListener('mouseover', onMouseOver);
  document.addEventListener('mouseout',  onMouseOut);
  rafId = requestAnimationFrame(tick);
  active = true;
}

function deactivate() {
  if (!active) return;
  if (cursorEl) { cursorEl.remove(); cursorEl = null; }
  document.body.classList.remove('am-cursor-active');
  window.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseover', onMouseOver);
  document.removeEventListener('mouseout',  onMouseOut);
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  active = false;
}

function onResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (canActivate()) activate();
    else deactivate();
  }, 120);
}

export function init() {
  if (initialised) return;
  initialised = true;

  const mod = (window.animicroFrontData && window.animicroFrontData.moduleSettings)
    ? (window.animicroFrontData.moduleSettings.cursor || {})
    : {};

  settings = {
    size:         clamp(safeFloat(mod.size,         12),    4,    40),
    color:        sanitizeHex(mod.color,         '#000000'),
    hoverSize:    clamp(safeFloat(mod.hoverSize,    90),   20,   200),
    hoverColor:   sanitizeHex(mod.hoverColor,    '#0a0a0a'),
    hoverOpacity: clamp(safeFloat(mod.hoverOpacity, 0.75),  0,     1),
    hoverBlur:    clamp(safeFloat(mod.hoverBlur,     8),    0,    30),
    smoothness:   clamp(safeFloat(mod.smoothness,  0.15), 0.01,   1),
  };

  if (canActivate()) activate();

  // Reactive to viewport changes — drop the cursor when crossing the
  // breakpoint downward, bring it back when going up. Debounced so a
  // resize drag doesn't thrash activate/deactivate every pixel.
  window.addEventListener('resize', onResize, { passive: true });
}
