import { animate, inView } from 'motion';
import { getElementConfig, getLoopOptions } from '../core/config.js';

export function init() {
  const els = document.querySelectorAll('.am-fade');
  if (!els.length) return;

  els.forEach((el) => {
    const cfg = getElementConfig(el, 'fade');
    const loop = getLoopOptions(el);

    inView(el, () => {
      animate(
        el,
        { opacity: [0, 1] },
        { duration: cfg.duration, delay: cfg.delay, easing: cfg.easing, ...loop }
      );
    }, { margin: cfg.margin });
  });
}
