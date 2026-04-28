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
  'split':       () => import('../modules/split-text.js'),
  'text-reveal': () => import('../modules/text-reveal.js'),
  'typewriter':  () => import('../modules/typewriter.js'),
  'float':       () => import('../modules/float.js'),
  'pulse':       () => import('../modules/pulse.js'),
  'skew-up':     () => import('../modules/skew-up.js'),
  'hover-zoom':   () => import('../modules/hover-zoom.js'),
  'img-parallax': () => import('../modules/img-parallax.js'),
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
