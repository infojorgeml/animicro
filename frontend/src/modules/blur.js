import { animate, inView } from 'motion';
import { getElementConfig } from '../core/config.js';

export function init() {
  inView('.am-blur', (el) => {
    const cfg = getElementConfig(el);
    const amount = el.dataset.amBlur !== undefined ? parseFloat(el.dataset.amBlur) : 4;

    animate(
      el,
      { opacity: [0, 1], filter: [`blur(${amount}px)`, 'blur(0px)'] },
      { duration: cfg.duration, delay: cfg.delay, easing: cfg.easing }
    );

    el.classList.add('am-animated');
  }, { amount: 0.2 });
}
