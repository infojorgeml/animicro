import { inView } from 'motion';
import { getElementConfig } from '../core/config.js';

const ALLOWED_ORIGINS = ['left', 'right', 'center'];

/** Clamp a number to [min, max] with a safe fallback for NaN. */
function clamp(n, min, max, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(Math.max(v, min), max);
}

export function init() {
  const els = document.querySelectorAll('.am-highlight');

  els.forEach((el) => {
    // Guard against double-init (e.g. hot reload or re-enqueue).
    if (el.dataset.amHighlightReady === '1') return;

    const cfg = getElementConfig(el, 'highlight');

    // Clamp numeric config to the same bounds the admin enforces,
    // so bad data-am-* values on page elements can't explode the UI.
    const duration = clamp(cfg.duration, 0, 10, 0.8);
    const delay    = clamp(cfg.delay,    0, 10, 0);

    // Validate direction against the small allow-list.
    const origin = ALLOWED_ORIGINS.includes(cfg.highlightDirection)
      ? cfg.highlightDirection
      : 'left';

    const inner = document.createElement('span');
    inner.className = 'am-highlight-inner';
    inner.style.setProperty('--am-hl-color',    cfg.highlightColor);
    inner.style.setProperty('--am-hl-origin',   origin);
    inner.style.setProperty('--am-hl-duration', duration + 's');
    inner.style.setProperty('--am-hl-easing',   cfg.easing);
    inner.style.setProperty('--am-hl-delay',    delay + 's');

    // Move children (preserves nested elements & event listeners) instead of innerHTML copy.
    while (el.firstChild) {
      inner.appendChild(el.firstChild);
    }
    el.appendChild(inner);
    el.dataset.amHighlightReady = '1';
    el.classList.add('is-ready');

    inView(el, () => {
      inner.classList.add('am-highlight-active');
    }, { margin: cfg.margin });

    el.classList.add('am-animated');
  });
}
