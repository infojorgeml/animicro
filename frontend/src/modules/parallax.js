import { animate, scroll } from 'motion';

export function init() {
  const elements = document.querySelectorAll('.am-parallax');

  elements.forEach((el) => {
    const speed = el.dataset.amSpeed !== undefined ? parseFloat(el.dataset.amSpeed) : 0.5;
    const distance = speed * 100;

    scroll(
      animate(el, { y: [-distance, distance] }, { easing: 'linear' }),
      { target: el }
    );
  });
}
