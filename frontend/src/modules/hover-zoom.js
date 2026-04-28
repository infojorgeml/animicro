import { animate } from 'motion';

/**
 * Hover Zoom: scale up on mouseenter, return on mouseleave.
 *
 * Two valid placements:
 *   1) Class on a wrapper that contains an <img> (or any single child):
 *        <div class="am-hover-zoom"><img …></div>
 *      → frame = the div (forced overflow:hidden), target = the inner image
 *   2) Class directly on the <img> (most common in builders like Bricks /
 *      Elementor where the image element receives custom classes):
 *        <img class="am-hover-zoom" …>
 *      → we generate a <span class="am-hover-zoom-frame"> wrapper around
 *        the <img> with overflow:hidden, so the zoom stays clipped to the
 *        image's bounding box without depending on the builder's parent
 *        layout / padding / radius rules.
 *
 * Honors `prefers-reduced-motion: reduce` by attaching no listeners.
 *
 * Attributes:
 *   data-am-zoom-scale  float       (default 1.08, clamp 1.01..2)
 *   data-am-duration    float s     (default 0.4, clamp 0.05..3)
 *   data-am-easing      string      (default 'ease-out')
 */

const globals = window.animicroFrontData || {};

function readFloat(raw, fallback) {
  if (raw === undefined || raw === null || raw === '') return fallback;
  const v = parseFloat(raw);
  return Number.isFinite(v) ? v : fallback;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function wrapImage(img) {
  const wrapper = document.createElement('span');
  wrapper.className = 'am-hover-zoom-frame';
  wrapper.style.display    = 'block';
  wrapper.style.overflow   = 'hidden';
  wrapper.style.position   = 'relative';
  wrapper.style.lineHeight = '0';
  wrapper.style.maxWidth   = '100%';

  const parent = img.parentNode;
  if (!parent) return null;
  parent.insertBefore(wrapper, img);
  wrapper.appendChild(img);

  img.style.display  = 'block';
  img.style.width    = '100%';
  img.style.height   = 'auto';
  img.style.maxWidth = '100%';

  return wrapper;
}

export function init() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const els = document.querySelectorAll('.am-hover-zoom');
  if (!els.length) return;

  const mod = (globals.moduleSettings && globals.moduleSettings['hover-zoom']) || {};
  const defScale    = readFloat(mod.zoomScale, 1.08);
  const defDuration = readFloat(mod.duration, 0.4);
  const defEasing   = mod.easing || 'ease-out';

  els.forEach((el) => {
    if (el.dataset.amHoverZoomInit === '1') return;
    el.dataset.amHoverZoomInit = '1';

    let frame, target;

    if (el.tagName === 'IMG') {
      const wrapper = wrapImage(el);
      if (!wrapper) return;
      frame  = wrapper;
      target = el;
    } else {
      frame  = el;
      target = el.querySelector('img') || el.firstElementChild || el;
      // Force the clip on the author's wrapper.
      frame.style.overflow = 'hidden';
    }

    const zoom     = clamp(readFloat(el.dataset.amZoomScale, defScale), 1.01, 2);
    const duration = clamp(readFloat(el.dataset.amDuration, defDuration), 0.05, 3);
    const easing   = el.dataset.amEasing || defEasing;

    target.style.willChange = 'transform';

    // Listen on the frame so the hover zone covers the whole clipped area
    // (otherwise hovering near the edge of an overscaled image would still
    // trigger fine, but the frame is the more natural hit target).
    frame.addEventListener('mouseenter', () => {
      animate(target, { scale: zoom }, { duration, easing });
    });
    frame.addEventListener('mouseleave', () => {
      animate(target, { scale: 1 }, { duration, easing });
    });
  });
}
