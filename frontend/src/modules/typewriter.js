import { inView } from 'motion';
import { getElementConfig } from '../core/config.js';

/** Clamp a number to [min, max] with a safe fallback for NaN. */
function clamp(n, min, max, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(Math.max(v, min), max);
}

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function init() {
  const els = document.querySelectorAll('.am-typewriter');
  if (!els.length) return;

  const reduced = prefersReducedMotion();

  els.forEach((el) => {
    // Guard against double-init (hot reload / re-enqueue).
    if (el.dataset.amTypewriterReady === '1') return;

    const cfg = getElementConfig(el, 'typewriter');

    // Clamp values to the admin's sanitized range, protecting against
    // bad data-am-* attributes on the page element.
    const typingSpeed = clamp(cfg.typingSpeed, 0.01, 2, 0.06);
    const startDelay  = clamp(cfg.delay,       0,    10, 0) * 1000;

    // Use textContent (not innerHTML) — typewriter is plain-text only; any
    // nested markup would be meaningless character-by-character anyway.
    const fullText = el.textContent.replace(/\s+/g, ' ').trim();
    if (!fullText) return;

    // Accessibility: expose the full string to assistive tech and hide the animated text.
    el.setAttribute('aria-label', fullText);

    // Structure:  <el> <span.am-tw-text>typed…</span><span.am-tw-cursor aria-hidden>|</span> </el>
    // Keeps character insertions O(1) (single text node) instead of appending new nodes.
    el.textContent = '';

    const textSpan = document.createElement('span');
    textSpan.className = 'am-tw-text';
    const textNode = document.createTextNode('');
    textSpan.appendChild(textNode);

    const cursor = document.createElement('span');
    cursor.className = 'am-tw-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.textContent = el.dataset.amCursor || '|';

    el.appendChild(textSpan);
    el.appendChild(cursor);
    el.dataset.amTypewriterReady = '1';
    el.classList.add('is-ready');

    // Respect reduced motion: show the full text immediately, skip cursor blink.
    if (reduced) {
      textNode.data = fullText;
      cursor.remove();
      el.classList.add('am-animated');
      return;
    }

    let timerId = 0;
    let i = 0;

    function tick() {
      if (i < fullText.length) {
        textNode.data += fullText[i++];
        timerId = window.setTimeout(tick, typingSpeed * 1000);
      } else {
        // After a short beat, fade the cursor out and remove it.
        window.setTimeout(() => {
          cursor.style.transition = 'opacity 0.4s';
          cursor.style.opacity = '0';
          window.setTimeout(() => cursor.remove(), 450);
        }, 600);
      }
    }

    inView(el, () => {
      timerId = window.setTimeout(tick, startDelay);
    }, { margin: cfg.margin });

    // Expose a canceller on the element in case something wants to stop it (tests, HMR).
    el._amTypewriterCancel = () => {
      if (timerId) window.clearTimeout(timerId);
      timerId = 0;
    };

    el.classList.add('am-animated');
  });
}
