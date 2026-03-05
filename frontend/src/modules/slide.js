import { animate, inView } from 'motion';
import { getElementConfig } from '../core/config.js';

export function init(name) {
  const selector = `.am-${name}`;
  const isDown = name === 'slide-down';

  inView(selector, (el) => {
    const cfg = getElementConfig(el);
    const fromY = isDown ? -cfg.distance : cfg.distance;

    animate(
      el,
      { opacity: [0, 1], y: [fromY, 0] },
      { duration: cfg.duration, delay: cfg.delay, easing: cfg.easing }
    );

    el.classList.add('am-animated');
  }, { amount: 0.2 });
}
