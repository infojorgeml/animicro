/**
 * Module registry with dynamic imports.
 * Only active modules are loaded (code-splitting via Vite).
 */

const MODULES = {
  'fade':        () => import('../modules/fade.js'),
  'slide-up':    () => import('../modules/slide.js'),
  'slide-down':  () => import('../modules/slide.js'),
  'slide-right': () => import('../modules/slide.js'),
  'slide-left':  () => import('../modules/slide.js'),
  'scale':       () => import('../modules/scale.js'),
  'blur':        () => import('../modules/blur.js'),
  'stagger':     () => import('../modules/stagger.js'),
  'grid-reveal': () => import('../modules/grid-reveal.js'),
  'highlight':        () => import('../modules/highlight.js'),
  'text-fill-scroll': () => import('../modules/text-fill-scroll.js'),
  'parallax':         () => import('../modules/parallax.js'),
  'scroll-slide-left':  () => import('../modules/scroll-slide.js'),
  'scroll-slide-right': () => import('../modules/scroll-slide.js'),
  'split':       () => import('../modules/split-text.js'),
  'scatter':     () => import('../modules/scatter.js'),
  'scramble':    () => import('../modules/scramble.js'),
  'text-reveal': () => import('../modules/text-reveal.js'),
  'typewriter':  () => import('../modules/typewriter.js'),
  'float':       () => import('../modules/float.js'),
  'pulse':       () => import('../modules/pulse.js'),
  'skew-up':     () => import('../modules/skew-up.js'),
  'flip-x':      () => import('../modules/flip.js'),
  'flip-y':      () => import('../modules/flip.js'),
  'hover-zoom':   () => import('../modules/hover-zoom.js'),
  'img-parallax': () => import('../modules/img-parallax.js'),
  'clip-reveal':  () => import('../modules/clip-reveal.js'),
  'ken-burns':    () => import('../modules/ken-burns.js'),
  'magnet':       () => import('../modules/magnet.js'),
  'magnetic':     () => import('../modules/magnetic.js'),
  'cursor':       () => import('../modules/cursor.js'),
  'spin':         () => import('../modules/spin.js'),
  'page-curtain': () => import('../modules/page-curtain.js'),
};

export async function loadModules(activeModules) {
  // Note: the browser caches resolved dynamic imports, so calling the same
  // loader twice (e.g. for slide-up + slide-down which share slide.js) is
  // a no-op on the second fetch. No manual dedup needed.
  for (const name of activeModules) {
    const loader = MODULES[name];
    if (!loader) continue;

    const mod = await loader();
    mod.init(name);
  }
}
