import { animate, stagger, inView } from 'motion';
import { getElementConfig } from '../core/config.js';

export function init() {
  inView('.am-stagger', (container) => {
    const cfg = getElementConfig(container);
    const staggerDelay = container.dataset.amStagger !== undefined
      ? parseFloat(container.dataset.amStagger)
      : 0.1;

    const children = container.children;
    if (!children.length) return;

    animate(
      children,
      { opacity: [0, 1], y: [cfg.distance, 0] },
      {
        duration: cfg.duration,
        delay: stagger(staggerDelay),
        easing: cfg.easing,
      }
    );

    container.classList.add('am-animated');
  }, { amount: 0.2 });
}
