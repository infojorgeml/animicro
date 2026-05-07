import { animate, inView } from 'motion';
import { getElementConfig } from '../core/config.js';

/**
 * Resolve the focal point (px) within the container rect based on origin name.
 */
function getOriginPoint(origin, rect) {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  switch (origin) {
    case 'top-left':     return { x: rect.left,  y: rect.top };
    case 'top':          return { x: cx,          y: rect.top };
    case 'top-right':    return { x: rect.right,  y: rect.top };
    case 'left':         return { x: rect.left,   y: cy };
    case 'right':        return { x: rect.right,  y: cy };
    case 'bottom-left':  return { x: rect.left,   y: rect.bottom };
    case 'bottom':       return { x: cx,          y: rect.bottom };
    case 'bottom-right': return { x: rect.right,  y: rect.bottom };
    default:             return { x: cx,          y: cy };
  }
}

function computeDelays(items, origin, containerRect, staggerDelay, baseDelay) {
  const count = items.length;
  if (!count) return [];

  if (origin === 'random') {
    return items.map(() => baseDelay + Math.random() * staggerDelay * (count - 1));
  }

  const focal = getOriginPoint(origin, containerRect);

  const indexed = items.map((child, i) => {
    const r = child.getBoundingClientRect();
    const dx = (r.left + r.width / 2) - focal.x;
    const dy = (r.top + r.height / 2) - focal.y;
    return { i, dist: Math.sqrt(dx * dx + dy * dy) };
  });

  indexed.sort((a, b) => a.dist - b.dist);

  const delays = new Array(count);
  indexed.forEach((entry, rank) => {
    delays[entry.i] = baseDelay + rank * staggerDelay;
  });

  return delays;
}

export function init() {
  const els = document.querySelectorAll('.am-grid-reveal');

  els.forEach((container) => {
    const cfg = getElementConfig(container, 'grid-reveal');
    const items = Array.from(container.children);
    if (!items.length) return;

    items.forEach(child => {
      child.style.opacity = '0';
      child.style.transform = `translateY(${cfg.distance}px)`;
    });
    container.classList.add('is-ready');

    inView(container, () => {
      const containerRect = container.getBoundingClientRect();
      const delays = computeDelays(items, cfg.origin, containerRect, cfg.staggerDelay, cfg.delay);

      items.forEach((child, i) => {
        animate(
          child,
          { opacity: [0, 1], y: [cfg.distance, 0] },
          {
            duration: cfg.duration,
            delay: delays[i],
            ease: cfg.easing,
          }
        );
      });
    }, { margin: cfg.margin });

    container.classList.add('am-animated');
  });
}
