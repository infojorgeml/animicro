import { animate, scroll } from 'motion';
import { getElementConfig } from '../core/config.js';

/**
 * Image Parallax — "window effect".
 *
 * The element box does NOT move — only the inner image translates Y as the
 * frame traverses the viewport, producing a subtle window/peephole effect.
 *
 * Two valid placements:
 *   1) Class on a wrapper that contains an <img> (or any single child):
 *        <div class="am-img-parallax"><img …></div>
 *      → frame = the div, target = the inner image
 *   2) Class directly on the <img> (most common in builders like Bricks /
 *      Elementor where the image element receives custom classes):
 *        <img class="am-img-parallax" …>
 *      → we generate a <span class="am-img-parallax-frame"> wrapper around
 *        the <img> and use that as the frame, so we never depend on the
 *        builder's parent layout/overflow rules.
 *
 * The frame always has `overflow: hidden` (set explicitly) and the inner
 * image is overscaled so the ±speed*100px translation never reveals the
 * frame edges.
 *
 * Honors `prefers-reduced-motion: reduce` by skipping init.
 *
 * Attributes:
 *   data-am-speed  float (default 0.2 via class-animicro.php; clamped 0..1)
 */

function wrapImage(img) {
  // Build a wrapper that visually replaces the img in layout, then move
  // the img inside it. Inline-block keeps it fitting tight to the image
  // unless the image was display:block (then we mirror that).
  const wrapper = document.createElement('span');
  wrapper.className = 'am-img-parallax-frame';
  wrapper.style.display       = 'block';
  wrapper.style.overflow      = 'hidden';
  wrapper.style.position      = 'relative';
  // Width follows the image's rendered width; let the browser size it.
  wrapper.style.lineHeight    = '0';
  wrapper.style.maxWidth      = '100%';

  const parent = img.parentNode;
  if (!parent) return null;
  parent.insertBefore(wrapper, img);
  wrapper.appendChild(img);

  // Ensure the img fills the wrapper exactly so the overscale is symmetric.
  img.style.display    = 'block';
  img.style.width      = '100%';
  img.style.height     = 'auto';
  img.style.maxWidth   = '100%';

  return wrapper;
}

export function init() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const els = document.querySelectorAll('.am-img-parallax');

  els.forEach((el) => {
    if (el.dataset.amImgParallaxInit === '1') return;
    el.dataset.amImgParallaxInit = '1';

    let frame, target;

    if (el.tagName === 'IMG') {
      // Class on the image — generate our own wrapper for a guaranteed clip.
      const wrapper = wrapImage(el);
      if (!wrapper) return;
      frame  = wrapper;
      target = el;
    } else {
      // Class on a wrapper — find the inner image (or first child).
      frame  = el;
      target = el.querySelector('img') || el.firstElementChild;
      if (!target) return;
      // Force a clip on the author's wrapper.
      frame.style.overflow = 'hidden';
    }

    const cfg      = getElementConfig(el, 'img-parallax');
    const speed    = Math.max(0, Math.min(1, cfg.speed));
    const distance = speed * 100;

    // Overscale the inner image so ±distance translation never reveals the
    // frame's empty edges. We need (scale - 1) / 2 * frameHeight >= distance,
    // i.e. scale >= 1 + 2*distance/frameHeight. Measure the frame at init,
    // add a safety margin, and floor with a sensible static minimum so very
    // tall/short frames still look right. Capped at 2 to avoid extreme blur.
    const measure = () => {
      const h = frame.getBoundingClientRect().height || target.getBoundingClientRect().height || 1;
      const required = 1 + (2 * distance) / h + 0.05; // 5% safety
      const minimum  = 1 + speed * 0.5;
      return Math.min(2, Math.max(minimum, required));
    };
    const overscale = measure();
    target.style.willChange = 'transform';

    scroll(
      animate(
        target,
        { y: [distance, -distance], scale: [overscale, overscale] },
        { easing: 'linear' }
      ),
      { target: frame }
    );

    el.classList.add('am-animated');
  });
}
