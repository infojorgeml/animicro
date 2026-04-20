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

  el.classList.add('is-ready');

  return el.querySelectorAll('span');
}

export function init() {
  const els = document.querySelectorAll('.am-split-chars, .am-split-words');

  els.forEach((el) => {
    const mode = el.classList.contains('am-split-words') ? 'words' : 'chars';
    const cfg = getElementConfig(el, 'split');

    const spans = splitIntoSpans(el, mode);
    if (!spans.length) return;

    inView(el, () => {
      animate(
        spans,
        { opacity: [0, 1], y: [cfg.distance, 0] },
        {
          duration: cfg.duration,
          delay: stagger(cfg.staggerDelay, { start: cfg.delay }),
          easing: cfg.easing,
        }
      );
    }, { margin: cfg.margin });

    el.classList.add('am-animated');
  });
}
