import { animate, inView } from 'motion';
import { getElementConfig } from '../core/config.js';

export function init(name) {
  const selector = `.am-${name}`;
  const isHorizontal = name === 'slide-left' || name === 'slide-right';
  const isNegative = name === 'slide-down' || name === 'slide-right';
  const els = document.querySelectorAll(selector);
  if (!els.length) return;

  els.forEach((el) => {
    const cfg = getElementConfig(el, name);
    const from = isNegative ? -cfg.distance : cfg.distance;
    const axis = isHorizontal ? 'x' : 'y';

    inView(el, () => {
      animate(
        el,
        { opacity: [0, 1], [axis]: [from, 0] },
        { duration: cfg.duration, delay: cfg.delay, easing: cfg.easing }
      );
    }, { margin: cfg.margin });
  });
}
