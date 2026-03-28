import { inView } from 'motion';
import { getElementConfig } from '../core/config.js';

export function init() {
  const els = document.querySelectorAll('.am-highlight');

  els.forEach((el) => {
    const cfg = getElementConfig(el, 'highlight');

    const inner = document.createElement('span');
    inner.className = 'am-highlight-inner';
    inner.style.setProperty('--am-hl-color', cfg.highlightColor);
    inner.style.setProperty('--am-hl-origin', cfg.highlightDirection);
    inner.style.setProperty('--am-hl-duration', cfg.duration + 's');
    inner.style.setProperty('--am-hl-easing', cfg.easing);
    inner.style.setProperty('--am-hl-delay', cfg.delay + 's');

    inner.innerHTML = el.innerHTML;
    el.innerHTML = '';
    el.appendChild(inner);
    el.classList.add('is-ready');

    inView(el, () => {
      inner.classList.add('am-highlight-active');
    }, { margin: cfg.margin });

    el.classList.add('am-animated');
  });
}
