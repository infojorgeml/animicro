import { animate, inView } from 'motion';
import { getElementConfig } from '../core/config.js';

export function init() {
  const els = document.querySelectorAll('.am-scale');
  if (!els.length) return;

  els.forEach((el) => {
    const cfg = getElementConfig(el, 'scale');

    inView(el, () => {
      animate(
        el,
        { opacity: [0, 1], scale: [cfg.scale, 1] },
        { duration: cfg.duration, delay: cfg.delay, easing: cfg.easing }
      );
    }, { margin: cfg.margin });
  });
}
