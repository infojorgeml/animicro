import { animate } from 'motion';
import { parseEasing } from '../core/config.js';

/**
 * Page Curtain — full-screen overlay that covers the viewport at first
 * paint and animates out once DOMContentLoaded fires.
 *
 * Primary path (no-flash): includes/class-frontend.php emits the overlay
 * <div id="am-page-curtain"> on the `wp_body_open` hook (WordPress 5.2+),
 * and includes/class-compatibility.php emits the critical CSS that makes
 * it cover the viewport from the very first paint. This module animates
 * it out and removes it from the DOM.
 *
 * Fallback path: if PHP never emitted the overlay (a legacy theme that
 * doesn't call `wp_body_open()`, or some plugin that swallows that
 * hook), we still try to inject + animate it from JS. The user will see
 * the page content briefly before the overlay drops in, which is
 * uglier than the no-flash path — but it still respects the setting
 * the user enabled rather than silently doing nothing.
 *
 * Three directions, read from the overlay's data-am-direction attribute
 * (set by PHP). In the JS-fallback path we fall back to settings:
 *  - fade       — opacity 1 → 0
 *  - slide-up   — y 0 → -100% (overlay slides up off-screen)
 *  - slide-down — y 0 → +100% (overlay slides down off-screen)
 *
 * Honors `prefers-reduced-motion: reduce`: removes the overlay (or
 * skips creating it) without animating.
 *
 * Honors builder editors: main.js short-circuits before init() runs.
 * PHP also avoids emitting the overlay inside builders.
 */

const globals = window.animicroFrontData || {};

function createFallbackOverlay(settings) {
  const overlay = document.createElement('div');
  overlay.id = 'am-page-curtain';
  overlay.dataset.amDirection = settings.direction || 'fade';
  // Inline styles only (no CSS variable dance) — the critical CSS isn't
  // guaranteed to be present in the fallback path, so we hard-code the
  // styles we need to cover the viewport.
  Object.assign(overlay.style, {
    position:       'fixed',
    inset:          '0',
    zIndex:         '999999',
    background:     settings.bgColor || '#000000',
    pointerEvents:  'none',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
  });
  if (settings.logoUrl) {
    const img = document.createElement('img');
    img.src = settings.logoUrl;
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    Object.assign(img.style, {
      maxWidth:  '200px',
      maxHeight: '200px',
      width:     'auto',
      height:    'auto',
    });
    overlay.appendChild(img);
  }
  document.body.appendChild(overlay);
  return overlay;
}

export function init() {
  const mod = (globals.moduleSettings && globals.moduleSettings['page-curtain']) || {};

  // prefers-reduced-motion: drop or never create the overlay.
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    const existing = document.getElementById('am-page-curtain');
    if (existing) existing.remove();
    return;
  }

  // Primary path: PHP injected the overlay via wp_body_open. Fallback:
  // create it from JS (with a small flash because the browser already
  // painted the page content underneath).
  let overlay = document.getElementById('am-page-curtain');
  if (!overlay) {
    if (!document.body) return;   // page is too early — bail safely
    overlay = createFallbackOverlay(mod);
  }

  const duration  = Number.isFinite(+mod.duration) ? +mod.duration : 0.8;
  const delay     = Number.isFinite(+mod.delay)    ? +mod.delay    : 0;
  const ease      = parseEasing(mod.easing || 'easeOut');
  const direction = overlay.dataset.amDirection || 'fade';

  let keyframes;
  switch (direction) {
    case 'slide-up':
      keyframes = { y: ['0%', '-100%'] };
      break;
    case 'slide-down':
      keyframes = { y: ['0%', '100%'] };
      break;
    case 'fade':
    default:
      keyframes = { opacity: [1, 0] };
      break;
  }

  animate(overlay, keyframes, { duration, delay, ease }).finished
    .then(() => {
      overlay.remove();
    })
    .catch(() => {
      // Animation interrupted (rare). Still remove the overlay so the
      // page stays usable.
      overlay.remove();
    });
}
