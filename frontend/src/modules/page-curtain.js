import { animate } from 'motion';
import { parseEasing } from '../core/config.js';

/**
 * Page Curtain — full-page overlay that animates IN before navigating
 * away and OUT after the next page loads.
 *
 * Two phases:
 *
 *   1) ENTRY (on every page load):
 *      includes/class-frontend.php emits <div id="am-page-curtain"> via the
 *      `wp_body_open` hook, and includes/class-compatibility.php emits the
 *      critical CSS that makes it cover the viewport from the very first
 *      paint. This module animates it OUT and removes it from the DOM.
 *
 *   2) EXIT (on internal link click):
 *      We listen for clicks on <a> tags via a capture-phase document
 *      listener. For links that pass the safety filters (same-origin,
 *      no modifier keys, no target="_blank", not a #anchor, etc.) we
 *      prevent the default navigation, create a fresh overlay, animate
 *      it IN until it covers the viewport, and only then navigate via
 *      `window.location.href`. The result is a fluid black/white/branded
 *      transition between pages instead of the harsh paint-and-flash
 *      that normal page loads produce.
 *
 * Direction handling — keyframes follow the theatre-curtain metaphor:
 * the cortina enters from one side, then leaves through the OPPOSITE side
 * once the new page is ready (just like a stage curtain falls from above
 * to cover the scene, then rises away to reveal the next one).
 *
 *   slide-up   exit:  y -100% → 0      (cortina FALLS from above to cover)
 *              entry: y    0% → -100%  (cortina RISES upward to reveal)
 *   slide-down exit:  y  100% → 0      (cortina RISES from below to cover)
 *              entry: y    0% → 100%   (cortina FALLS downward to reveal)
 *   fade       exit:  opacity 0 → 1    (cortina fades in)
 *              entry: opacity 1 → 0    (cortina fades out)
 *
 * Builder editors: skipped at main.js level (this init() never runs).
 *
 * prefers-reduced-motion: removes any existing overlay immediately and
 * never registers the click interceptor — the visitor gets normal
 * browser navigation, no animation, no fancy stuff.
 *
 * bfcache safety: when the visitor uses the browser back button, the
 * page is restored from the disk cache with the (post-click) overlay
 * still in the DOM. We listen for `pageshow` with `event.persisted`
 * true and remove it so the cached page is usable again.
 *
 * Opt-out per link: any <a> with `data-no-curtain` attribute or the
 * class `no-curtain` is left alone. Useful for download links, links
 * that trigger plugin-specific behaviour (lightboxes, ajax cart, etc.),
 * or anything the site author wants to keep "instant".
 */

const globals = window.animicroFrontData || {};

function getCfg() {
  return (globals.moduleSettings && globals.moduleSettings['page-curtain']) || {};
}

function getKeyframes(direction, phase) {
  // phase === 'out' : the cortina is leaving (entry transition — reveal).
  // phase === 'in'  : the cortina is arriving (exit transition — cover).
  //
  // Theatre-curtain semantics: the cortina enters from one side and leaves
  // through the OPPOSITE side, so the two halves of the transition feel
  // like a continuous "drop then lift" gesture instead of two parallel
  // slides in the same direction.
  switch (direction) {
    case 'slide-up':
      // cortina falls from above to cover, then rises upward to reveal.
      return phase === 'out'
        ? { y: ['0%', '-100%'] }     // entry: rise away upward
        : { y: ['-100%', '0%'] };    // exit:  fall from above
    case 'slide-down':
      // cortina rises from below to cover, then falls downward to reveal.
      return phase === 'out'
        ? { y: ['0%', '100%'] }      // entry: fall away downward
        : { y: ['100%', '0%'] };     // exit:  rise from below
    case 'fade':
    default:
      return phase === 'out'
        ? { opacity: [1, 0] }
        : { opacity: [0, 1] };
  }
}

