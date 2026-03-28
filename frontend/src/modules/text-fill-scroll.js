import { animate, scroll } from 'motion';
import { getElementConfig } from '../core/config.js';

export function init() {
  const els = document.querySelectorAll('.am-text-fill-scroll');

  els.forEach((el) => {
    const cfg = getElementConfig(el, 'text-fill-scroll');

    el.style.setProperty('--color-base', cfg.colorBase);
    el.style.setProperty('--color-fill', cfg.colorFill);

    const originalText = el.innerText;
    el.setAttribute('aria-label', originalText);

    const words = originalText.split(' ');
    el.innerHTML = words.map(w =>
      `<span class="am-tfs-wrapper" aria-hidden="true">` +
        `<span class="am-tfs-base">${w}</span>` +
        `<span class="am-tfs-fill" style="opacity:0">${w}</span>` +
      `</span>`
    ).join(' ');

    el.classList.add('is-ready');

    const fills = el.querySelectorAll('.am-tfs-fill');
    const total = fills.length;

    fills.forEach((word, i) => {
      const sp = i / total;
      const ep = (i + 1) / total;

      scroll(
        animate(word, { opacity: [0, 1] }, { easing: 'linear' }),
        {
          target: el,
          offset: [
            `${sp * 100}% ${cfg.scrollStart}%`,
            `${ep * 100}% ${cfg.scrollEnd}%`,
          ],
        }
      );
    });

    el.classList.add('am-animated');
  });
}
