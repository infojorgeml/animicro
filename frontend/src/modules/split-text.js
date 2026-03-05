import { animate, stagger, inView } from 'motion';
import { getElementConfig } from '../core/config.js';

function splitIntoSpans(el, mode) {
  const text = el.textContent;
  el.setAttribute('aria-label', text);
  el.innerHTML = '';

  const units = mode === 'words' ? text.split(/(\s+)/) : [...text];

  units.forEach((unit) => {
    if (/^\s+$/.test(unit)) {
      el.appendChild(document.createTextNode(unit));
      return;
    }

    const span = document.createElement('span');
    span.textContent = unit;
    span.style.display = 'inline-block';
    span.style.opacity = '0';
    span.setAttribute('aria-hidden', 'true');
    el.appendChild(span);
  });

  return el.querySelectorAll('span');
}

export function init() {
  inView('.am-split', (el) => {
    const cfg = getElementConfig(el);
    const mode = el.dataset.split || 'chars';
    const staggerDelay = el.dataset.stagger !== undefined
      ? parseFloat(el.dataset.stagger)
      : 0.05;

    const spans = splitIntoSpans(el, mode);
    if (!spans.length) return;

    animate(
      spans,
      { opacity: [0, 1], y: [cfg.distance * 0.5, 0] },
      {
        duration: cfg.duration,
        delay: stagger(staggerDelay),
        easing: cfg.easing,
      }
    );

    el.classList.add('am-animated');
  }, { amount: 0.2 });
}
