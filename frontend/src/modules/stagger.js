import { animate, stagger, inView } from 'motion';
import { getElementConfig } from '../core/config.js';

export function init() {
  const els = document.querySelectorAll('.am-stagger');

  els.forEach((container) => {
    const cfg = getElementConfig(container, 'stagger');
    const items = Array.from(container.children);
    if (!items.length) return;

    items.forEach(child => {
      child.style.opacity = '0';
      child.style.transform = `translateY(${cfg.distance}px)`;
    });
    container.classList.add('is-ready');

    inView(container, () => {
      animate(
        items,
        { opacity: [0, 1], y: [cfg.distance, 0] },
        {
          duration: cfg.duration,
          delay: stagger(cfg.staggerDelay, { start: cfg.delay }),
          ease: cfg.easing,
        }
      );
    }, { margin: cfg.margin });

    container.classList.add('am-animated');
  });
}