function buildOverlay(cfg) {
  const overlay = document.createElement('div');
  overlay.id = 'am-page-curtain';
  overlay.dataset.amDirection = cfg.direction || 'fade';
  // Hard-coded inline styles so the fallback path works even if the
  // critical CSS didn't reach the page (theme without wp_head, etc.).
  Object.assign(overlay.style, {
    position:       'fixed',
    inset:          '0',
    zIndex:         '999999',
    background:     cfg.bgColor || '#000000',
    pointerEvents:  'none',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
  });
  if (cfg.logoUrl) {
    const img = document.createElement('img');
    img.src = cfg.logoUrl;
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
  return overlay;
}

/**
 * Decide whether a click should be intercepted for the exit transition.
 * Returns true only for "I want this navigation to feel curtain-y"
 * clicks; everything else falls through to the browser's default.
 */
function shouldInterceptClick(event, link) {
  if (event.defaultPrevented) return false;
  // Left click only. Middle/right/aux: user intent is "open elsewhere".
  if (event.button !== 0) return false;
  // Modifier keys: user intent is open-in-new-tab / save / etc.
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;

  // Opt-outs.
  if (link.hasAttribute('data-no-curtain')) return false;
  if (link.classList.contains('no-curtain')) return false;
  if (link.hasAttribute('download')) return false;

  // target=_blank / named target: not our concern.
  const target = link.getAttribute('target');
  if (target && target !== '' && target !== '_self') return false;

  // Href sanity.
  const href = link.getAttribute('href');
  if (!href) return false;
  const trimmed = href.trim();
  if (trimmed === '') return false;
  if (trimmed.startsWith('#')) return false;
  const lowered = trimmed.toLowerCase();
  if (lowered.startsWith('mailto:'))     return false;
  if (lowered.startsWith('tel:'))        return false;
  if (lowered.startsWith('sms:'))        return false;
  if (lowered.startsWith('javascript:')) return false;

  // Same-origin check via resolved URL.
  let url;
  try {
    url = new URL(link.href, document.baseURI);
  } catch {
    return false;
  }
  if (url.origin !== window.location.origin) return false;

  // Same page (hash-only change): treat as in-page anchor, let it through.
  if (
    url.pathname === window.location.pathname &&
    url.search   === window.location.search
  ) {
    return false;
  }

  return true;
}

let exitInProgress = false;

async function performExit(url) {
  if (exitInProgress) return;
  exitInProgress = true;

  const cfg     = getCfg();
  const overlay = buildOverlay(cfg);
  if (!document.body) {
    // Defensive — should never happen because click events come after body.
    window.location.href = url;
    return;
  }
  document.body.appendChild(overlay);

  const duration  = Number.isFinite(+cfg.duration) ? +cfg.duration : 0.8;
  const delay     = Number.isFinite(+cfg.delay)    ? +cfg.delay    : 0;
  const ease      = parseEasing(cfg.easing || 'easeOut');
  const direction = cfg.direction || 'fade';
  const keyframes = getKeyframes(direction, 'in');

  try {
    await animate(overlay, keyframes, { duration, delay, ease }).finished;
  } catch {
    // Animation interrupted — navigate anyway so the user isn't stuck.
  }

  window.location.href = url;
}

function handleClick(event) {
  // Walk up from the event target to find the nearest <a>, in case the
  // user clicked on an inner element (icon, image, span).
  const link = event.target.closest ? event.target.closest('a') : null;
  if (!link) return;
  if (!shouldInterceptClick(event, link)) return;

  event.preventDefault();
  performExit(link.href);
}

function performEntry() {
  const overlay = document.getElementById('am-page-curtain');
  if (!overlay) return;

  const cfg       = getCfg();
  const duration  = Number.isFinite(+cfg.duration) ? +cfg.duration : 0.8;
  const delay     = Number.isFinite(+cfg.delay)    ? +cfg.delay    : 0;
  const ease      = parseEasing(cfg.easing || 'easeOut');
  // Trust the PHP-set data attribute for entry — falls back to settings.
  const direction = overlay.dataset.amDirection || cfg.direction || 'fade';
  const keyframes = getKeyframes(direction, 'out');

  animate(overlay, keyframes, { duration, delay, ease }).finished
    .then(() => overlay.remove())
    .catch(() => overlay.remove());
}

function handlePageShow(event) {
  if (!event.persisted) return;
  // Page was restored from bfcache; the exit overlay we attached before
  // navigating is still in the DOM. Clean it up so the cached page is
  // visible again.
  const overlay = document.getElementById('am-page-curtain');
  if (overlay) overlay.remove();
  exitInProgress = false;
}

export function init() {
  // prefers-reduced-motion: visitor opted out of motion. Skip entry
  // animation (just drop the overlay) and don't intercept any clicks.
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    const overlay = document.getElementById('am-page-curtain');
    if (overlay) overlay.remove();
    return;
  }

  // 1) Entry animation — animate the PHP-injected overlay out.
  performEntry();

  // 2) Exit interceptor — capture-phase listener so we run before any
  //    other click handlers (smooth-scroll, builder anchor logic, etc.)
  //    that might call preventDefault on us.
  document.addEventListener('click', handleClick, { capture: true });

  // 3) bfcache safety — strip the exit overlay when the user navigates
  //    back to a cached page.
  window.addEventListener('pageshow', handlePageShow);
}
