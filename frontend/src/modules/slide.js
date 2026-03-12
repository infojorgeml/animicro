import { animate, inView } from 'motion';
import { getElementConfig } from '../core/config.js';

export function init(name) {
  const selector = `.am-${name}`;
  const isDown = name === 'slide-down';
  const els = document.querySelectorAll(selector);
  if (!els.length) return;

  els.forEach((el) => {
    const cfg = getElementConfig(el, name);
    const fromY = isDown ? -cfg.distance : cfg.distance;

    inView(el, () => {
      animate(
        el,
        { opacity: [0, 1], y: [fromY, 0] },
        { duration: cfg.duration, delay: cfg.delay, easing: cfg.easing }
      );
    }, { margin: cfg.margin });
  });
}
