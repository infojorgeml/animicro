import { animate, scroll } from 'motion';
import { getElementConfig } from '../core/config.js';

export function init() {
  const els = document.querySelectorAll('.am-parallax');

  els.forEach((el) => {
    const cfg = getElementConfig(el, 'parallax');
    const distance = cfg.speed * 100;

    scroll(
      animate(el, { y: [-distance, distance] }, { ease: 'linear' }),
      { target: el }
    );

    el.classList.add('am-animated');
  });
}
