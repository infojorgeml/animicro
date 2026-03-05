import { animate, inView } from 'motion';
import { getElementConfig } from '../core/config.js';

export function init() {
  inView('.am-scale', (el) => {
    const cfg = getElementConfig(el);
    const from = el.dataset.scale !== undefined ? parseFloat(el.dataset.scale) : 0.95;

    animate(
      el,
      { opacity: [0, 1], scale: [from, 1] },
      { duration: cfg.duration, delay: cfg.delay, easing: cfg.easing }
    );

    el.classList.add('am-animated');
  }, { amount: 0.2 });
}
