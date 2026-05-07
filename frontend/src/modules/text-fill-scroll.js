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
    // Build the word wrappers via DOM APIs (not innerHTML) so any user-visible
    // text containing HTML-like characters cannot be re-parsed as markup.
    el.innerHTML = '';
    words.forEach((w, i) => {
      if (i > 0) el.appendChild(document.createTextNode(' '));

      const wrapper = document.createElement('span');
      wrapper.className = 'am-tfs-wrapper';
      wrapper.setAttribute('aria-hidden', 'true');

      const base = document.createElement('span');
      base.className = 'am-tfs-base';
      base.textContent = w;

      const fill = document.createElement('span');
      fill.className = 'am-tfs-fill';
      fill.style.opacity = '0';
      fill.textContent = w;

      wrapper.appendChild(base);
      wrapper.appendChild(fill);
      el.appendChild(wrapper);
    });

    el.classList.add('is-ready');

    const fills = el.querySelectorAll('.am-tfs-fill');
    const total = fills.length;

    fills.forEach((word, i) => {
      const sp = i / total;
      const ep = (i + 1) / total;

      scroll(
        animate(word, { opacity: [0, 1] }, { ease: 'linear' }),
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
