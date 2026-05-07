import { animate, inView } from 'motion';
import { getElementConfig, getLoopOptions } from '../core/config.js';

export function init() {
  const els = document.querySelectorAll('.am-blur');
  if (!els.length) return;

  els.forEach((el) => {
    const cfg = getElementConfig(el, 'blur');
    const loop = getLoopOptions(el);

    inView(el, () => {
      animate(
        el,
        { opacity: [0, 1], filter: [`blur(${cfg.blur}px)`, 'blur(0px)'] },
        { duration: cfg.duration, delay: cfg.delay, ease: cfg.easing, ...loop }
      );
    }, { margin: cfg.margin });
  });
}
