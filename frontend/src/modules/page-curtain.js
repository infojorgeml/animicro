import { animate } from 'motion';
import { parseEasing } from '../core/config.js';

/**
 * Page Curtain — full-screen overlay that covers the viewport at first
 * paint and animates out once DOMContentLoaded fires.
 *
 * The overlay <div id="am-page-curtain"> is injected by PHP via the
 * wp_body_open hook (see includes/class-frontend.php::output_page_curtain).
 * Its critical CSS (position, z-index, background, layout for the optional
 * logo) is in the inline stylesheet emitted by class-compatibility.php so
 * it covers the screen from the very first paint with no flash.
 *
 * Three directions, read from the overlay's data-am-direction attribute
 * (which PHP set based on the admin setting):
 *  - fade       — opacity 1 → 0
 *  - slide-up   — y 0 → -100% (overlay slides up off-screen)
 *  - slide-down — y 0 → +100% (overlay slides down off-screen)
 *
 * On finish, the overlay is removed from the DOM so it can't intercept
 * any future event or layout.
 *
 * Honors `prefers-reduced-motion: reduce` by removing the overlay
 * immediately without animating. Honors builder editors via PHP not
 * emitting the overlay at all inside them.
 */

const globals = window.animicroFrontData || {};

export function init() {
  const overlay = document.getElementById('am-page-curtain');
  if (!overlay) return;   // PHP didn't emit it — module inactive or builder editor

  // prefers-reduced-motion: drop the overlay, no animation.
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    overlay.remove();
    return;
  }

  const mod = (globals.moduleSettings && globals.moduleSettings['page-curtain']) || {};
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
